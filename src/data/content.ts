/* 站点全部文案与作品数据。
 *
 * 数据来源：李怡璇 2026 作品集 / 简历（见 README「素材与文案来源」）。
 * 作品图由 scripts/assets/import-portfolio-pdf.mjs 从作品集 PDF 裁切而来，
 * 文件名（v1 / s1 / d1l / w1）与该脚本里的裁切表一一对应，换稿只需改那一张表。
 */

export const SITE = {
  owner: 'LI YIXUAN',
  tagline: "LI YIXUAN — PORTFOLIO '26",
  year: '2026',
}

/* ── 出处与源码 ───────────────────────────────────────
 * 本站是对小红书博主 momo 的 Locker 个人网站的复刻练习：视觉创意归原作者，
 * 这条出处要一直挂在页面上（左下角 Credit 组件），不是只写在 README 里。
 * repoUrl 是开源仓库地址，换仓库时只改这一处。 */
export const CREDIT = {
  author: 'momo',
  platform: '小红书',
  originUrl:
    'https://www.xiaohongshu.com/discovery/item/6a852ae7000000002500b24e?xsec_token=ABxWdb99F51QhPGOvNNuLGxYSbTeGIKFnMDujjIeP1Kr8=',
  repoUrl: 'https://github.com/xuanleeeeeeee-lyx/locker-folio',
}

/* ── 顶部导航 ─────────────────────────────────────────── */
export const NAV = [
  { id: 'about', label: 'ABOUT' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'work', label: 'SELECTED WORK' },
  { id: 'contact', label: 'CONTACT' },
] as const

/* ── ABOUT：工牌 ───────────────────────────────────────
 * 六行全部来自简历：个人信息、本硕院校与专业、学业成绩。 */
export const ABOUT = {
  cardNo: 'NO. 2026-0001',
  title: ['BASIC', 'INFORMATION'],
  titleCn: '个人简介',
  sub: 'PERSONAL PORTFOLIO ID CARD',
  fields: [
    { k: 'NAME / 姓名', v: '李怡璇' },
    { k: 'AGE / 年龄', v: '22' },
    { k: 'EDUCATION / 学历', v: '香港理工大学 · 硕士在读' },
    { k: 'MAJOR / 专业', v: '生成式人工智能与人文科学' },
    { k: 'UNDERGRAD / 本科', v: '武汉纺织大学 · 网络与新媒体' },
    { k: 'ACADEMIC / 成绩', v: '专业前 5% · GPA 4.15/5' },
  ],
  email: '2433679374@qq.com',
  phone: '132 7757 1951',
  stampTop: 'NATIONAL',
  stampMid: 'SCHOLARSHIP',
  stampRing: 'LI YIXUAN · MEDIA & AI · PORTFOLIO 2026 ·',
  footL: 'STORYTELLING · DATA · AI',
  footR: 'NEW MEDIA PORTFOLIO · 2026',
  /* 工牌右下那张小标签 */
  tagTop: 'NEW MEDIA',
  tagBody: '内容运营',
}

/* ── SKILLS：三张卡片 ───────────────────────────────────
 * 三张卡分别是「平台运营 / 内容制作 / AI 与数据」，与简历里的
 * 新媒体平台、软件技能、其他技能三栏对应。 */
export type SkillCard = {
  no: string
  kicker: string
  title: string
  desc: string
  rows: { k: string; v: string }[]
  bg: string
  fg: string
}

export const SKILLS: SkillCard[] = [
  {
    no: '01',
    kicker: '01 / NEW MEDIA OPERATION',
    title: '新媒体运营',
    desc: '多平台内容从选题、脚本到发布与复盘的全流程运营。',
    rows: [
      { k: 'PLATFORM', v: '公众号 / 视频号 / 抖音 / 小红书 / B站 / 微博' },
      { k: 'CONTENT', v: '选题策划 · 脚本 · 拍摄剪辑 · 直播' },
      { k: 'RESULT', v: '抖音单账号 858 万播放 · 小红书 7,355 赞藏' },
    ],
    bg: '#1b28d8',
    fg: '#ffffff',
  },
  {
    no: '02',
    kicker: '02 / CONTENT PRODUCTION',
    title: '内容制作',
    desc: '视音频与图文的全流程制作，把想法做成能发出去的成品。',
    rows: [
      { k: 'VIDEO', v: 'Premiere / 剪映 / After Effects' },
      { k: 'DESIGN', v: 'Photoshop / Figma / H5 工具 / Dreamweaver' },
      { k: 'DATA', v: 'Excel / Tableau / SPSS / Python' },
    ],
    bg: '#c8f322',
    fg: '#12140f',
  },
  {
    no: '03',
    kicker: '03 / AIGC & RESEARCH',
    title: 'AI 与数据',
    desc: '把生成式工具与数据方法接进内容生产与用户研究。',
    rows: [
      { k: 'AIGC', v: 'AI 生成视频 / 音乐 / 图文 · Vibe coding' },
      { k: 'RESEARCH', v: 'NLP / LLM 应用 · 用户访谈 · 舆情分析' },
      { k: 'LANGUAGE', v: 'CET-4 / CET-6 · IELTS 7.0' },
    ],
    bg: '#ffffff',
    fg: '#14161a',
  },
]

