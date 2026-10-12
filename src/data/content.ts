/* 站点全部文案与作品数据 —— 与参考逐帧核对整理 */

export const SITE = {
  owner: 'YIXUAN LI',
  tagline: "YIXUAN LI — PORTFOLIO '26",
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

/* ── ABOUT：工牌 ─────────────────────────────────────── */
export const ABOUT = {
  cardNo: 'NO. xxx',
  title: ['BASIC', 'INFORMATION'],
  titleCn: '个人简介',
  sub: 'PERSONAL PORTFOLIO ID CARD',
  fields: [
    { k: 'NAME / 姓名', v: 'XXX' },
    { k: 'GENDER / 性别', v: 'XXX' },
    { k: 'AGE / 年龄', v: 'XXX' },
    { k: 'CLASS / 班级', v: 'XXX' },
    { k: 'EDUCATION / 学历', v: 'XXX' },
    { k: 'MAJOR / 专业', v: 'XXX' },
  ],
  email: 'xxx',
  phone: 'xxx',
  stampTop: 'CERTIFIED',
  stampMid: 'xxx',
  stampRing: 'PERSONAL PORTFOLIO · xxx ·',
  footL: 'IN MY CREATIVE ERA',
  footR: 'PERSONAL DESIGN PORTFOLIO · 2026',
}

/* ── SKILLS：三张卡片 ─────────────────────────────────── */
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
    kicker: '01 / VISUAL DESIGN',
    title: '视觉设计',
    desc: '以排版、色彩与图像建立可被记住的视觉秩序。',
    rows: [
      { k: 'GRAPHIC', v: 'Photoshop / Illustrator' },
      { k: 'LAYOUT', v: 'InDesign / Figma' },
      { k: 'MOTION', v: 'After Effects / C4D' },
    ],
    bg: '#1b28d8',
    fg: '#ffffff',
  },
  {
    no: '02',
    kicker: '02 / DATA & INSIGHT',
    title: '数据分析',
    desc: '整理、分析并解释数据，为叙事与决策建立清晰依据。',
    rows: [
      { k: 'ANALYSIS', v: 'SPSS / SQL / Python' },
      { k: 'WORKFLOW', v: 'Excel / VLOOKUP / 数据透视表' },
    ],
    bg: '#c8f322',
    fg: '#12140f',
  },
  {
    no: '03',
    kicker: '03 / GENERATIVE PRACTICE',
    title: 'AI 工具',
    desc: '把生成式工具融入研究、视觉试验与创意内容生产。',
    rows: [
      { k: 'IMAGE', v: 'Recraft / 即梦 AI / Nano Banana' },
      { k: '3D', v: '焦点 AI / 混元 AI / Tripo' },
      { k: 'RESEARCH', v: 'Gemini / GPT' },
    ],
    bg: '#ffffff',
    fg: '#14161a',
  },
]

/* ── SELECTED WORK：四个文件夹 ───────────────────────── */
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
    cn: '视觉类设计',
    bg: '#c8f322',
    fg: '#1b28d8',
    cnFg: '#1b28d8',
    x: 0,
    y: 0,
    rot: -7,
    z: 3,
  },
  {
    id: 'photograph',
    en: ['PHOTO', 'GRAPH'],
    cn: '摄影作品',
    bg: '#1b28d8',
    fg: '#c8f322',
    cnFg: '#ffffff',
    x: 30,
    y: -18,
    rot: 3,
    z: 2,
  },
  {
    id: 'website',
    en: ['WEBSITE', '&', 'WRITING'],
    cn: '文字作品',
    bg: '#f8f8f6',
    fg: '#14161a',
    cnFg: '#14161a',
    x: 22,
    y: 20,
    rot: 2,
    z: 2,
  },
] as const

/* ── DESIGN › 01 POSTERS ─────────────────────────────── */
export const POSTERS = [
  { src: 'greenapple', title: 'GREEN APPLE' },
  { src: 'happynewyear', title: 'HAPPY NEW YEAR' },
  { src: 'streamnow', title: 'STREAM NOW' },
  { src: 'butterfly', title: '无人之境 · UNMANNED REALM' },
  { src: 'frangipani', title: 'WHERE FRANGIPANI FALLS' },
  { src: 'chocaward', title: '年度创新糖巧奖' },
  { src: 'childhood', title: 'HELLO CHILDHOOD MEMORIES' },
  { src: 'yexing', title: '夜行之梦 · DREAM IN FLIGHT' },
  { src: 'chocmint', title: '薄荷味夹心黑巧克力' },
  { src: 'grassfest', title: '草地音乐节 · GRASS FEST' },
  { src: 'research', title: 'US-CHINA RESEARCH TRENDS' },
]

