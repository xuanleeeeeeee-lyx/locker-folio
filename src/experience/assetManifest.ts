/* ============================================================================
 * 首屏资源清单 AssetManifest
 *
 * 这里是全站资源的**唯一事实来源**：
 *   1. 每项资源记录 id / url / 类型 / 分组 / 是否首屏阻塞 / 是否 preload /
 *      预期体积 / 解码方式 / fallback / 授权来源 / 版本哈希。
 *   2. Loader 只统计本清单中的真实事件（请求完成、decode() 完成），
 *      不再使用固定计时的假进度。
 *   3. index.html 里的 <link rel="preload"> 必须与 PRELOAD_ASSETS 一一对应，
 *      开发模式下 auditPreloadLinks() 会校验两边是否漂移。
 *
 * 约定：
 *   - version 是文件内容 sha256 前 8 位，**不拼进 URL**。
 *     拼进 URL 会和 <img src="/assets/..."> 产生两次不同缓存键的请求。
 *     换图后请用下面的命令重新生成：
 *       shasum -a 256 public/assets/<path> | cut -c1-8
 *   - bytes 是磁盘上的真实传输体积，Loader 用它做加权进度，
 *     所以换图后 bytes 也要同步更新（stat -f%z）。
 * ========================================================================== */

import { useSyncExternalStore } from 'react'

/* ── 类型 ─────────────────────────────────────────────────── */

export type AssetKind = 'image' | 'font'

export type AssetGroup =
  | 'hero.prop' // 柜内立体物件：首屏阻塞
  | 'hero.decal' // 柜门贴纸：首屏阻塞，但缺失可降级
  | 'type.display' // 网页字体阶段
  | 'work.poster'
  | 'work.photo'
  | 'work.cover'
  | 'work.magazine'

/** 资源失败后的处置方式 */
export type FailPolicy =
  /** 冒泡到 Loader 的错误态，提供重试；不阻止最终放行 */
  | 'error'
  /** 静默降级，只写开发期日志 */
  | 'degrade'

/**
 * 响应式派生图。由 scripts/gen-image-variants.mjs 生成，
 * 运行时由 src/components/work/imageSources.ts 的 workImage() 拼成 srcset，
 * 浏览器按显示尺寸和 DPR 只取其中一张 —— 所以变体是同一份资源的不同档位，
 * 不是彼此独立的资源，登记为 entry 的子项而不是并列条目。
 */
export type AssetVariant = {
  /** 像素宽，对应 srcset 的 <w> 描述符 */
  width: number
  url: string
  bytes: number
  version: string
}

export type AssetEntry = {
  /** 稳定 ID，供状态机/热点引用 */
  id: string
  /** 站点根绝对路径，必须与 DOM 中 <img src> 完全一致 */
  url: string
  kind: AssetKind
  group: AssetGroup
  /** 首屏阻塞：Loader 必须等它 ready 才允许走到 100% */
  blocking: boolean
  /** 是否写进 index.html 的 <link rel="preload"> */
  preload: boolean
  /** 预期传输体积（字节），用于加权进度 */
  bytes: number
  /** 解码方式：图片走 HTMLImageElement.decode()，字体走 document.fonts.ready */
  decode: 'img-decode' | 'font-ready'
  /** 失败降级目标；null 表示没有备用资源 */
  fallback: string | null
  onFail: FailPolicy
  /** 单项超时上限（毫秒） */
  timeoutMs: number
  /** 内容授权来源。TODO：原始素材授权尚未确认 */
  license: string
  /** 内容哈希前 8 位 */
  version: string
  /** 响应式派生档位；首屏物件图没有变体，为空数组 */
  variants: readonly AssetVariant[]
}

const DEFAULT_TIMEOUT = 9_000
const LICENSE_TODO = 'unverified/待确认'

/** Hero 直接采样的实体表面纹理：首屏必须全部可用于渲染 */
function prop(
  id: string,
  url: string,
  bytes: number,
  version: string,
  preload = false,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group: 'hero.prop',
    blocking: true,
    preload,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'error',
    timeoutMs: DEFAULT_TIMEOUT,
    license: LICENSE_TODO,
    version,
    variants: [],
  }
}

/** 柜门贴纸：首屏可见，但单张缺失不影响主结构可读，失败静默降级 */
function decal(
  id: string,
  url: string,
  bytes: number,
  version: string,
  preload = false,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group: 'hero.decal',
    blocking: true,
    preload,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'degrade',
    timeoutMs: 8_000,
    license: LICENSE_TODO,
    version,
    variants: [],
  }
}

/** 作品页资源：全部非阻塞，进入对应栏目时按需加载 */
function lazyAsset(
  id: string,
  url: string,
  group: AssetGroup,
  bytes: number,
  version: string,
): AssetEntry {
  return {
    id,
    url,
    kind: 'image',
    group,
    blocking: false,
    preload: false,
    bytes,
    decode: 'img-decode',
    fallback: null,
    onFail: 'degrade',
    timeoutMs: DEFAULT_TIMEOUT,
    license: LICENSE_TODO,
    version,
    // 作品图按栏目显示宽度生成了 1x / 2x 档位，见 WORK_VARIANTS
    variants: WORK_VARIANTS[url] ?? [],
  }
}

