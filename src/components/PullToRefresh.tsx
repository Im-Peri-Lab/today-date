'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 64 // 이 거리 이상 당겨야 새로고침
const MAX_PULL = 96
const RESISTANCE = 0.5 // 손가락 이동 대비 인디케이터 이동 비율

/**
 * 페이지 최상단에서 아래로 당기면 onRefresh 를 호출하는 당겨서 새로고침.
 * 전역 overscroll-behavior: none 과 PWA standalone 은 브라우저 기본 동작이 없어 직접 구현한다.
 * 화면 전체가 손가락을 따라 내려갔다가(비워진 자리에 로딩 표시) 끝나면 올라온다.
 * 터치 기기에서만 동작하고, 스크롤 위치가 최상단이 아니거나 다이얼로그가 열려 있으면 무시한다.
 */
export function PullToRefresh({
  onRefresh,
  className,
  children,
}: {
  onRefresh: () => Promise<unknown>
  /** 래퍼가 레이아웃 흐름에 끼므로 감싸는 콘텐츠가 받던 flex 클래스 등을 넘긴다 */
  className?: string
  /** 화면과 함께 내려갈 콘텐츠 — position:fixed 요소(FAB 등)는 밖에 둔다 */
  children: React.ReactNode
}) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    let startX = 0
    let startY = 0
    let tracking = false
    let current = 0
    let busy = false

    function onStart(e: TouchEvent) {
      const target = e.target as Element | null
      if (busy || e.touches.length !== 1 || window.scrollY > 0) return
      if (target?.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      tracking = true
      current = 0
    }

    function onMove(e: TouchEvent) {
      if (!tracking) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      // 위로 스크롤하거나 가로 제스처가 우세하면 포기
      if (dy <= 0 || Math.abs(dx) > dy || window.scrollY > 0) {
        tracking = false
        current = 0
        setPull(0)
        return
      }
      current = Math.min(dy * RESISTANCE, MAX_PULL)
      setPull(current)
    }

    async function onEnd() {
      if (!tracking) return
      tracking = false
      if (current < THRESHOLD) {
        setPull(0)
        return
      }
      busy = true
      setRefreshing(true)
      setPull(THRESHOLD)
      try {
        // 너무 빨리 끝나 깜빡이지 않도록 최소 600ms 노출
        await Promise.all([onRefreshRef.current(), new Promise((r) => setTimeout(r, 600))])
      } catch {
        // 실패해도 인디케이터는 닫는다 — 기존 화면 데이터는 그대로 유지
      } finally {
        busy = false
        setRefreshing(false)
        setPull(0)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const progress = Math.min(pull / THRESHOLD, 1)
  const active = pull > 0 || refreshing
  const animate = pull === 0 || refreshing // 손가락을 따라갈 땐 즉시, 놓았을 때만 부드럽게 복귀

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        // transform 이 남으면 자손 position:fixed 의 기준이 바뀌므로 비활성 땐 속성 자체를 뺀다
        transform: active
          ? `translateY(calc(${pull}px + env(safe-area-inset-top, 0px) * ${progress}))`
          : undefined,
        transition: animate ? 'transform 220ms ease' : 'none',
      }}
    >
      {/* 화면이 내려가며 비워진 자리(콘텐츠 바로 위)에 표시 */}
      <div
        aria-hidden={!active}
        role="status"
        className="pointer-events-none absolute left-0 right-0 flex items-end justify-center pb-3"
        style={{
          bottom: '100%',
          height: THRESHOLD,
          opacity: active ? progress : 0,
        }}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: 'var(--s-card-bg, #ffffff)',
            border: '1px solid var(--s-card-border-strong, #eceaf3)',
            boxShadow: 'var(--s-card-shadow, 0 1px 3px rgba(0,0,0,0.06))',
            color: 'var(--s-active-text, #7c3aed)',
          }}
        >
          <RefreshCw
            className={refreshing ? 'animate-spin' : undefined}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
            size={16}
            strokeWidth={2}
          />
        </span>
      </div>
      {children}
    </div>
  )
}
