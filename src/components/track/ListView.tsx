'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Plus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
      className={cn(
        'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-violet-500 bg-violet-50 font-medium text-violet-700'
          : 'border-input text-muted-foreground hover:border-violet-300'
      )}
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
    <div className="inline-flex shrink-0 rounded-lg bg-muted p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
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
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="제목·메모 검색"
        className="w-full pl-8"
      />
    </div>
  )
}

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
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      {/* 헤더 */}
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>
      <h1 className="mb-4 text-2xl font-bold text-violet-800">우리의 목록 💜</h1>

      <Tabs
        value={track}
        onValueChange={(v) => setTrack(v as Track)}
        className="w-full flex-col"
      >
        <TabsList className="w-full">
          <TabsTrigger value="activity">활동</TabsTrigger>
          <TabsTrigger value="place">장소</TabsTrigger>
        </TabsList>

        {/* ── 활동 탭 ── */}
        <TabsContent value="activity" className="mt-4">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </TabsContent>

        {/* ── 장소 탭 ── */}
        <TabsContent value="place" className="mt-4">
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
            <Input
              value={placeLocation}
              onChange={(e) => setPlaceLocation(e.target.value)}
              placeholder="위치로 검색 (예: 성수동)"
              className="w-full sm:max-w-xs"
            />
          </div>

          {placesQ.isLoading ? (
            <CardGridSkeleton />
          ) : placesQ.data && placesQ.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </TabsContent>
      </Tabs>

      {/* FAB */}
      <Link
        href={addHref}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-colors hover:bg-violet-700"
        aria-label="추가하기"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