/* ── DESIGN › 02 MAGAZINE ────────────────────────────── */
export const MAGAZINE_PAGES = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']

/* ── DESIGN › 03 IP DESIGN ───────────────────────────── */
export const IP_DESIGN = {
  kicker: '03 / IP DESIGN',
  title: 'IP DESIGN',
  cn: 'IP 形象设计',
  desc: '围绕一个圆润的原创角色展开：从基础形体、材质到延展物料，建立一套可复用的形象语言。',
  swatches: [
    { name: 'CLAY', hex: '#e3d3bb' },
    { name: 'SAND', hex: '#d6c3a5' },
    { name: 'CREAM', hex: '#f2eadd' },
    { name: 'INK', hex: '#2c2925' },
  ],
  specs: [
    { k: 'FORM', v: '球体 / 圆角几何体' },
    { k: 'MATERIAL', v: '哑光陶土 · 微磨砂' },
    { k: 'OUTPUT', v: '3D 模型 / 表情包 / 周边' },
  ],
}

/* ── PHOTOGRAPH ──────────────────────────────────────── */
export const PHOTOS = [
  'p1', 'p4', 'p2', 'p6',
  'p5', 'p3', 'p6', 'p1',
  'p2', 'p5', 'p4', 'p3',
  'p6', 'p1', 'p3', 'p5',
]

/* ── VIDEO ───────────────────────────────────────────── */
export const VIDEOS = [
  {
    no: '01',
    en: 'CHARACTER PV',
    cn: '动漫单人角色 PV',
    desc: 'Minimax 辅助生成制作二次元风格单人角色宣传短片',
    cover: 'pv1',
    href: 'https://www.feicut.com/fv/FVf0hc366wam?cm=1&fc=2&p=0',
  },
  {
    no: '02',
    en: 'ACTION CUT',
    cn: '动作向动漫 PV',
    desc: '多角色动作分镜与节奏剪辑试验',
    cover: 'pv2',
    href: 'https://www.feicut.com/fv/FVbhfppjrege?cm=1&fc=1&p=0',
  },
]

/* ── WEBSITE & WRITING ───────────────────────────────── */
/* href 是占位：三个站点还没有可公开的正式地址，一律先指向 '#'，
   面板上的 OPEN PROJECT 同时带 aria-disabled。拿到真实链接后只改这三处。
   glow 是每张封面的主色，用来喂 .wsc__glow 的背景光晕 —— 原来那三个值
   （#f6e9c8 / #f7dcd8 / #dceccd）是掺了大量白的浅色，铺在 --paper #f8f7fa 上
   几乎没有色差，看不出光晕；这里往各自封面的主色方向加饱和度。 */
export const WEBSITES = [
  {
    no: '01',
    slug: 'COFFEE / IN CHINA',
    title: ['Coffee / In', 'China'],
    kicker: 'DATA JOURNALISM · WEB',
    desc: '中国咖啡市场在消费降级、价格竞争与情绪经济之间的增长逻辑。',
    cover: 'coffee',
    glow: '#f2d49a', // 咖啡封面的焦糖黄
    href: '#',
  },
  {
    no: '02',
    slug: 'SHORT DRAMA / OVERSEAS',
    title: ['Short Drama /', 'Overseas'],
    kicker: 'FEATURE · WEB',
    desc: '短剧出海：内容工业化生产与海外分发链路的一次拆解。',
    cover: 'drama',
    glow: '#f0bfa4', // 短剧封面的暖橘
    href: '#',
  },
  {
    no: '03',
    slug: 'WECHAT / ARTICLE',
    title: ['WeChat /', 'Article'],
    kicker: 'EDITORIAL · 图文',
    desc: '公众号长图文写作与版式：把调研转成可读、可传播的叙事。',
    cover: 'wechat',
    glow: '#d7e3a4', // 图文封面的草绿
    href: '#',
  },
]

/* ── CONTACT：软木板便签 ─────────────────────────────── */
export const NOTE_COLORS = ['#cfe0c3', '#f0e6a8', '#e8b7b7', '#a9c9dd', '#e5cfe0', '#d8cdb8']

export const SEED_NOTES = [
  { id: 's1', text: '', color: '#cfe0c3', x: 14, y: 42, rot: -2 },
  { id: 's2', text: '', color: '#f0e6a8', x: 70, y: 12, rot: 3 },
  { id: 's3', text: '', color: '#e8b7b7', x: 80, y: 33, rot: -3 },
]
