'use client'

import { useEffect, useState } from 'react'
import { ActivityCategory, PlaceCategory } from '@/types'

type Category = ActivityCategory | PlaceCategory

interface CategorySelectProps {
  track: 'activity' | 'place'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

export function CategorySelect({ track, value, onChange, disabled, error }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const endpoint = track === 'activity' ? '/api/activity-categories' : '/api/place-categories'
    fetch(endpoint)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCategories(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [track])

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={[
          'h-9 w-full rounded-lg border bg-transparent px-3 py-1 text-sm transition-colors outline-none',
          'focus-visible:border-[var(--s-active-line,#7c3aed)] focus-visible:ring-2 focus-visible:ring-[var(--s-active-line,#7c3aed)]/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500' : 'border-input',
        ].join(' ')}
      >
        <option value="">카테고리 선택 (선택사항)</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
