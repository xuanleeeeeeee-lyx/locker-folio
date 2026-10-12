# Locker Folio

一个以储物柜为载体的交互式个人作品集：加载页 → 马赛克揭幕 → 柜体旋正推近并开门 →
柜内与门上的实体物件对应 ABOUT / SKILLS / SELECTED WORK / CONTACT 四个入口，
每件物件都能在自己的承载面上拖动，点击后镜头局部聚焦再挂载内容浮层。

首屏是真实的 Three.js 场景（柜体、柜门、隔板、打字机、吉他、唱片机等全是网格，
不是贴片），内容页是 DOM 浮层。

> **本项目是复刻练习。** 视觉创意来自小红书博主 **momo** 的 Locker 个人网站，
> 见文末「版权与致谢」。
>
> **当前站点内容为李怡璇（LI YIXUAN）的个人作品集**：文案取自她的简历与作品集，
> 作品图由作品集 PDF 自动裁切而来，见下文「内容的来源与替换」。

---

## 运行

```bash
bun install
bun run dev       # http://localhost:5178（监听所有网卡，手机可同网段访问）
bun run build     # tsc -b && vite build
bun run preview   # http://localhost:4178
```

Node 版工具链同样可用，但仓库锁文件是 `bun.lock`，请统一用 bun。

## 技术栈

| 用途 | 选型 |
| --- | --- |
| 框架 / 构建 | React 19、TypeScript、Vite 8 |
| 3D | three 0.185、@react-three/fiber 9、@react-three/drei 10 |
| 动画 | 自写主时间线（首屏）+ GSAP（海报入场） |
| 状态 | zustand + 一个纯函数状态机 |
| 质量 | TypeScript 严格模式、oxlint |

three + R3F 约 240KB gzip，用 `lazy()` 单独切 chunk，并在模块求值时就发起
`import()` 预热，让 chunk 下载与首屏图片加载并行（见 `src/App.tsx` 顶部注释）。

## 内容的来源与替换

站点的全部文案集中在 `src/data/content.ts`（一个文件即全部）；作品图是**从作品集
PDF 自动裁出来**的，不手工摆图。

```bash
# 1. 作品集 / 简历 PDF → public/assets 各栏目的母版图
node scripts/assets/import-portfolio-pdf.mjs <作品集.pdf> <简历.pdf>

# 2. 母版 → 响应式变体（按各栏目最大显示宽度的 1x / 2x）
node scripts/gen-image-variants.mjs

# 3. 作品资源清单（assetManifest.ts 里的 WORK_* 两段）按磁盘真值重写
node scripts/assets/sync-work-manifest.mjs
```

第 1 步里的**裁切表**（`COVERS` / `SPREADS` / `POSTERS` / `WALLS`）是唯一需要人工维护的
地方：每一行写明「用第几页、页面里的哪一块」。换作品集时改这张表即可 ——
页面比例是 0–1 的相对值，换版本时不会因为页面尺寸变化而错位。

各栏目对应的数据：

| 栏目 | content.ts 里的字段 | 素材目录 | 母版宽度 |
| --- | --- | --- | --- |
| 影像 VIDEO | `VIDEOS` | `cover/` | 1200（16:9） |
| 版面设计 DESIGN | `POSTERS` + `MAGAZINE_PAGES` | `posters/`、`mag/` | 700（2:3）、760（0.707 单页） |
| 视觉墙 VISUAL WALL | `PHOTOS` | `photo/` | 900（横版整页） |
| 产品设计 PRODUCT | `PRODUCTS` | `cover/` | 1200 |
| 工牌头像 | — | `assets/avatar.webp` | 394（简历里的证件照） |

几个约束（改数据时会踩到）：
- `POSTERS` **必须正好 11 条**：3D 卡组的倾角/堆叠数组各 11 项，多一条会取到 `undefined`。
- `MAGAZINE_PAGES` 的顺序是「封面 + 每个版面 (左半, 右半)」—— 一个跨页对应 PDF 里的一整页。
- 便签文案用 `\n` 决定断行（`.cb__note p` 是 `white-space: pre-line`）。

## 目录

