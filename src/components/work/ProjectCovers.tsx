import { useEffect, useRef } from 'react'
import { PRODUCTS } from '../../data/content'
import BackToFolders from './BackToFolders'
import { releaseImages, SIZES, workImage } from './imageSources'
import './project.css'

/**
 * SELECTED WORK › PRODUCT 产品设计。
 *
 * 与其他的栏目不同，这里的两个项目都没有可以点进去的线上地址，
 * 所以不做「打开项目」按钮，而是把项目本身讲清楚：一段说明 + 角色 / 方法 / 产出三行。
 * 骨架沿用影像栏目（滚动列表 + 左侧文字、右侧封面），换掉的是右侧不再是播放器。
 */
export default function ProjectCovers() {
  const rootRef = useRef<HTMLDivElement>(null)

  // 关闭栏目时断开封面图引用
  useEffect(() => {
    const root = rootRef.current
    return () => releaseImages(root)
  }, [])

  return (
    <div ref={rootRef} className="wv pc">
      <BackToFolders />
      <div className="pc__scroll">
        <div className="pc__inner">
          <p className="pc__lead u-mono-label">
            PRODUCT DESIGN · 两个从调研走到原型的完整项目
          </p>

          {PRODUCTS.map((p) => (
            <article
              key={p.no}
              className="pc__item"
              style={{ ['--glow' as string]: p.glow }}
            >
              <div className="pc__meta">
                <span className="pc__no">{p.no} ·</span>
                <h2 className="pc__title">
                  {p.title.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </h2>
                <p className="pc__kicker">{p.kicker}</p>
                <p className="pc__desc">{p.desc}</p>
                <dl className="pc__facts">
                  {p.facts.map((f) => (
                    <div key={f.k} className="pc__fact">
                      <dt>{f.k}</dt>
                      <dd>{f.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <figure className="pc__cover">
                <img
                  {...workImage('cover', p.cover)}
                  sizes={SIZES.website}
                  alt={`${p.slug} 封面`}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </article>
          ))}

          <div className="pc__end">— END —</div>
        </div>
      </div>
    </div>
  )
}
