'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import styles from './PasscodeInput.module.css'

interface PasscodeInputProps {
  length?: 4 | 5 | 6
  onComplete: (value: string) => void
  disabled?: boolean
  error?: string
  clearOnError?: boolean
  /** 도트 인디케이터 바로 위에 표시되는 라벨 (예: "패스코드 입력") */
  label?: string
}

// 마지막 줄은 iOS 잠금화면처럼 [빈 칸] [0] [백스페이스].
// 빈 칸('')은 보이지 않는 placeholder 로 자리만 차지해 0 이 가운데 열에 정렬되게 한다.
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

// 백스페이스 길게 누르기(모바일) → 전체 삭제 발동 시간
const LONG_PRESS_MS = 500

export function PasscodeInput({
  length = 6,
  onComplete,
  disabled = false,
  error,
  clearOnError = true,
  label,
}: PasscodeInputProps) {
  const [value, setValue] = useState('')

  // 항상 최신 onComplete 를 참조하되, 호출 트리거는 value 길이 변화에만 의존시킨다.
  // (onComplete 를 effect deps 에 넣으면 부모 리렌더로 함수 정체성이 바뀔 때마다
  //  완료 상태에서 effect 가 재실행되어 onComplete 가 중복 호출되는 버그가 발생함)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (error && clearOnError) {
      setValue('')
    }
  }, [error, clearOnError])

  // 완료 시 정확히 한 번만 onComplete 가 발사되도록 보장한다.
  const firedRef = useRef(false)
  useEffect(() => {
    if (value.length === length) {
      if (!firedRef.current) {
        firedRef.current = true
        onCompleteRef.current(value)
      }
    } else {
      firedRef.current = false
    }
  }, [value, length])

  // 한 자리 입력/삭제. 길이 제한은 functional updater 안에서 검사해
  // (키보드 리스너처럼) 콜백이 stale value 를 캡처해도 안전하게 동작한다.
  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return
      if (key === 'del') {
        setValue((v) => v.slice(0, -1))
        return
      }
      if (key === '') return
      setValue((v) => (v.length < length ? v + key : v))
    },
    [disabled, length],
  )

  const clearAll = useCallback(() => {
    if (disabled) return
    setValue('')
  }, [disabled])

  // ── 웹: 물리 키보드 입력 ──────────────────────────
  // 숫자 0~9 입력, Backspace 한 자리 삭제(키 반복으로 누르고 있으면 자연히 전체 삭제).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (disabled) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // 다른 입력 필드에 포커스가 있으면 가로채지 않는다(setup/reset 등 공존 화면 안전).
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.key >= '0' && e.key <= '9') {
        handleKey(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault() // 브라우저 뒤로가기 방지
        handleKey('del')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, handleKey])

  // ── 모바일: 백스페이스 길게 누르기 → 전체 삭제 ───────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // 언마운트 시 타이머 정리
  useEffect(() => clearLongPressTimer, [clearLongPressTimer])

  const handleDelPointerDown = useCallback(() => {
    if (disabled) return
    longPressFired.current = false
    clearLongPressTimer()
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      clearAll()
    }, LONG_PRESS_MS)
  }, [disabled, clearAll, clearLongPressTimer])

  const handleDelClick = useCallback(() => {
    if (disabled) return
    // 길게 눌러 이미 전체 삭제됐다면 뒤따르는 click 의 한 자리 삭제는 건너뛴다.
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    handleKey('del')
  }, [disabled, handleKey])

  return (
    <div className={styles.wrap}>
      {/* 라벨 + 도트 그룹 */}
      <div className={styles.head}>
        {label && <p className={styles.label}>{label}</p>}
        <div
          className={styles.dots}
          role="status"
          aria-label={`패스코드 ${value.length}/${length}자리 입력됨`}
        >
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < value.length ? styles.dotFilled : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {/* 숫자 키패드 */}
      <div className={styles.pad}>
        {KEYS.map((key, idx) => {
          if (key === '') {
            // 보이지 않는 placeholder — 자리만 차지해 0 을 가운데 열에 정렬시킨다.
            return <div key={idx} className={styles.spacer} aria-hidden />
          }
          if (key === 'del') {
            return (
              <button
                key={idx}
                type="button"
                onClick={handleDelClick}
                onPointerDown={handleDelPointerDown}
                onPointerUp={clearLongPressTimer}
                onPointerLeave={clearLongPressTimer}
                onPointerCancel={clearLongPressTimer}
                disabled={disabled}
                aria-label="지우기 (길게 누르면 전체 삭제)"
                className={`${styles.key} ${styles.keyDel}`}
              >
                <Delete size={22} strokeWidth={1.5} />
              </button>
            )
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled || value.length >= length}
              aria-label={key}
              className={styles.key}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