/* ── 清单本体 ─────────────────────────────────────────────── */

/**
 * 当前 Hero 会直接交给 Three.js 的实体表面纹理。
 *
 * 唱机、书、背包、文件袋、打字机、吉他与门托盘都已经换成程序化实体网格，
 * 不再把旧透明 WebP 当作材质；右门只保留 polaroids.webp 作为三张实体卡
 * 的组合印刷层。这里必须只登记真实的纹理请求，否则 Loader 虽然
 * 显示 100%，实际上却是在等待场景根本不会用到的旧图片。
 */
const HERO_PROPS: AssetEntry[] = [
  prop('hero.posterwall', '/assets/obj/posterwall.webp', 83900, '2e4607b3', true),
  prop('hero.findaword', '/assets/obj/findaword2.webp', 30894, '193897a8', true),
  prop('hero.door4.polaroids', '/assets/obj2/polaroids.webp', 65492, 'df8d6564', true),
]

/**
 * 柜门贴花。
 *
 * `hero.decalAtlas` 是 scripts/assets/pack-decals.mjs 打的**构建期图集**。
 * DecalField 只上传这张图集；decalSpecs 里的单图 URL 只是图集 UV 的稳定键，
 * 运行时不会逐张请求。因此 Loader 也只等待这一个真实请求。
 */
const HERO_DECALS: AssetEntry[] = [
  decal('hero.decalAtlas', '/assets/obj2/doorDecals.webp', 244656, 'ee25f01c', true),
]

/**
 * 字体阶段。Google Fonts 由 <link rel="stylesheet"> 拉取，
 * 这里只把「字体是否可用」作为一个可计量的阶段接进进度条。
 * 超时后直接放行，字体失败绝不阻塞站点。
 */
const TYPE_STAGE: AssetEntry = {
  id: 'type.display',
  url: 'https://fonts.googleapis.com/css2?family=Ultra…',
  kind: 'font',
  group: 'type.display',
  blocking: true,
  preload: false,
  // 名义权重：不代表真实字节数，只让字体阶段在进度条里占约 2.5% 的一小格。
  // 注意 document.fonts.ready 在没有待加载字体时会立即 resolve，
  // 所以这一格常常很快就满，权重必须给小。
  bytes: 24_000,
  decode: 'font-ready',
  fallback: 'system-ui 尺寸校准回退栈（见 global.css --font-*）',
  onFail: 'degrade',
  timeoutMs: 2_500,
  license: 'Google Fonts / OFL',
  version: 'css2-2026-08',
  variants: [],
}

/**
 * 作品图的响应式派生档位。
 *
 * 这一整段与下面的 WORK_ASSETS 都由 `scripts/assets/sync-work-manifest.mjs`
 * 从 public/assets/ 生成（标记之间勿手改）：换一批作品图之后跑一次，
 * 就会按磁盘上的真实文件补齐登记、体积与版本哈希。
 * 宽度档位必须与 scripts/gen-image-variants.mjs 和 imageSources.ts 的 VARIANTS 一致。
 */
