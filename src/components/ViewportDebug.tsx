'use client'

import { useEffect, useRef } from 'react'

/**
 * 임시 진단 도구 — 사파리 하단 띠가 어떤 요소의 색인지 실기기에서 확인하려고 넣는다. 확인 후 제거한다.
 * URL 에 ?vdebug=1 이 있을 때만 동작한다(없으면 아무것도 하지 않음).
 * 오버레이를 탭하면 레이어별 원색 칠하기를 켜고 끈다:
 *   빨강 = html, 초록 = body, 노랑 = main(.page), 파랑 = .page::before(고정 레이어)
 */
export function ViewportDebug() {
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (new URLSearchParams(location.search).get('vdebug') !== '1') return

    const box = document.createElement('div')
    box.style.cssText =
      'position:fixed;top:64px;left:6px;z-index:2147483647;background:rgba(0,0,0,.78);color:#fff;' +
      'font:11px/1.35 ui-monospace,Menlo,monospace;padding:6px 8px;border-radius:8px;white-space:pre;max-width:92vw'
    document.body.appendChild(box)
    boxRef.current = box

    const probes = (['svh', 'lvh', 'dvh'] as const).map((u) => {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;left:-9999px;top:0;width:1px;height:100${u};pointer-events:none`
      document.body.appendChild(el)
      return [u, el] as const
    })

    const style = document.createElement('style')
    document.head.appendChild(style)
    let colored = false
    const COLORS =
      'html{background:#f00 !important}body{background:#0f0 !important}' +
      'main{background:#ff0 !important}[class*="screens_page"]::before{background:#00f !important}'
    box.addEventListener('click', () => {
      colored = !colored
      style.textContent = colored ? COLORS : ''
      update()
    })

    const update = () => {
      const vv = window.visualViewport
      const main = document.querySelector('main')
      const mr = main?.getBoundingClientRect()
      const br = document.body.getBoundingClientRect()
      const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 4)
      const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : '-')
      const lines = [
        `inner ${window.innerWidth}x${window.innerHeight}  vv ${vv ? Math.round(vv.height) : '-'}`,
        probes.map(([u, el]) => `${u} ${Math.round(el.getBoundingClientRect().height)}`).join('  '),
        `main bottom ${mr ? Math.round(mr.bottom) : '-'}  h ${mr ? Math.round(mr.height) : '-'}`,
        `body bottom ${Math.round(br.bottom)}  docH ${document.documentElement.scrollHeight}`,
        `scrollY ${Math.round(window.scrollY)}`,
        `hit@bottom ${hit ? hit.tagName.toLowerCase() : '-'}`,
        `bg html ${bg(document.documentElement)}`,
        `bg body ${bg(document.body)}`,
        `colors ${colored ? 'ON (탭=끄기)' : 'OFF (탭=켜기)'}`,
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
      probes.forEach(([, el]) => el.remove())
    }
  }, [])

  return null
}
