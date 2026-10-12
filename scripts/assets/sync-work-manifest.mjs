#!/usr/bin/env node
/**
 * 从磁盘生成 assetManifest.ts 里的**作品页资源**两段：
 *   · WORK_VARIANTS —— 每个母版的响应式档位（宽度 / URL / 体积 / 版本）
 *   · WORK_ASSETS   —— 每个母版一条 lazyAsset 登记
 *
 * 为什么需要它：作品图会整体换（换一次作品集就是几十个文件、上百处数字），
 * 而这两段的信息完全由磁盘决定。手改必然漏，漏了 Loader 的进度加权就会失真、
 * 开发期还会一直打漂移告警。首屏物件（prop / decal）不进这里 —— 那是人工挑选的。
 *
 * 只重写两个 marker 之间的内容，其余部分（首屏清单、字体阶段、导出接口）原样保留。
 *
 *   node scripts/assets/sync-work-manifest.mjs
 *   node scripts/assets/sync-work-manifest.mjs --check   # 只报告差异，不写回
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FILE = path.join(root, 'src/experience/assetManifest.ts')
const CHECK = process.argv.includes('--check')

/** 目录 → [分组, 变体宽度档]；与 gen-image-variants.mjs 的 TARGETS 一致 */
const DIRS = {
  photo: ['work.photo', [300, 600]],
  posters: ['work.poster', [400]],
  mag: ['work.magazine', [420]],
  cover: ['work.cover', [480, 760]],
}

/** 文件名 → 资源 id 的前缀，只是可读性，不参与索引 */
const ID_PREFIX = { photo: 'photo', posters: 'poster', mag: 'mag', cover: 'cover' }

const stat = (p) => ({
  bytes: statSync(p).size,
  version: createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 8),
})

const base = (f) => f.replace(/\.webp$/, '')
const isVariant = (name) => /-\d+$/.test(name)

function collect() {
  const assets = path.join(root, 'public/assets')
  const out = []
  for (const [dir, [group, widths]] of Object.entries(DIRS)) {
    const abs = path.join(assets, dir)
    if (!existsSync(abs)) continue
    const files = readdirSync(abs).filter((f) => f.endsWith('.webp'))
    const masters = files
      .filter((f) => !isVariant(base(f)))
      .sort((a, b) => a.localeCompare(b, 'en'))
    for (const file of masters) {
      const name = base(file)
      const variants = widths
        .map((w) => ({ w, f: `${name}-${w}.webp` }))
        .filter(({ f }) => files.includes(f))
        .map(({ w, f }) => ({
          width: w,
          url: `/assets/${dir}/${f}`,
          ...stat(path.join(abs, f)),
        }))
      out.push({
        dir,
        name,
        group,
        url: `/assets/${dir}/${file}`,
        ...stat(path.join(abs, file)),
        variants,
      })
    }
  }
  return out
}

const entries = collect()

const variantsSrc = entries
  .map(
    (e) =>
      `  '${e.url}': [\n` +
      e.variants
        .map((v) => `    { width: ${v.width}, url: '${v.url}', bytes: ${v.bytes}, version: '${v.version}' },`)
        .join('\n') +
      (e.variants.length ? '\n' : '') +
      `  ],`,
  )
  .join('\n')

const assetsSrc = entries
  .map(
    (e) =>
      `  lazyAsset('${ID_PREFIX[e.dir]}.${e.name}', '${e.url}', '${e.group}', ${e.bytes}, '${e.version}'),`,
  )
  .join('\n')

let text = readFileSync(FILE, 'utf8')
const before = text

function replaceBlock(src, begin, end, body) {
  const b = src.indexOf(begin)
  const e = src.indexOf(end)
  if (b < 0 || e < 0) throw new Error(`assetManifest.ts 缺少标记：${begin} / ${end}`)
  return src.slice(0, b + begin.length) + '\n' + body + '\n' + src.slice(e)
}

text = replaceBlock(text, '/* WORK_VARIANTS:BEGIN */', '/* WORK_VARIANTS:END */', variantsSrc)
text = replaceBlock(text, '/* WORK_ASSETS:BEGIN */', '/* WORK_ASSETS:END */', assetsSrc)

console.log(`作品资源：${entries.length} 个母版、${entries.reduce((n, e) => n + e.variants.length, 0)} 个档位`)
if (text === before) {
  console.log('清单已是最新，无需改动')
  process.exit(0)
}
if (CHECK) {
  console.error('清单与磁盘不一致，请运行 node scripts/assets/sync-work-manifest.mjs')
  process.exit(1)
}
writeFileSync(FILE, text)
console.log(`已写入 ${path.relative(root, FILE)}`)