const WORK_VARIANTS: Record<string, readonly AssetVariant[]> = {
/* WORK_VARIANTS:BEGIN */
  '/assets/photo/w1.webp': [
    { width: 300, url: '/assets/photo/w1-300.webp', bytes: 12838, version: 'ccb41c5c' },
    { width: 600, url: '/assets/photo/w1-600.webp', bytes: 42766, version: '6401a8ac' },
  ],
  '/assets/photo/w10.webp': [
    { width: 300, url: '/assets/photo/w10-300.webp', bytes: 15128, version: '082eebfe' },
    { width: 600, url: '/assets/photo/w10-600.webp', bytes: 50952, version: '2d3f6181' },
  ],
  '/assets/photo/w11.webp': [
    { width: 300, url: '/assets/photo/w11-300.webp', bytes: 13444, version: '95ada411' },
    { width: 600, url: '/assets/photo/w11-600.webp', bytes: 40060, version: 'b8a49a66' },
  ],
  '/assets/photo/w12.webp': [
    { width: 300, url: '/assets/photo/w12-300.webp', bytes: 12266, version: 'df0c1d2d' },
    { width: 600, url: '/assets/photo/w12-600.webp', bytes: 35480, version: '52b0b648' },
  ],
  '/assets/photo/w2.webp': [
    { width: 300, url: '/assets/photo/w2-300.webp', bytes: 7918, version: '39a35521' },
    { width: 600, url: '/assets/photo/w2-600.webp', bytes: 22228, version: '17da02e4' },
  ],
  '/assets/photo/w3.webp': [
    { width: 300, url: '/assets/photo/w3-300.webp', bytes: 12234, version: 'e5f53fc3' },
    { width: 600, url: '/assets/photo/w3-600.webp', bytes: 34538, version: '657498cc' },
  ],
  '/assets/photo/w4.webp': [
    { width: 300, url: '/assets/photo/w4-300.webp', bytes: 7378, version: '3dc7d1fa' },
    { width: 600, url: '/assets/photo/w4-600.webp', bytes: 22916, version: 'ed75dbab' },
  ],
  '/assets/photo/w5.webp': [
    { width: 300, url: '/assets/photo/w5-300.webp', bytes: 13010, version: '6fee0f89' },
    { width: 600, url: '/assets/photo/w5-600.webp', bytes: 41460, version: 'b0c40799' },
  ],
  '/assets/photo/w6.webp': [
    { width: 300, url: '/assets/photo/w6-300.webp', bytes: 18960, version: '2da6bd17' },
    { width: 600, url: '/assets/photo/w6-600.webp', bytes: 58882, version: '772556ad' },
  ],
  '/assets/photo/w7.webp': [
    { width: 300, url: '/assets/photo/w7-300.webp', bytes: 10904, version: '5768c184' },
    { width: 600, url: '/assets/photo/w7-600.webp', bytes: 35992, version: 'feb1c60f' },
  ],
  '/assets/photo/w8.webp': [
    { width: 300, url: '/assets/photo/w8-300.webp', bytes: 16886, version: '377ee816' },
    { width: 600, url: '/assets/photo/w8-600.webp', bytes: 52706, version: '11ffe472' },
  ],
  '/assets/photo/w9.webp': [
    { width: 300, url: '/assets/photo/w9-300.webp', bytes: 12818, version: 'e1a964ef' },
    { width: 600, url: '/assets/photo/w9-600.webp', bytes: 37794, version: '4656e96e' },
  ],
  '/assets/posters/s1.webp': [
    { width: 400, url: '/assets/posters/s1-400.webp', bytes: 26146, version: '738d5009' },
  ],
  '/assets/posters/s10.webp': [
    { width: 400, url: '/assets/posters/s10-400.webp', bytes: 24174, version: '5f82dc0d' },
  ],
  '/assets/posters/s11.webp': [
    { width: 400, url: '/assets/posters/s11-400.webp', bytes: 33548, version: '5ecbbc97' },
  ],
  '/assets/posters/s2.webp': [
    { width: 400, url: '/assets/posters/s2-400.webp', bytes: 34388, version: 'c88d2d27' },
  ],
  '/assets/posters/s3.webp': [
    { width: 400, url: '/assets/posters/s3-400.webp', bytes: 18522, version: 'b827dca6' },
  ],
  '/assets/posters/s4.webp': [
    { width: 400, url: '/assets/posters/s4-400.webp', bytes: 20928, version: 'a80b0f33' },
  ],
  '/assets/posters/s5.webp': [
    { width: 400, url: '/assets/posters/s5-400.webp', bytes: 26282, version: '559795a3' },
  ],
  '/assets/posters/s6.webp': [
    { width: 400, url: '/assets/posters/s6-400.webp', bytes: 39880, version: '1089eac6' },
  ],
  '/assets/posters/s7.webp': [
    { width: 400, url: '/assets/posters/s7-400.webp', bytes: 18830, version: '6475dc89' },
  ],
  '/assets/posters/s8.webp': [
    { width: 400, url: '/assets/posters/s8-400.webp', bytes: 33266, version: 'cccc335d' },
  ],
  '/assets/posters/s9.webp': [
    { width: 400, url: '/assets/posters/s9-400.webp', bytes: 34982, version: '63fb8fa1' },
  ],
  '/assets/mag/cover.webp': [
    { width: 420, url: '/assets/mag/cover-420.webp', bytes: 27438, version: '825a2e34' },
  ],
  '/assets/mag/d1l.webp': [
    { width: 420, url: '/assets/mag/d1l-420.webp', bytes: 40516, version: 'bdafdc8b' },
  ],
  '/assets/mag/d1r.webp': [
    { width: 420, url: '/assets/mag/d1r-420.webp', bytes: 32518, version: 'a65d9cb6' },
  ],
  '/assets/mag/d2l.webp': [
    { width: 420, url: '/assets/mag/d2l-420.webp', bytes: 20968, version: '278ea82e' },
  ],
  '/assets/mag/d2r.webp': [
    { width: 420, url: '/assets/mag/d2r-420.webp', bytes: 27500, version: '4de00ec9' },
  ],
  '/assets/mag/d3l.webp': [
    { width: 420, url: '/assets/mag/d3l-420.webp', bytes: 24608, version: '331ae720' },
  ],
  '/assets/mag/d3r.webp': [
    { width: 420, url: '/assets/mag/d3r-420.webp', bytes: 28618, version: 'a0705924' },
  ],
  '/assets/mag/d4l.webp': [
    { width: 420, url: '/assets/mag/d4l-420.webp', bytes: 36704, version: '102ded0e' },
  ],
  '/assets/mag/d4r.webp': [
    { width: 420, url: '/assets/mag/d4r-420.webp', bytes: 34172, version: 'daff3d24' },
  ],
  '/assets/mag/d5l.webp': [
    { width: 420, url: '/assets/mag/d5l-420.webp', bytes: 43862, version: 'ea9b8647' },
  ],
  '/assets/mag/d5r.webp': [
    { width: 420, url: '/assets/mag/d5r-420.webp', bytes: 56006, version: '60d133e6' },
  ],
  '/assets/mag/d6l.webp': [
    { width: 420, url: '/assets/mag/d6l-420.webp', bytes: 31876, version: '94310648' },
  ],
  '/assets/mag/d6r.webp': [
    { width: 420, url: '/assets/mag/d6r-420.webp', bytes: 28968, version: '90ad9463' },
  ],
  '/assets/cover/v1.webp': [
    { width: 480, url: '/assets/cover/v1-480.webp', bytes: 19436, version: '6d667192' },
    { width: 760, url: '/assets/cover/v1-760.webp', bytes: 36280, version: '3891d9ab' },
  ],
  '/assets/cover/v2.webp': [
    { width: 480, url: '/assets/cover/v2-480.webp', bytes: 16962, version: '1b908d59' },
    { width: 760, url: '/assets/cover/v2-760.webp', bytes: 30924, version: '722e4dcd' },
  ],
  '/assets/cover/v3.webp': [
    { width: 480, url: '/assets/cover/v3-480.webp', bytes: 22284, version: '5cae5f97' },
    { width: 760, url: '/assets/cover/v3-760.webp', bytes: 43834, version: '30adfb94' },
  ],
  '/assets/cover/v4.webp': [
    { width: 480, url: '/assets/cover/v4-480.webp', bytes: 25556, version: '3e402596' },
    { width: 760, url: '/assets/cover/v4-760.webp', bytes: 44496, version: 'd651c5b1' },
  ],
  '/assets/cover/v5.webp': [
    { width: 480, url: '/assets/cover/v5-480.webp', bytes: 17080, version: '177267b5' },
    { width: 760, url: '/assets/cover/v5-760.webp', bytes: 28886, version: '8aabac0b' },
  ],
  '/assets/cover/v6.webp': [
    { width: 480, url: '/assets/cover/v6-480.webp', bytes: 29890, version: 'cb824ac5' },
    { width: 760, url: '/assets/cover/v6-760.webp', bytes: 58964, version: '17271602' },
  ],
/* WORK_VARIANTS:END */
}
/** 作品页资源：非首屏阻塞 */
const WORK_ASSETS: AssetEntry[] = [
/* WORK_ASSETS:BEGIN */
  lazyAsset('photo.w1', '/assets/photo/w1.webp', 'work.photo', 84588, 'd4a8e05d'),
  lazyAsset('photo.w10', '/assets/photo/w10.webp', 'work.photo', 106330, '72f12c79'),
  lazyAsset('photo.w11', '/assets/photo/w11.webp', 'work.photo', 79350, '6b76c2fb'),
  lazyAsset('photo.w12', '/assets/photo/w12.webp', 'work.photo', 67296, 'd2dc2411'),
  lazyAsset('photo.w2', '/assets/photo/w2.webp', 'work.photo', 42574, '7f4b2c93'),
  lazyAsset('photo.w3', '/assets/photo/w3.webp', 'work.photo', 66274, '648943ff'),
  lazyAsset('photo.w4', '/assets/photo/w4.webp', 'work.photo', 45826, 'd5c1406e'),
  lazyAsset('photo.w5', '/assets/photo/w5.webp', 'work.photo', 80786, 'd71ac473'),
  lazyAsset('photo.w6', '/assets/photo/w6.webp', 'work.photo', 113958, '33a0bde0'),
  lazyAsset('photo.w7', '/assets/photo/w7.webp', 'work.photo', 69698, '98e26550'),
  lazyAsset('photo.w8', '/assets/photo/w8.webp', 'work.photo', 105250, 'df869eec'),
  lazyAsset('photo.w9', '/assets/photo/w9.webp', 'work.photo', 72274, '63470958'),
  lazyAsset('poster.s1', '/assets/posters/s1.webp', 'work.poster', 51708, 'ddd04e17'),
  lazyAsset('poster.s10', '/assets/posters/s10.webp', 'work.poster', 54914, '82851868'),
  lazyAsset('poster.s11', '/assets/posters/s11.webp', 'work.poster', 77426, '3aa4d341'),
  lazyAsset('poster.s2', '/assets/posters/s2.webp', 'work.poster', 77700, 'aedc729c'),
  lazyAsset('poster.s3', '/assets/posters/s3.webp', 'work.poster', 41230, 'a0291936'),
  lazyAsset('poster.s4', '/assets/posters/s4.webp', 'work.poster', 43000, '442e0aa1'),
  lazyAsset('poster.s5', '/assets/posters/s5.webp', 'work.poster', 61518, 'df47dc6e'),
  lazyAsset('poster.s6', '/assets/posters/s6.webp', 'work.poster', 92176, '678497fc'),
  lazyAsset('poster.s7', '/assets/posters/s7.webp', 'work.poster', 43938, '9e1797a7'),
  lazyAsset('poster.s8', '/assets/posters/s8.webp', 'work.poster', 76514, '034a1cda'),
  lazyAsset('poster.s9', '/assets/posters/s9.webp', 'work.poster', 81884, '3acb2188'),
  lazyAsset('mag.cover', '/assets/mag/cover.webp', 'work.magazine', 58128, 'f643da4b'),
  lazyAsset('mag.d1l', '/assets/mag/d1l.webp', 'work.magazine', 94036, '86998e6c'),
  lazyAsset('mag.d1r', '/assets/mag/d1r.webp', 'work.magazine', 74010, '9dbbb7bf'),
  lazyAsset('mag.d2l', '/assets/mag/d2l.webp', 'work.magazine', 45036, '378356cb'),
  lazyAsset('mag.d2r', '/assets/mag/d2r.webp', 'work.magazine', 65514, '3abf48d3'),
  lazyAsset('mag.d3l', '/assets/mag/d3l.webp', 'work.magazine', 60170, '9d44eb01'),
  lazyAsset('mag.d3r', '/assets/mag/d3r.webp', 'work.magazine', 69560, '040e9e68'),
  lazyAsset('mag.d4l', '/assets/mag/d4l.webp', 'work.magazine', 83054, '7d6fc5e3'),
  lazyAsset('mag.d4r', '/assets/mag/d4r.webp', 'work.magazine', 80660, '24b19730'),
  lazyAsset('mag.d5l', '/assets/mag/d5l.webp', 'work.magazine', 97912, 'a6df817b'),
  lazyAsset('mag.d5r', '/assets/mag/d5r.webp', 'work.magazine', 135376, 'ef748904'),
  lazyAsset('mag.d6l', '/assets/mag/d6l.webp', 'work.magazine', 78306, 'a19678d2'),
  lazyAsset('mag.d6r', '/assets/mag/d6r.webp', 'work.magazine', 68950, 'ff775101'),
  lazyAsset('cover.v1', '/assets/cover/v1.webp', 'work.cover', 71010, '794c66da'),
  lazyAsset('cover.v2', '/assets/cover/v2.webp', 'work.cover', 56520, '3ce2bf54'),
  lazyAsset('cover.v3', '/assets/cover/v3.webp', 'work.cover', 95996, '9eeec886'),
  lazyAsset('cover.v4', '/assets/cover/v4.webp', 'work.cover', 76452, 'b44afe90'),
  lazyAsset('cover.v5', '/assets/cover/v5.webp', 'work.cover', 48416, 'c8600b32'),
  lazyAsset('cover.v6', '/assets/cover/v6.webp', 'work.cover', 122612, '48978758'),
/* WORK_ASSETS:END */
]

