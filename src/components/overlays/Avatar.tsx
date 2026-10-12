/**
 * 工牌上的证件照。
 *
 * 原实现是一段 SVG 插画；换成真实照片后仍保留同一个 className
 * （.idc__avatar 只约束宽度与形状），版面不用改。
 * 照片由 scripts/assets/import-portfolio-pdf.mjs 从简历 PDF 里抽取。
 */
export default function Avatar({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src="/assets/avatar.webp"
      width={394}
      height={552}
      alt="李怡璇证件照"
      decoding="async"
    />
  )
}