/* ── SELECTED WORK：四个文件夹 ─────────────────────────
 * id 是内部路由键（store 的 WorkView + WorkFolders 的版位表都按它索引），
 * 换文案时只改 en / cn / bg / fg。 */
export const FOLDERS = [
  {
    id: 'video',
    en: ['VIDEO'],
    cn: '影像作品',
    bg: '#0b0b0d',
    fg: '#e0322a',
    cnFg: '#e0322a',
    x: -30,
    y: 12,
    rot: -6,
    z: 1,
  },
  {
    id: 'design',
    en: ['DESIGN'],
    cn: '版面设计',
    bg: '#c8f322',
    fg: '#1b28d8',
    cnFg: '#1b28d8',
    x: 0,
    y: 0,
    rot: -7,
    z: 3,
  },
  {
    id: 'wall',
    en: ['VISUAL', 'WALL'],
    cn: '视觉墙',
    bg: '#1b28d8',
    fg: '#c8f322',
    cnFg: '#ffffff',
    x: 30,
    y: -18,
    rot: 3,
    z: 2,
  },
  {
    id: 'product',
    en: ['PRODUCT'],
    cn: '产品设计',
    bg: '#f8f8f6',
    fg: '#14161a',
    cnFg: '#14161a',
    x: 22,
    y: 20,
    rot: 2,
    z: 2,
  },
] as const

/* ── DESIGN › 01 海报牌 ────────────────────────────────
 * 3D 卡组的 TILT / STACK_* 数组各有 11 项（PostersThreeScene），
 * 所以这里必须正好 11 条，多一条会取到 undefined 让卡片飞出去。 */
export const POSTERS = [
  { src: 's1', title: '听她"奖" · 三八红旗手 63 年' },
  { src: 's2', title: '历史沿革 · HISTORY' },
  { src: 's3', title: '足迹地图 · THE MAP' },
  { src: 's4', title: '评选标准 · SELECTION CRITERIA' },
  { src: 's5', title: '评选标准 · 中文版' },
  { src: 's6', title: '职业流变 · CAREER CHANGE' },
  { src: 's7', title: '她们的奖 · THEIR AWARDS' },
  { src: 's8', title: '她们的奖 · 数据可视化' },
  { src: 's9', title: '查客 · 目标用户画像' },
  { src: 's10', title: '禾狸 · 产品原型' },
  { src: 's11', title: '禾狸 · 视觉系统' },
]

/* ── DESIGN › 02 样刊 ──────────────────────────────────
 * 每个版面在 PDF 里是一整页横排，导入时沿中缝对半切成 0.707 的竖版单页，
 * 翻页组件的跨页 = (左半, 右半)，于是同一个跨页拼回原版面。
 * 顺序固定为：封面 → 每个版面 (l, r)。 */
export const MAGAZINE_PAGES = [
  'cover',
  'd1l', 'd1r',
  'd2l', 'd2r',
  'd3l', 'd3r',
  'd4l', 'd4r',
  'd5l', 'd5r',
  'd6l', 'd6r',
]

/* ── VISUAL WALL ───────────────────────────────────────
 * 无限漂移的视觉墙：一格是一整页版面。槽位按 4×4 取模复用，
 * 所以数组长度（16）不必等于图片数（12）。 */
export const PHOTOS = [
  'w1', 'w2', 'w3', 'w4',
  'w5', 'w6', 'w7', 'w8',
  'w9', 'w10', 'w11', 'w12',
  'w1', 'w4', 'w7', 'w10',
]