/** 全站资源清单 */
export const ASSET_MANIFEST: readonly AssetEntry[] = [
  ...HERO_PROPS,
  ...HERO_DECALS,
  TYPE_STAGE,
  ...WORK_ASSETS,
]

/** 首屏阻塞资源：只有 Hero 真正采样的纹理 + 字体阶段 */
export const BLOCKING_ASSETS: readonly AssetEntry[] = ASSET_MANIFEST.filter((a) => a.blocking)

/** 需要在 index.html 里 <link rel="preload"> 的资源 */
export const PRELOAD_ASSETS: readonly AssetEntry[] = ASSET_MANIFEST.filter((a) => a.preload)

export const ASSETS_BY_ID: ReadonlyMap<string, AssetEntry> = new Map(
  ASSET_MANIFEST.map((a) => [a.id, a]),
)

export function assetsInGroup(group: AssetGroup): AssetEntry[] {
  return ASSET_MANIFEST.filter((a) => a.group === group)
}

/**
 * 各栏目的派生档位宽度，从清单实际登记的变体反推。
 * imageSources.ts 目前自己硬编码了一份同样的宽度表；以清单为准，
 * 两边不一致时开发期的 auditWorkImageSources() 会点名。
 */
export const VARIANT_WIDTHS: Readonly<Partial<Record<AssetGroup, readonly number[]>>> =
  ASSET_MANIFEST.reduce<Partial<Record<AssetGroup, readonly number[]>>>((acc, a) => {
    if (a.variants.length > 0 && acc[a.group] === undefined) {
      acc[a.group] = a.variants.map((v) => v.width)
    }
    return acc
  }, {})

