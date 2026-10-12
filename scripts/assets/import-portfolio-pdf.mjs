#!/usr/bin/env node
/**
 * 把作品集 / 简历 PDF 抽成站点各栏目需要的图（一次性导入工具，换作品集时重跑）。
 *
 *   node scripts/assets/import-portfolio-pdf.mjs <作品集.pdf> <简历.pdf>
 *
 * 为什么是「裁切」而不是「导出内嵌图」：作品集 PDF 是排版稿，页内的图片是排版片段
 * （截图、图表、手机壳），单张拿出来没有版面语境；而站点的每个栏目真正需要的是
 * 「有构图的一整块版面」，所以这里按 PDF 页面坐标裁，产出的是**版面图**。
 *
 * 产出（全部写进 public/assets/，随后由 gen-image-variants.mjs 生成响应式变体）：
 *   avatar.webp        工牌头像（简历里的证件照）
 *   cover/v1..v6.webp  影像封面 / 项目封面，16:9
 *   mag/cover + d1l..   样刊翻页：整页沿中缝对半开，一半就是 0.707 的竖版单页
 *   posters/s1..s11.webp 海报牌：竖版 2:3 版面裁切（3D 卡组用，必须 ≤ 11 张）
 *   photo/w1..w12.webp  视觉墙：整页横版版面
 *
 * 页面编号是 1 基的 PDF 页号；坐标用页面宽高的比例表示，换稿只需改下面的表。
 */
import { mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const assets = path.join(root, 'public/assets')
const tmp = path.join(root, 'tmp/pdf-import')

const [portfoliosPdf, resumePdf] = process.argv.slice(2)
if (!portfoliosPdf || !resumePdf) {
  console.error('用法：node scripts/assets/import-portfolio-pdf.mjs <作品集.pdf> <简历.pdf>')
  process.exit(1)
}

/** 页面渲染精度：150 DPI 下 1190×842pt 的横版页会渲染成 2480×1754 */
const DPI = 150
/** 各栏目母版的目标宽度（页面显示宽度的 2 倍，见 src/components/work/imageSources.ts） */
const MASTER_W = { cover: 1200, mag: 760, posters: 700, photo: 900 }

/* ── 裁切表 ──────────────────────────────────────────────
 * y/x/w/h 都是 0–1 的页面比例。
 * 封面统一取页面上部 16:9 的一块：这批作品集里每页的「主视觉」都在上半页，
 * 下半页是链接与说明文字，进封面会显得像截图。
 */
const COVERS = [
  { name: 'v1', page: 1, note: '抖音账号运营' },
  { name: 'v2', page: 2, note: '小红书账号运营' },
  { name: 'v3', page: 3, note: '给新闻人的告白（B站）' },
  { name: 'v4', page: 29, note: '疯狂星期四广告片', y: 0.1 },
  { name: 'v5', page: 17, note: '查客 FACT CHECKER' },
  { name: 'v6', page: 23, note: 'Phorganiser 禾狸' },
]

/** 样刊：整页左右对半 → 两个 0.707 竖版单页；spread() 会把同一页的两半拼回跨页 */
const SPREADS = [
  { page: 5, tag: 'd1', note: '历史沿革' },
  { page: 8, tag: 'd2', note: '评选标准' },
  { page: 10, tag: 'd3', note: '职业流变' },
  { page: 12, tag: 'd4', note: '她们的奖' },
  { page: 15, tag: 'd5', note: '她说' },
  { page: 16, tag: 'd6', note: '人物档案' },
]
/** 合上时露出的封面 = 标题页的左半 */
const MAG_COVER = { page: 4, note: '标题页' }

/** 海报牌：竖版 2:3 的版面裁切。x 是裁切起点（页面宽度比例） */
const POSTER_CROP_W = 2 / 3 // 相对页面高度的宽高比 → 换算到页宽比例见下
const POSTERS = [
  { page: 4, x: 0, note: '标题页 · 主视觉' },
  { page: 5, x: 0.264, note: '历史沿革' },
  { page: 6, x: 0.05, note: '足迹地图' },
  { page: 7, x: 0, note: '评选标准 · EN' },
  { page: 8, x: 0.528, note: '评选标准 · 中文' },
  { page: 9, x: 0, note: '职业流变 · EN' },
  { page: 11, x: 0, note: '她们的奖 · EN' },
  { page: 12, x: 0.528, note: '她们的奖 · 数据' },
  { page: 19, x: 0.264, note: '查客 · 用户画像' },
  { page: 26, x: 0.264, note: '禾狸 · 产品原型' },
  { page: 27, x: 0.264, note: '禾狸 · 视觉系统' },
]

/** 视觉墙：整页横版版面 */
const WALLS = [5, 6, 7, 11, 12, 15, 16, 18, 19, 24, 26, 27]

/* ── 渲染 ─────────────────────────────────────────────── */

async function renderPages(pdf, prefix) {
  const out = path.join(tmp, prefix)
  await mkdir(out, { recursive: true })
  execFileSync('python3', [
    '-c',
    `import pymupdf, sys, os
pdf, out, dpi = sys.argv[1], sys.argv[2], int(sys.argv[3])
d = pymupdf.open(pdf)
for i, page in enumerate(d):
    page.get_pixmap(dpi=dpi).save(os.path.join(out, 'p%02d.png' % (i + 1)))
print(d.page_count)`,
    pdf,
    out,
    String(DPI),
  ])
}

const pagePath = (n) => path.join(tmp, 'portfolio', `p${String(n).padStart(2, '0')}.png`)

async function pageMeta(n) {
  const m = await sharp(pagePath(n)).metadata()
  return { w: m.width, h: m.height }
}

/** 按页面比例裁切并输出 webp */
async function crop(page, box, out, targetW) {
  const { w: pw, h: ph } = await pageMeta(page)
  const left = Math.round((box.x ?? 0) * pw)
  const top = Math.round((box.y ?? 0) * ph)
  const width = Math.min(pw - left, Math.round((box.w ?? 1) * pw))
  const height = Math.min(ph - top, Math.round((box.h ?? 1) * ph))
  await mkdir(path.dirname(out), { recursive: true })
  await sharp(pagePath(page))
    .extract({ left, top, width, height })
    .resize({ width: targetW, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(out)
  const m = await sharp(out).metadata()
  return `${path.relative(root, out)}  ${m.width}×${m.height}`
}

/* ── 主流程 ───────────────────────────────────────────── */

console.log('渲染作品集页面…')
await renderPages(portfoliosPdf, 'portfolio')
const { w: PW, h: PH } = await pageMeta(1)
console.log(`  页面 ${PW}×${PH} @ ${DPI}dpi`)

const log = []

// 1. 16:9 封面
const coverH = Math.min(1, (PW * (9 / 16)) / PH)
for (const c of COVERS) {
  log.push(
    await crop(
      c.page,
      { y: c.y ?? 0, h: coverH },
      path.join(assets, 'cover', `${c.name}.webp`),
      MASTER_W.cover,
    ),
  )
}

// 2. 样刊：封面 + 每页对半
const half = { w: 0.5 }
log.push(await crop(MAG_COVER.page, { ...half, x: 0 }, path.join(assets, 'mag', 'cover.webp'), MASTER_W.mag))
for (const s of SPREADS) {
  log.push(await crop(s.page, { ...half, x: 0 }, path.join(assets, 'mag', `${s.tag}l.webp`), MASTER_W.mag))
  log.push(await crop(s.page, { ...half, x: 0.5 }, path.join(assets, 'mag', `${s.tag}r.webp`), MASTER_W.mag))
}

// 3. 海报牌：竖版 2:3
const posterW = (PH * POSTER_CROP_W) / PW
POSTERS.forEach((p, i) => {
  const x = Math.min(p.x, 1 - posterW)
  log.push(
    crop(p.page, { x, w: posterW, h: 1 }, path.join(assets, 'posters', `s${i + 1}.webp`), MASTER_W.posters),
  )
})
for (const r of await Promise.all(log.splice(log.length - POSTERS.length))) log.push(r)

// 4. 视觉墙：整页
for (const [i, page] of WALLS.entries()) {
  log.push(await crop(page, { x: 0, y: 0, w: 1, h: 1 }, path.join(assets, 'photo', `w${i + 1}.webp`), MASTER_W.photo))
}

// 5. 头像：简历里的证件照
console.log('抽取简历证件照…')
await mkdir(path.join(assets), { recursive: true })
const resumeTmp = path.join(tmp, 'resume.png')
execFileSync('python3', [
  '-c',
  `import pymupdf, sys
d = pymupdf.open(sys.argv[1])
for img in d[0].get_images(full=True):
    p = pymupdf.Pixmap(d, img[0])
    p.save(sys.argv[2])
    break`,
  resumePdf,
  resumeTmp,
])
await sharp(resumeTmp).webp({ quality: 88, effort: 6 }).toFile(path.join(assets, 'avatar.webp'))
log.push(`public/assets/avatar.webp  ${(await sharp(path.join(assets, 'avatar.webp')).metadata()).width}px 宽`)

console.log('\n产出：')
for (const l of log) console.log('  ' + l)
console.log('\n下一步：node scripts/gen-image-variants.mjs')
