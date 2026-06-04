'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface Option<T extends string> {
  value: T
  label: string
}

type SingleProps<T extends string> = {
  mode: 'single'
  options: Option<T>[]
  value: T | undefined
  onChange: (value: T) => void
}

type MultiProps<T extends string> = {
  mode: 'multi'
  options: Option<T>[]
  value: T[]
  onChange: (value: T[]) => void
}

type SegmentedControlProps<T extends string> = SingleProps<T> | MultiProps<T>

export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const { options } = props

  function handleClick(optValue: T) {
    if (props.mode === 'single') {
      props.onChange(optValue)
    } else {
      const current = props.value
      const next = current.includes(optValue)
        ? current.filter((v) => v !== optValue)
        : [...current, optValue]
      props.onChange(next as T[])
    }
  }

  function isActive(optValue: T): boolean {
    if (props.mode === 'single') return props.value === optValue
    return props.value.includes(optValue)
  }

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = isActive(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleClick(opt.value)}
            className={cn(styles.option, active && styles.optionActive)}
          >
            {props.mode === 'multi' && active && (
              <Check className="inline-block h-3 w-3 mr-1 -mt-px" />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