/** 清单里登记的全部文件数（原图 + 派生档位） */
export const ASSET_FILE_COUNT = ASSET_MANIFEST.reduce(
  (n, a) => n + (a.kind === 'image' ? 1 + a.variants.length : 0),
  0,
)

const BLOCKING_BYTES = BLOCKING_ASSETS.reduce((n, a) => n + a.bytes, 0)

/* ============================================================================
 * 运行时：真实进度统计
 * ========================================================================== */

export type AssetStatus =
  | 'pending' // 尚未开始
  | 'loading' // 请求中
  | 'decoding' // 网络已完成，正在 decode()
  | 'ready' // 已 decode，可用于渲染
  | 'degraded' // 失败但允许放行
  | 'failed' // 失败且需要提示重试

export type AssetRuntime = {
  entry: AssetEntry
  status: AssetStatus
  attempts: number
  /** 请求完成耗时（毫秒） */
  netMs: number | null
  /** decode() 耗时（毫秒） */
  decodeMs: number | null
  error: string | null
}

export type LoadSnapshot = {
  /** 0–100 的真实进度，单调递增 */
  progress: number
  /** 所有阻塞资源都有了结果（成功、降级或失败） */
  settled: boolean
  /** settled 且没有需要提示的硬失败 */
  ok: boolean
  /** 正在重试中 */
  retrying: boolean
  /** 需要提示的失败项 */
  failed: readonly AssetRuntime[]
  /** 已经 ready 的阻塞项数量 */
  readyCount: number
  /** 阻塞项总数 */
  totalCount: number
  /** 从开始加载到现在（或到 settled）的毫秒数 */
  elapsedMs: number
  items: readonly AssetRuntime[]
}

