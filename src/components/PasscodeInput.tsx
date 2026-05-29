'use client'

import { useEffect, useRef, useState } from 'react'
import { Delete } from 'lucide-react'

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
    <div className="flex flex-col items-center gap-6 select-none">
      {/* 점(dot) 표시 */}
      <div className="flex gap-4" role="status" aria-label={`패스코드 ${value.length}/${length}자리 입력됨`}>
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              i < value.length
                ? 'bg-violet-700 border-violet-700 scale-110'
                : 'bg-transparent border-violet-300'
            }`}
          />
        ))}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <p className="text-sm text-red-500 animate-pulse" role="alert">
          {error}
        </p>
      )}

      {/* 숫자 키패드 */}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, idx) => {
          if (key === '') {
            return <div key={idx} />
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleKey(key)}
              disabled={disabled || (key !== 'del' && value.length >= length)}
              aria-label={key === 'del' ? '지우기' : key}
              className={`
                flex items-center justify-center
                w-20 h-16 rounded-2xl text-xl font-semibold
                transition-all duration-100
                active:scale-95
                ${key === 'del'
                  ? 'text-violet-500 hover:bg-violet-50 active:bg-violet-100'
                  : 'bg-white text-gray-800 shadow-sm border border-violet-100 hover:bg-violet-50 active:bg-violet-100'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {key === 'del' ? <Delete className="w-5 h-5" /> : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
