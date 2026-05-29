'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Plus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
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
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
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
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>
        <Link href={addHref}>
          <Button size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </Link>
      </div>

      <h1 className="mb-4 text-2xl font-bold text-violet-800">우리의 목록 💜</h1>

      <Tabs
        value={track}
        onValueChange={(v) => setTrack(v as Track)}
        className="w-full"
      >
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="activity">활동</TabsTrigger>
          <TabsTrigger value="place">장소</TabsTrigger>
        </TabsList>

        {/* 상태 토글 + 검색 */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusToggle value={status} onChange={setStatus} />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목·메모 검색"
              className="pl-8"
            />
          </div>
        </div>

        {/* ── 활동 탭 ── */}
        <TabsContent value="activity" className="mt-4">
          <div className="mb-5 space-y-3">
            {activityCats.data && activityCats.data.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activityCats.data.map((c) => (
                  <Chip
                    key={c.id}
                    active={actCats.includes(c.id)}
                    onClick={() => toggleCat(actCats, c.id, setActCats)}
                  >
                    {c.icon} {c.name}
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  active={actDuration === o.value}
                  onClick={() => setActDuration(actDuration === o.value ? '' : o.value)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {activitiesQ.isLoading ? (
            <CardGridSkeleton />
          ) : activitiesQ.data && activitiesQ.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mb-5 space-y-3">
            {placeCatsQuery.data && placeCatsQuery.data.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {placeCatsQuery.data.map((c) => (
                  <Chip
                    key={c.id}
                    active={placeCats.includes(c.id)}
                    onClick={() => toggleCat(placeCats, c.id, setPlaceCats)}
                  >
                    {c.icon} {c.name}
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
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
            <div className="relative w-full sm:max-w-xs">
              <Input
                value={placeLocation}
                onChange={(e) => setPlaceLocation(e.target.value)}
                placeholder="위치로 검색 (예: 성수동)"
              />
            </div>
          </div>

          {placesQ.isLoading ? (
            <CardGridSkeleton />
          ) : placesQ.data && placesQ.data.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}