/** 网络阶段在单项权重里占的比例，剩下的归 decode() */
const NET_SHARE = 0.55
const MAX_ATTEMPTS = 3
const RETRY_BACKOFF = [350, 1_000]
/**
 * 首屏加载硬预算。到点仍未结算的项一律按各自的 onFail 就地结算，
 * 保证 Loader 无论如何都会在这个时间内走完 100%，不会永久卡住。
 */
const HARD_DEADLINE_MS = 12_000

const runtimes: AssetRuntime[] = BLOCKING_ASSETS.map((entry) => ({
  entry,
  status: 'pending',
  attempts: 0,
  netMs: null,
  decodeMs: null,
  error: null,
}))

/** 持有 Image 引用，避免解码结果在 DOM 用到之前被回收 */
const warmed: HTMLImageElement[] = []

const listeners = new Set<() => void>()
let startedAt = 0
let settledAt = 0
let progressFloor = 0
let retryingCount = 0
let snapshot: LoadSnapshot = buildSnapshot()
let loadPromise: Promise<LoadSnapshot> | null = null
/** 硬预算到点后置位，正在重试的项会就地停下，不再把状态拉回 loading */
let aborted = false

function isSettled(status: AssetStatus) {
  return status === 'ready' || status === 'degraded' || status === 'failed'
}

function statusShare(rt: AssetRuntime): number {
  switch (rt.status) {
    case 'pending':
      return 0
    case 'loading':
      return 0
    case 'decoding':
      return NET_SHARE
    default:
      // ready / degraded / failed 都算已结算，保证进度不会卡住
      return 1
  }
}

function buildSnapshot(): LoadSnapshot {
  let weighted = 0
  let readyCount = 0
  const failed: AssetRuntime[] = []
  let settled = true

  for (const rt of runtimes) {
    weighted += rt.entry.bytes * statusShare(rt)
    if (rt.status === 'ready') readyCount += 1
    if (rt.status === 'failed') failed.push(rt)
    if (rt.status === 'pending' || rt.status === 'loading' || rt.status === 'decoding') {
      settled = false
    }
  }

  const raw = BLOCKING_BYTES > 0 ? (weighted / BLOCKING_BYTES) * 100 : 100
  // 单调递增：显示值只允许往上走
  progressFloor = Math.max(progressFloor, Math.min(100, raw))

  return {
    progress: settled ? 100 : Math.min(99, progressFloor),
    settled,
    ok: settled && failed.length === 0,
    retrying: retryingCount > 0,
    failed,
    readyCount,
    totalCount: runtimes.length,
    elapsedMs: startedAt === 0 ? 0 : (settledAt || performance.now()) - startedAt,
    items: runtimes,
  }
}

function emit() {
  snapshot = buildSnapshot()
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

/** 加载一张图片：load 事件记网络耗时，decode() 完成才算真正可渲染 */
function warmImage(rt: AssetRuntime, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    warmed.push(img)
    img.decoding = 'async'
    // 透明物件图没有跨域需求，crossOrigin 留空以复用 <img> 的缓存键
    const t0 = performance.now()
    let done = false

    const timer = window.setTimeout(() => {
      if (done) return
      done = true
      img.src = ''
      reject(new Error(`超时 ${rt.entry.timeoutMs}ms`))
    }, rt.entry.timeoutMs)

    const fail = (msg: string) => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      reject(new Error(msg))
    }

    img.onerror = () => fail('请求失败或不是可解码的图片')
    img.onload = () => {
      if (done) return
      rt.netMs = performance.now() - t0
      rt.status = 'decoding'
      emit()
      const t1 = performance.now()
      const finish = () => {
        if (done) return
        done = true
        window.clearTimeout(timer)
        rt.decodeMs = performance.now() - t1
        resolve()
      }
      // 部分浏览器对游离节点的 decode() 会抛 EncodingError，
      // 但 load 已成功说明位图可用，按成功处理即可。
      img.decode().then(finish, finish)
    }

    img.src = url
  })
}

/**
 * Loader 首屏真正用到的字面。
 * Ultra 是超粗板衬，回退栈里的 Playfair / serif 是细衬线，两者差距极大，
 * 换字的瞬间非常刺眼，所以必须点名等这一支。
 */
const CRITICAL_FACES = ['400 1em Ultra', '300 1em Inter']

function warmFonts(rt: AssetRuntime): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve()
  const t0 = performance.now()
  rt.status = 'decoding'
  emit()
  // 只等 document.fonts.ready 是不够的：还没有任何字面进入待加载队列时它会立刻
  // resolve，于是这一格瞬间就满，但 Ultra 其实还在路上。先用 fonts.load() 把
  // 关键字面显式拉起来，再等整体 ready，这一格才代表真实状态。
  const load = Promise.all(CRITICAL_FACES.map((f) => document.fonts.load(f)))
    .then(() => document.fonts.ready)
    .then(() => undefined)
  return Promise.race([
    load,
    sleep(rt.entry.timeoutMs).then(() => {
      throw new Error(`字体未在 ${rt.entry.timeoutMs}ms 内就绪，使用回退字体栈`)
    }),
  ]).then(() => {
    rt.decodeMs = performance.now() - t0
  })
}