/* ── VIDEO ───────────────────────────────────────────── */
export const VIDEOS = [
  {
    no: '01',
    en: 'DOUYIN / ACCOUNT',
    cn: '抖音账号运营',
    desc: '选题、分镜、剪辑到发布的全流程运营：账号累计播放 858 万，诊断建议页显示播放量已超同类创作者 100%。',
    cover: 'v1',
    href: 'https://v.douyin.com/PcKEpqAkrFk/',
  },
  {
    no: '02',
    en: 'RED / ACCOUNT',
    cn: '小红书账号运营',
    desc: '图文与短视频双线运营：7,355 次赞与收藏，单篇笔记最高 3.8 万浏览。',
    cover: 'v2',
    href: 'https://xhslink.cn/o/1NYvHnavvWF',
  },
  {
    no: '03',
    en: 'AI NEWS FILM',
    cn: '《给新闻人的告白》',
    desc: '基于 AI 生成技术的新闻叙事音乐与影像创作：作词、作曲与影像都由生成式工具参与完成。',
    cover: 'v3',
    href: 'https://b23.tv/KXMvtlP',
  },
  {
    no: '04',
    en: 'AD / CRAZY THURSDAY',
    cn: '疯狂星期四 · 广告片',
    desc: '以多元宇宙为灵感的 AI 生成广告短片：文案、分镜与画面由生成式工具协作完成。',
    cover: 'v4',
    href: 'https://youtu.be/dXYcusSmuW0',
  },
]

/* ── PRODUCT DESIGN ────────────────────────────────────
 * 两个产品设计项目：都没有公开的线上地址，所以卡片里不放「打开项目」按钮，
 * 只给项目说明与三行事实（角色 / 方法 / 产出）。 */
export const PRODUCTS = [
  {
    no: '01',
    slug: '查客 · FACT CHECKER',
    title: ['查客 /', 'Fact Checker'],
    kicker: 'SERIOUS GAME · 反虚假信息',
    desc: '把青少年虚假信息对抗训练做成一款可玩的推理游戏：从文献综述与市场调研出发，完成身份与阵营机制设计、界面原型与商业化路径。',
    facts: [
      { k: 'ROLE', v: '产品设计 · 游戏机制 · 用户研究' },
      { k: 'METHOD', v: '文献综述 / 市场调研 / 用户画像 / 竞品分析' },
      { k: 'OUTPUT', v: '游戏流程与卡牌设计 · 界面原型 · 商业模式画布' },
    ],
    cover: 'v5',
    glow: '#c9b6f0', // 封面主色：查客标题页的淡紫
  },
  {
    no: '02',
    slug: '禾狸 · PHORGANISER',
    title: ['禾狸 /', 'Phorganiser'],
    kicker: 'APP DESIGN · 智能照片管理',
    desc: '面向「照片越存越乱」的痛点，设计 AI 自动分类、主题展馆与创作分享闭环，并给出可持续的商业模式与推广节奏。',
    facts: [
      { k: 'ROLE', v: '产品设计 · 交互与视觉规范' },
      { k: 'METHOD', v: '数据分析 / PEST 与五力模型 / 用户旅程' },
      { k: 'OUTPUT', v: '相册与搜索原型 · 三维展馆 · 色彩与图标系统' },
    ],
    cover: 'v6',
    glow: '#c8cfa0', // 封面主色：禾狸视觉系统里的草木绿
  },
]

/* ── CONTACT：软木板便签 ───────────────────────────────
 * 联系方式和公开社媒主页。文案要短：笔记宽度约 16 个等宽字符，超了会自动折行。 */
export const NOTE_COLORS = ['#cfe0c3', '#f0e6a8', '#e8b7b7', '#a9c9dd', '#e5cfe0', '#d8cdb8']

export const SEED_NOTES = [
  { id: 's1', text: 'EMAIL\n2433679374\n@qq.com', href: 'mailto:2433679374@qq.com', color: '#cfe0c3', x: 12, y: 38, rot: -2 },
  { id: 's2', text: '小红书\n7,355 赞与收藏', href: 'https://xhslink.cn/o/1NYvHnavvWF', color: '#f0e6a8', x: 68, y: 10, rot: 3 },
  { id: 's3', text: '抖音\n858 万播放', href: 'https://v.douyin.com/PcKEpqAkrFk/', color: '#e8b7b7', x: 78, y: 32, rot: -3 },
  { id: 's4', text: 'TEL\n132 7757 1951', href: 'tel:+8613277571951', color: '#a9c9dd', x: 10, y: 16, rot: 2 },
  { id: 's5', text: '香港理工大学\n硕士在读', color: '#e5cfe0', x: 22, y: 62, rot: -1 },
]