```
src/
  App.tsx                  阶段编排：loading → reveal → scene，降级分支，浮层宿主
  store.ts                 zustand：状态机 context / 浮层 / 作品子视图
  data/content.ts          全站文案、作品数据、复刻出处与仓库地址
  experience/
    experienceMachine.ts   场景状态机（唯一事实来源，纯函数 + 单测）
    experienceClock.ts     开场主时钟：所有相机 / 柜门 / 物件都读它
    experienceTimeline.ts  时间线事件表与关键时刻
    ExperienceOrchestrator.tsx  用 rAF 推进时钟并向状态机投事件
    assetManifest.ts       首屏资源清单，也是 index.html preload 的事实来源
  scene/                   首屏 3D
    HeroSceneCanvas.tsx    Canvas / 相机 / 灯光 / 柜体 / 物件 / 热点的装配处
    LockerModel.tsx        柜壳、柜腔、隔板、四扇门、把手、通风槽（程序化几何）
    lockerSpec.ts          柜体全部尺寸标定值
    PhysicalProps.tsx      实体物件模型：打字机 / 吉他 / 唱片机 / 拍立得 / 挂钩…
    propSpecs.ts           物件的世界坐标、尺寸与入场批次
    DecalField.tsx         贴纸：图集 + InstancedMesh，一个承载面一次 draw call
    decalSpecs.ts          贴纸在门面上的百分比位置
    decalAtlas.ts          图集读表（图集本身在构建期打好）
    SurfaceDraggable.tsx   通用拖拽容器：射线与承载面求交 + footprint 钳边
    Hotspots.tsx           四个热点的反馈圆环与无障碍按钮
    hotspotSpecs.ts        热点位置、聚焦取景高度与取景方向
    hotspotActions.ts      热点动作总线（贴花本体与命中框共用同一入口）
    cameraDirector.ts      开场之后的镜头调度：可打断、完成回调
    cameraPath.ts          开场机位曲线与稳定态机位
    userZoom.ts            用户缩放（乘在注视半径上，与机位来源正交）
    PerformanceGovernor.tsx  按需渲染 / 连续渲染的切换
  components/
    Loader.tsx Reveal.tsx  加载页与揭幕转场
    Nav.tsx                顶部导航
    Credit.tsx             左下角复刻出处与源码入口
    overlays/              四个内容浮层 + OverlayHost（dialog 语义 / focus trap）
    work/                  SELECTED WORK 的子视图（海报 / 杂志 / 照片墙 / 影像 / 网站）
    fallback/              无 WebGL / Save-Data / 低性能设备的静态首屏
public/assets/             物件贴图、贴纸图集、作品图（webp）
scripts/assets/            贴纸图集打包、作品集 PDF 导入与素材生成
                           （import-portfolio-pdf.mjs / sync-work-manifest.mjs）
scripts/gen-image-variants.mjs  母版 → 响应式变体（sharp，不依赖 libwebp 命令行）
scripts/check-assets.mjs   资产引用、preload 漂移与首屏体积预算
```

## 检查

```bash
bun run lint
bun run build             # tsc -b 严格类型检查 + 产物构建
bun run check:assets      # 资产引用、preload 漂移、首屏体积预算
bun run check:bundle      # 在构建产物上跑同一套预算
```

---

## 已知问题

- `bun run check:assets` 里的一条错误在本次内容改造**之前就存在**：
  `public/assets/obj2/doorDecals.webp` 与 `pack-decals.mjs` 当前排位表不一致
  （stk8 / stk9 的缩放差），仓库里提交的图集版本是 41baddc8、脚本期望 ee25f01c。
  要消掉得重打图集，会连带改动柜门贴纸的实际大小，因此没有顺手改。
- 沙箱环境访问不到 Google Fonts，本地截图里中文显示为方框；正常网络下无此问题。

---

## 版权与致谢

**原型出处**

本站的视觉概念、页面结构与交互创意复刻自小红书博主 **momo** 的 Locker 个人网站：

- 原帖：<https://www.xiaohongshu.com/discovery/item/6a852ae7000000002500b24e?xsec_token=ABxWdb99F51QhPGOvNNuLGxYSbTeGIKFnMDujjIeP1Kr8=>

**创意与设计著作权归原作者 momo 所有。** 本仓库是出于学习目的的复刻实现，
非商业用途，与原作者无隶属或背书关系。页面左下角常驻出处链接（`src/components/Credit.tsx`），
请不要在二次分发时移除。若原作者提出异议，本仓库将下架或按其要求整改。

**这个仓库里属于本项目的部分**

- 全部源码为独立编写，不含原站代码（原站未开源，也未被反编译或抓取）。
- 三维模型、材质、灯光、状态机、回归脚本均为本项目实现。

**素材说明**

`public/assets/` 下的作品图（`cover/`、`posters/`、`mag/`、`photo/`、`avatar.webp`）
是**本作品集作者本人的作品与证件照**，来自她自己的作品集/简历 PDF，版权归作者本人所有；
`obj/`、`obj2/` 下的物件贴图与贴纸图集是原站资产之外的**替代素材**（AI 生成）。
如果 fork 本仓库做自己的作品集，请把上述作品图换成你有权使用的素材，
文案集中在 `src/data/content.ts`，替换流程见「内容的来源与替换」。

字体通过 Google Fonts 引入（Inter、Noto Sans/Serif SC、Playfair Display、Ultra、
Archivo Black、Alfa Slab One、Bodoni Moda、Courier Prime），版权归各字体作者，
遵循 SIL Open Font License。

**许可**

本仓库的**代码**以 MIT 许可开放使用（见 [LICENSE](./LICENSE)）；上述**设计创意**与
**替代素材**不在此许可范围内 —— 前者归原作者，后者取决于各素材自身的授权。使用前请自行确认。