async function runOne(rt: AssetRuntime) {
  // 字体阶段本身已经带超时，重试没有意义，只会白白吃掉首屏预算
  const maxAttempts = rt.entry.decode === 'font-ready' ? 1 : MAX_ATTEMPTS

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (aborted) break
    rt.attempts = attempt
    rt.status = 'loading'
    rt.error = null
    emit()
    try {
      if (rt.entry.decode === 'font-ready') await warmFonts(rt)
      else await warmImage(rt, rt.entry.url)
      rt.status = 'ready'
      emit()
      return
    } catch (err) {
      rt.error = err instanceof Error ? err.message : String(err)
      if (attempt < maxAttempts && !aborted) {
        await sleep(RETRY_BACKOFF[attempt - 1] ?? 1_000)
        continue
      }
    }
  }

  // 重试用尽：先试 fallback，再按 onFail 决定是否需要提示用户
  if (!aborted && rt.entry.fallback && rt.entry.decode === 'img-decode') {
    try {
      await warmImage(rt, rt.entry.fallback)
      rt.status = 'degraded'
      emit()
      return
    } catch {
      /* fallback 也失败，继续往下 */
    }
  }
  if (isSettled(rt.status)) return
  rt.status = rt.entry.onFail === 'degrade' ? 'degraded' : 'failed'
  emit()
}

/** 硬预算到点：把还没结果的项就地结算，Loader 才不会无限等下去 */
function forceSettle() {
  aborted = true
  let changed = false
  for (const rt of runtimes) {
    if (isSettled(rt.status)) continue
    rt.error = rt.error ?? `超出首屏加载预算 ${HARD_DEADLINE_MS}ms`
    rt.status = rt.entry.onFail === 'degrade' ? 'degraded' : 'failed'
    changed = true
  }
  if (changed) emit()
}

/** 启动首屏阻塞资源加载（幂等，返回同一个 promise） */
export function startBlockingLoad(): Promise<LoadSnapshot> {
  if (loadPromise) return loadPromise
  startedAt = performance.now()
  emit()
  const watchdog = window.setTimeout(forceSettle, HARD_DEADLINE_MS)
  loadPromise = Promise.all(runtimes.map(runOne)).then(() => {
    window.clearTimeout(watchdog)
    settledAt = performance.now()
    emit()
    if (import.meta.env.DEV) {
      reportToConsole()
      void auditPreloadLinks()
      void auditWorkImageSources()
    }
    return snapshot
  })
  return loadPromise
}

/** 供后续状态机 await 的就绪 promise */
export function blockingAssetsReady(): Promise<LoadSnapshot> {
  return startBlockingLoad()
}

/** 重试所有硬失败项。进度保持在原位不回退，成功后错误态自动消失 */
export function retryFailedAssets(): void {
  const broken = runtimes.filter((rt) => rt.status === 'failed')
  if (broken.length === 0) return
  // 用户显式重试：解除硬预算，并给这批资源一个新的预算窗口
  aborted = false
  window.setTimeout(forceSettle, HARD_DEADLINE_MS)
  retryingCount += broken.length
  emit()
  for (const rt of broken) {
    void runOne(rt).finally(() => {
      retryingCount = Math.max(0, retryingCount - 1)
      emit()
    })
  }
}

/** 字体阶段的资源 ID */
export const FONT_STAGE_ID = 'type.display'

/**
 * 展示字体是否已经可以用来排版（含超时降级）。
 * Loader 用它决定 WELCOME 什么时候上屏，避免细衬线回退跳成 Ultra。
 */
export function isDisplayFontReady(snap: LoadSnapshot): boolean {
  const rt = snap.items.find((i) => i.entry.id === FONT_STAGE_ID)
  return rt === undefined || isSettled(rt.status)
}

/** React 订阅入口 */
export function useBlockingAssets(): LoadSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}

/* ============================================================================
 * 开发期报告
 * ========================================================================== */

function reportToConsole() {
  const rows = runtimes.map((rt) => ({
    id: rt.entry.id,
    状态: rt.status,
    分组: rt.entry.group,
    'KB': Math.round(rt.entry.bytes / 102.4) / 10,
    '网络ms': rt.netMs === null ? '-' : Math.round(rt.netMs),
    '解码ms': rt.decodeMs === null ? '-' : Math.round(rt.decodeMs),
    次数: rt.attempts,
    url: rt.entry.url,
  }))
  const bad = runtimes.filter((rt) => rt.status === 'failed' || rt.status === 'degraded')
  const total = Math.round(snapshot.elapsedMs)
  const net = Math.max(0, ...runtimes.map((r) => r.netMs ?? 0))
  const dec = Math.max(0, ...runtimes.map((r) => r.decodeMs ?? 0))

  console.groupCollapsed(
    `[assets] 首屏阻塞 ${snapshot.readyCount}/${snapshot.totalCount} ready · ` +
      `总耗时 ${total}ms · 最慢网络 ${Math.round(net)}ms · 最慢解码 ${Math.round(dec)}ms`,
  )
  console.table(rows)
  if (bad.length > 0) {
    console.warn(
      '[assets] 失败/降级资源：\n' +
        bad.map((rt) => `  ${rt.status.padEnd(8)} ${rt.entry.url}  ← ${rt.error}`).join('\n'),
    )
  }
  reportSizeDrift()
  console.groupEnd()
}

