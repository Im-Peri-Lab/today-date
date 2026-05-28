'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (error && clearOnError) {
      setValue('')
    }
  }, [error, clearOnError])

  useEffect(() => {
    if (value.length === length) {
      onComplete(value)
    }
  }, [value, length, onComplete])

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
