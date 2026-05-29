'use client'

import { useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'
import styles from './PasscodeInput.module.css'

interface PasscodeInputProps {
  length?: 4 | 5 | 6
  onComplete: (value: string) => void
  disabled?: boolean
  error?: string
  clearOnError?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export function PasscodeInput({
  length = 6,
  onComplete,
  disabled = false,
  error,
  clearOnError = true,
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

  function handleKey(key: string) {
    if (disabled) return
    if (key === 'del') {
      setValue((v) => v.slice(0, -1))
      return
    }
    if (key === '') return
    if (value.length < length) {
      setValue((v) => v + key)
    }
  }

  return (
    <div className={styles.wrap}>
      {/* 점(dot) 표시 */}
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
            return <div key={idx} className={styles.spacer} aria-hidden />
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled || (key !== 'del' && value.length >= length)}
              aria-label={key === 'del' ? '지우기' : key}
              className={`${styles.key} ${key === 'del' ? styles.keyDel : ''}`}
            >
              {key === 'del' ? <Delete size={22} strokeWidth={1.5} /> : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