/**
 * 清单登记的体积/版本会随素材重新压制而过期，进度加权就会失真。
 * 用 Resource Timing 的真实 encodedBodySize 对账，偏差超过 5% 就点名，
 * 提示按文件头的命令重新生成 bytes 和 version。零额外请求。
 */
function reportSizeDrift() {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return
  const seen = new Map<string, number>()
  for (const e of performance.getEntriesByType('resource')) {
    const size = (e as PerformanceResourceTiming).encodedBodySize
    if (size > 0) seen.set(new URL(e.name, location.origin).pathname, size)
  }
  const drift: string[] = []
  const check = (url: string, bytes: number) => {
    const real = seen.get(url)
    if (real === undefined) return
    if (Math.abs(real - bytes) / bytes > 0.05) drift.push(`${url}  清单 ${bytes}B → 实际 ${real}B`)
  }
  for (const a of ASSET_MANIFEST) {
    if (a.kind !== 'image') continue
    check(a.url, a.bytes)
    // 派生档位也要对账：srcset 实际取的往往是变体而不是原图
    for (const v of a.variants) check(v.url, v.bytes)
  }
  if (drift.length > 0) {
    console.warn(
      '[assets] 清单登记体积已过期，请重新生成 bytes / version：\n  ' + drift.join('\n  '),
    )
  }
}

/**
 * 跨模块契约检查：imageSources.ts 的 workImage() 自己拼 srcset，
 * 那份宽度表和本清单是两处独立的真相，改了一处忘了另一处就会请求到 404。
 * 这里把它真实生成的每个 URL 拿来和清单对一遍。
 *
 * 用动态 import 是为了不把作品页模块拽进主包；生产构建里整段是死代码。
 */
async function auditWorkImageSources(): Promise<void> {
  try {
    const { workImage } = await import('../components/work/imageSources')
    const known = new Set<string>()
    for (const a of ASSET_MANIFEST) {
      known.add(a.url)
      for (const v of a.variants) known.add(v.url)
    }
    const missing: string[] = []
    for (const a of ASSET_MANIFEST) {
      const m = /^\/assets\/(photo|posters|mag|cover)\/([^/]+)\.webp$/.exec(a.url)
      if (!m) continue
      const dir = m[1] as Parameters<typeof workImage>[0]
      const { src, srcSet } = workImage(dir, m[2])
      const urls = [src, ...srcSet.split(',').map((x) => x.trim().split(/\s+/)[0])]
      for (const u of urls) {
        if (!known.has(u)) missing.push(`${u}  ← workImage('${dir}', '${m[2]}')`)
      }
    }
    if (missing.length > 0) {
      console.warn('[assets] imageSources 会请求清单里没有登记的档位：\n  ' + missing.join('\n  '))
    }
  } catch {
    /* 作品页模块不可用时跳过，这只是开发期的一致性检查 */
  }
}

/**
 * 校验 index.html 的 preload 与清单是否一致，并确认 URL 真的返回图片
 * （SPA fallback 会用 HTML 冒充 200）。
 */
export async function auditPreloadLinks(): Promise<void> {
  if (typeof document === 'undefined') return
  const declared = new Set(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')).map(
      (l) => new URL(l.href, location.origin).pathname,
    ),
  )
  const expected = new Set(PRELOAD_ASSETS.map((a) => a.url))

  const missing = [...expected].filter((u) => !declared.has(u))
  const extra = [...declared].filter((u) => !expected.has(u))
  if (missing.length) console.warn('[preload] 清单里标了 preload 但 index.html 没写：', missing)
  if (extra.length) console.warn('[preload] index.html 多出的 preload（清单里没有）：', extra)

  const problems: string[] = []
  await Promise.all(
    [...declared].map(async (url) => {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'force-cache' })
        const type = res.headers.get('content-type') ?? ''
        if (!res.ok) problems.push(`${url} → HTTP ${res.status}`)
        else if (!type.startsWith('image/')) problems.push(`${url} → content-type ${type}（疑似 SPA fallback 返回 HTML）`)
      } catch (err) {
        problems.push(`${url} → ${err instanceof Error ? err.message : String(err)}`)
      }
    }),
  )
  if (problems.length) console.error('[preload] 预加载 URL 校验失败：\n  ' + problems.join('\n  '))
  else console.info(`[preload] ${declared.size} 条预加载 URL 全部真实返回图片`)
}

/* 模块被引入即开始加载，不等任何组件挂载（「页面启动后立即挂载资源层」） */
if (typeof window !== 'undefined') void startBlockingLoad()
