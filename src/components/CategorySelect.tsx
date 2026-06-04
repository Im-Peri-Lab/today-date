'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/components/forms/categoryIcons'
import styles from '@/components/screens.module.css'
import type { ActivityCategory, PlaceCategory } from '@/types'

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

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(styles.skelBar, 'h-8 w-16 animate-pulse rounded-full')}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(track, cat.name)
          const active = value === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(active ? '' : cat.id)}
              className={cn(
                styles.chip,
                active && styles.chipActive,
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', styles.catIcon)} />
              {cat.name}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
