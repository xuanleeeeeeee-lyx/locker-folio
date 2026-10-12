#!/usr/bin/env node
/**
 * 为作品图生成与显示尺寸匹配的响应式变体。
 *
 * 原图都是 1000–1400px 宽，而实际显示宽度只有 200–530 CSS px，直接用原图会让每张图的
 * RGBA 解码内存翻好几倍。这里按各栏目最大显示宽度 ×1 / ×2 生成两档变体，
 * 页面用 srcset/sizes 交给浏览器挑（宽度表见 src/components/work/imageSources.ts）。
 *
 * 用仓库已有的 sharp，不依赖 libwebp 命令行（dwebp/cwebp）：
 * webp q80、尺寸只缩不放，母版本身即该栏目的最大档。
 *
 * 用法：
 *   node scripts/gen-image-variants.mjs                 # 原地生成到 public/assets
 *   node scripts/gen-image-variants.mjs --out /tmp/x    # 写到别处（校验用）
 *   node scripts/gen-image-variants.mjs --force         # 连已存在的变体一起重写
 *   node scripts/gen-image-variants.mjs posters photo   # 只处理指定栏目
 */
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assets = path.join(root, 'public/assets')

/** 目录:宽度列表 —— 与 imageSources.ts 的 VARIANTS 一致；母版宽度即该栏目的最大档 */
const TARGETS = {
  photo: [300, 600], // 视觉墙格子最大 448px → 母版 900
  posters: [400], // 海报牌 210–330px → 母版 700
  mag: [420], // 样刊单页 ≤330px → 母版 760
  cover: [480, 760], // 影像封面 ≤660px / 项目卡 ≤532px → 母版 1200
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const outIdx = args.indexOf('--out')
const outRoot = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : assets
const only = args.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1)

/** 已是变体的文件名：xxx-480.webp */
const isVariant = (base) => /-\d+$/.test(base)

const quality = 80

async function variantsFor(dir, file) {
  const base = path.basename(file, path.extname(file))
  const src = path.join(assets, dir, file)
  const outDir = path.join(outRoot, dir)
  await mkdir(outDir, { recursive: true })

  const meta = await sharp(src).metadata()
  const written = []
  for (const w of TARGETS[dir]) {
    const out = path.join(outDir, `${base}-${w}.webp`)
    if (!force && w >= (meta.width ?? 0)) continue // 变体比原图还大就没意义
    if (!force && (await stat(out).then(() => true, () => false))) continue // 已存在，跳过
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(out)
    written.push(out)
  }
  return { base, srcWidth: meta.width, written }
}

let total = 0
for (const [dir, widths] of Object.entries(TARGETS)) {
  if (only.length && !only.includes(dir)) continue
  const srcDir = path.join(assets, dir)
  let files
  try {
    files = await readdir(srcDir)
  } catch {
    console.warn(`跳过 ${dir}：没有这个目录`)
    continue
  }
  const masters = files.filter(
    (f) => /\.(webp|png|jpe?g)$/i.test(f) && !isVariant(path.basename(f, path.extname(f))),
  )
  console.log(`\n${dir}/  ${masters.length} 张原图  →  目标宽度 ${widths.join(', ')}`)
  for (const f of masters.sort()) {
    const { written } = await variantsFor(dir, f)
    total += written.length
    const names = written.map((w) => path.relative(outRoot, w)).join('  ')
    console.log(`  ${f.padEnd(24)} ${names || '（无新文件）'}`)
  }
}
console.log(`\n共生成 ${total} 个变体 → ${path.relative(root, outRoot) || '.'}`)
