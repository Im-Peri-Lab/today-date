'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Plus } from 'lucide-react'
import { ActivityCard } from './ActivityCard'
import { PlaceCard } from './PlaceCard'
import { EmptyState } from './EmptyState'
import { CardGridSkeleton } from './CardGridSkeleton'
import { useActivities } from '@/hooks/useActivities'
import { usePlaces } from '@/hooks/usePlaces'
import { useActivityCategories, usePlaceCategories } from '@/hooks/useCategories'
import { useDebounced } from '@/hooks/useDebounced'
import { DURATION_OPTIONS, TIME_OPTIONS, MEAL_OPTIONS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Status } from '@/types'
import styles from '@/components/screens.module.css'

type Track = 'activity' | 'place'

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.chip, active && styles.chipActive)}
    >
      {children}
    </button>
  )
}

function StatusToggle({
  value,
  onChange,
}: {
  value: Status
  onChange: (s: Status) => void
}) {
  const options: { value: Status; label: string }[] = [
    { value: 'wishlist', label: '위시리스트' },
    { value: 'visited', label: '다녀온 곳' },
  ]
  return (
    <div className={styles.segment}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(styles.segmentBtn, value === opt.value && styles.segmentBtnActive)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className={styles.search}>
      <Search className={cn(styles.searchIcon, 'h-4 w-4')} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="제목·메모 검색"
        className={styles.searchInput}
      />
    </div>
  )
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function ListView() {
  const [track, setTrack] = useState<Track>('activity')
  const [status, setStatus] = useState<Status>('wishlist')
  const [search, setSearch] = useState('')

  // 활동 필터
  const [actCats, setActCats] = useState<string[]>([])
  const [actDuration, setActDuration] = useState('')
  const [actTime, setActTime] = useState('')

  // 장소 필터
  const [placeCats, setPlaceCats] = useState<string[]>([])
  const [placeLocation, setPlaceLocation] = useState('')
  const [placeMeal, setPlaceMeal] = useState('')

  const debouncedSearch = useDebounced(search, 300)
  const debouncedLocation = useDebounced(placeLocation, 300)

  const activityCats = useActivityCategories()
  const placeCatsQuery = usePlaceCategories()

  const activitiesQ = useActivities(
    {
      status,
      categoryIds: actCats,
      duration_bucket: actDuration || undefined,
      time_of_day: actTime || undefined,
      q: debouncedSearch || undefined,
    },
    track === 'activity'
  )

  const placesQ = usePlaces(
    {
      status,
      categoryIds: placeCats,
      location: debouncedLocation || undefined,
      meal_time: placeMeal || undefined,
      q: debouncedSearch || undefined,
    },
    track === 'place'
  )

  function toggleCat(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((c) => c !== id) : [...list, id])
  }

  const addHref = track === 'activity' ? '/activities/new' : '/places/new'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-3">
      {/* 헤더 */}
      <Link href="/" className={cn(styles.backLink, 'mb-3')}>
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>
      <h1 className={cn(styles.heading, 'mb-4')}>우리의 목록</h1>

      {/* 탭 */}
      <div className={styles.tabBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={track === 'activity'}
          onClick={() => setTrack('activity')}
          className={cn(styles.tab, track === 'activity' && styles.tabActive)}
        >
          활동
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={track === 'place'}
          onClick={() => setTrack('place')}
          className={cn(styles.tab, track === 'place' && styles.tabActive)}
        >
          장소
        </button>
      </div>

      {/* ── 활동 탭 ── */}
      {track === 'activity' && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <StatusToggle value={status} onChange={setStatus} />
            <SearchBox value={search} onChange={setSearch} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {activityCats.data?.map((c) => (
              <Chip
                key={c.id}
                active={actCats.includes(c.id)}
                onClick={() => toggleCat(actCats, c.id, setActCats)}
              >
                {c.icon} {c.name}
              </Chip>
            ))}
            {DURATION_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={actDuration === o.value}
                onClick={() => setActDuration(actDuration === o.value ? '' : o.value)}
              >
                {o.label}
              </Chip>
            ))}
            {TIME_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={actTime === o.value}
                onClick={() => setActTime(actTime === o.value ? '' : o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>

          {activitiesQ.isLoading ? (
            <CardGridSkeleton />
          ) : activitiesQ.data && activitiesQ.data.length > 0 ? (
            <div className={GRID}>
              {activitiesQ.data.map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </div>
          ) : (
            <EmptyState
              message={
                status === 'wishlist'
                  ? '아직 위시리스트가 비어있어요'
                  : '아직 다녀온 활동이 없어요'
              }
              hint="함께 하고 싶은 활동을 추가해 보세요"
              addHref="/activities/new"
              addLabel="활동 추가하기"
            />
          )}
        </div>
      )}

      {/* ── 장소 탭 ── */}
      {track === 'place' && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <StatusToggle value={status} onChange={setStatus} />
            <SearchBox value={search} onChange={setSearch} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {placeCatsQuery.data?.map((c) => (
              <Chip
                key={c.id}
                active={placeCats.includes(c.id)}
                onClick={() => toggleCat(placeCats, c.id, setPlaceCats)}
              >
                {c.icon} {c.name}
              </Chip>
            ))}
            {MEAL_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                active={placeMeal === o.value}
                onClick={() => setPlaceMeal(placeMeal === o.value ? '' : o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>

          <div className="mb-4">
            <input
              value={placeLocation}
              onChange={(e) => setPlaceLocation(e.target.value)}
              placeholder="위치로 검색 (예: 성수동)"
              className={cn(styles.plainInput, 'sm:max-w-xs')}
            />
          </div>

          {placesQ.isLoading ? (
            <CardGridSkeleton />
          ) : placesQ.data && placesQ.data.length > 0 ? (
            <div className={GRID}>
              {placesQ.data.map((p) => (
                <PlaceCard key={p.id} place={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              message={
                status === 'wishlist'
                  ? '아직 가보고 싶은 장소가 없어요'
                  : '아직 다녀온 장소가 없어요'
              }
              hint="가고 싶은 장소를 추가해 보세요"
              addHref="/places/new"
              addLabel="장소 추가하기"
            />
          )}
        </div>
      )}

      {/* FAB */}
      <Link href={addHref} className={styles.fab} aria-label="추가하기">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
