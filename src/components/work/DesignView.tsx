import { useCallback, useEffect, useRef, useState } from 'react'
import BackToFolders from './BackToFolders'
import PostersDeck from './PostersDeck'
import MagazineBook from './MagazineBook'
import './design.css'

const SECTIONS = ['posters', 'magazine'] as const

/**
 * SELECTED WORK › DESIGN —— 两段式：海报牌 / 样刊。
 *
 * 原来是三段（海报 / 杂志 / IP 形象设计）。当前作品集里没有 IP 形象这一类，
 * 与其留一段空壳，不如把段数收成两段：段数只由 SECTIONS 驱动，
 * 页点、滚轮翻段与底部的跳转按钮都会跟着变。
 */
export default function DesignView() {
  const [sec, setSec] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const lock = useRef(false)

  const goto = useCallback((i: number) => {
    const n = Math.max(0, Math.min(SECTIONS.length - 1, i))
    setSec(n)
    lock.current = true
    window.setTimeout(() => {
      lock.current = false
    }, 950)
  }, [])

  /* 整页纵向切换：滚轮 / 键盘。海报段的横向滚轮交由内部消费 */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX)
      const absY = Math.abs(e.deltaY)
      // 横向占优时始终留给当前作品组件；即使光标落在页点或底部按钮上，
      // 斜向触控板手势也不能误触发整页纵向切换。
      if (absY <= absX) return
      if ((e.target as HTMLElement)?.closest('[data-hscroll]')) {
        if (absY < 26) return
      }
      if (lock.current || absY < 14) return
      goto(sec + (e.deltaY > 0 ? 1 : -1))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') goto(sec + 1)
      if (e.key === 'ArrowUp' || e.key === 'PageUp') goto(sec - 1)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [sec, goto])

  return (
    <div className="wv dv">
      <BackToFolders />
      <span className="dv__index">
        {String(sec + 1).padStart(2, '0')} /
      </span>

      <div ref={railRef} className="dv__rail" style={{ transform: `translateY(${-sec * 100}%)` }}>
        <section className="dv__sec">
          <PostersDeck active={sec === 0} />
        </section>
        <section className="dv__sec">
          <MagazineBook active={sec === 1} />
        </section>
      </div>

      {sec < SECTIONS.length - 1 && (
        <div className="wv__foot">
          <button
            type="button"
            className="wv__jump"
            onClick={() => goto(sec + 1)}
          >
            'VIEW MAGAZINE'
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M6 1v9M2.4 6.6 6 10.2l3.6-3.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="dv__dots" aria-hidden>
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            data-on={i === sec}
            onClick={() => goto(i)}
            aria-label={s}
          />
        ))}
      </div>
    </div>
  )
}
