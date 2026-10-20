'use client'

import { useEffect } from 'react'

/**
 * 임시 진단 도구 — 사파리 웹 영역 밖(상태바 뒤 위쪽 / 하단 바 뒤 아래쪽) 색을 실기기에서 비교하려고 넣는다. 확인 후 제거한다.
 * URL 에 ?vdebug=1 이 있을 때만 동작한다(없으면 아무것도 하지 않음).
 * 오버레이를 탭하면 모드가 순서대로 바뀐다:
 *   0 OFF   : 실제 CSS 그대로(현재 = body 바탕색 단색 #f4f0fa)
 *   1 COLORS: 원색 — 빨강 html, 초록 body, 노랑 main, 파랑 .page::before
 *   2 B     : body 를 그라데이션(흰 → #f4f0fa)으로, html 은 투명
 *   3 C     : 화면 맨 위 흰색 / 맨 아래 연보라 2px 고정 띠를 둔다(가장자리 고정 요소 색 샘플링 확인)
 *   4 B+C   : 2 와 3 를 같이
 */
const MODES = ['0 OFF(현재)', '1 COLORS', '2 B body 그라데이션', '3 C 가장자리 고정 띠', '4 B+C'] as const

const CSS_COLORS =
  'html{background:#f00 !important}body{background:#0f0 !important}' +
  'main{background:#ff0 !important}[class*="screens_page"]::before{background:#00f !important}'
const CSS_B =
  'html{background:transparent !important}' +
  'body{background:linear-gradient(180deg,#fff 0%,#f4f0fa 100%) no-repeat #f4f0fa !important}'

export function ViewportDebug() {
  useEffect(() => {
    if (new URLSearchParams(location.search).get('vdebug') !== '1') return

    const box = document.createElement('div')
    box.style.cssText =
      'position:fixed;top:64px;left:6px;z-index:2147483647;background:rgba(0,0,0,.78);color:#fff;' +
      'font:11px/1.35 ui-monospace,Menlo,monospace;padding:6px 8px;border-radius:8px;white-space:pre;max-width:92vw'
    document.body.appendChild(box)

    const probes = (['svh', 'lvh', 'dvh'] as const).map((u) => {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;left:-9999px;top:0;width:1px;height:100${u};pointer-events:none`
      document.body.appendChild(el)
      return [u, el] as const
    })

    const style = document.createElement('style')
    document.head.appendChild(style)

    const strip = (pos: 'top' | 'bottom', color: string) => {
      const el = document.createElement('div')
      el.style.cssText =
        `position:fixed;${pos}:0;left:0;right:0;height:2px;background:${color};` +
        'z-index:2147483646;pointer-events:none;display:none'
      document.body.appendChild(el)
      return el
    }
    const topStrip = strip('top', '#ffffff')
    const bottomStrip = strip('bottom', '#f4f0fa')

    let mode = 0
    const apply = () => {
      style.textContent = mode === 1 ? CSS_COLORS : mode === 2 || mode === 4 ? CSS_B : ''
      const c = mode === 3 || mode === 4
      topStrip.style.display = c ? 'block' : 'none'
      bottomStrip.style.display = c ? 'block' : 'none'
    }
    box.addEventListener('click', () => {
      mode = (mode + 1) % MODES.length
      apply()
      update()
    })

    const update = () => {
      const vv = window.visualViewport
      const main = document.querySelector('main')
      const mr = main?.getBoundingClientRect()
      const br = document.body.getBoundingClientRect()
      const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : '-')
      const lines = [
        `inner ${window.innerWidth}x${window.innerHeight}  vv ${vv ? Math.round(vv.height) : '-'}`,
        probes.map(([u, el]) => `${u} ${Math.round(el.getBoundingClientRect().height)}`).join('  '),
        `main bottom ${mr ? Math.round(mr.bottom) : '-'}  body bottom ${Math.round(br.bottom)}`,
        `bg html ${bg(document.documentElement)}`,
        `bg body ${bg(document.body)}`,
        `mode ${MODES[mode]}  (탭=다음 모드)`,
      ]
      box.textContent = lines.join('\n')
    }

    update()
    const events = ['resize', 'scroll', 'orientationchange'] as const
    events.forEach((e) => window.addEventListener(e, update, { passive: true }))
    window.visualViewport?.addEventListener('resize', update)
    const timer = window.setInterval(update, 500)

    return () => {
      events.forEach((e) => window.removeEventListener(e, update))
      window.visualViewport?.removeEventListener('resize', update)
      window.clearInterval(timer)
      box.remove()
      style.remove()
      topStrip.remove()
      bottomStrip.remove()
      probes.forEach(([, el]) => el.remove())
    }
  }, [])

  return null
}
