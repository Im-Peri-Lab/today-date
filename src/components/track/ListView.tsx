'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, Home } from 'lucide-react'
import { ActivityCard } from './ActivityCard'
import { PlaceCard } from './PlaceCard'
import { EmptyState } from './EmptyState'
import { CardGridSkeleton } from './CardGridSkeleton'
import { MiniHeart } from '@/components/BrandMark'
import { HomeMenu } from '@/components/HomeMenu'
import { HomeFab } from '@/components/HomeFab'
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

/** 필터 칩 영역 접기/펼치기 — 기본 접힘, 활성 개수 뱃지 표시 */
function FilterBar({
  count,
  open,
  onToggle,
  children,
}: {
  count: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(styles.filterToggle, (open || count > 0) && styles.filterToggleActive)}
      >
        <Filter className="h-4 w-4" />
        필터
        {count > 0 && <span className={styles.filterCount}>{count}</span>}
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

/** 펼친 필터 안의 라벨 그룹 (카테고리 / 소요시간 / 시간대 등) */
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn('mb-1.5 text-xs', styles.faint)}>{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

export function ListView() {
  // 홈 통계 카드에서 넘어온 진입 지점(?tab=, ?status=)을 초기값으로만 사용 (이후 토글은 자유)
  const searchParams = useSearchParams()
  const [track, setTrack] = useState<Track>(
    searchParams.get('tab') === 'place' ? 'place' : 'activity'
  )
  const [status, setStatus] = useState<Status>(
    searchParams.get('status') === 'visited' ? 'visited' : 'wishlist'
  )
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  // 활성 필터 개수 / 검색·필터 사용 여부 (빈 상태 카피 분기용)
  const activityFilterCount = actCats.length + (actDuration ? 1 : 0) + (actTime ? 1 : 0)
  const placeFilterCount = placeCats.length + (placeMeal ? 1 : 0) + (placeLocation ? 1 : 0)
  const activityFiltering = Boolean(debouncedSearch) || activityFilterCount > 0
  const placeFiltering = Boolean(debouncedSearch) || placeFilterCount > 0

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-28 pt-6 lg:px-8 lg:pt-10">
      {/* 헤더: 브랜드(홈으로) + 미니멀 메뉴 — 홈과 동일 패턴 */}
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="홈으로">
          <MiniHeart />
          <span className={cn(styles.brand, 'lg:text-lg')}>Today Date</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className={styles.iconBtn} aria-label="홈으로">
            <Home className="h-[18px] w-[18px]" />
          </Link>
          <HomeMenu />
        </div>
      </header>

      {/* 페이지 제목 — 홈과 동일한 타이포 위계 */}
      <div className="mt-8 lg:mt-10">
        <h1 className={cn(styles.greeting, 'text-2xl lg:text-4xl')}>우리의 위시리스트</h1>
        <p className={cn('mt-1 text-sm lg:mt-1.5 lg:text-lg', styles.sub)}>함께 쌓아온 곳들</p>
      </div>

      {/* 탭 */}
      <div className={cn(styles.tabBar, 'mt-8')} role="tablist">
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

          <FilterBar
            count={activityFilterCount}
            open={filtersOpen}
            onToggle={() => setFiltersOpen((v) => !v)}
          >
            <div className="space-y-3">
              <FilterGroup label="카테고리">
                {activityCats.data?.map((c) => (
                  <Chip
                    key={c.id}
                    active={actCats.includes(c.id)}
                    onClick={() => toggleCat(actCats, c.id, setActCats)}
                  >
                    {c.icon} {c.name}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="소요시간">
                {DURATION_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={actDuration === o.value}
                    onClick={() => setActDuration(actDuration === o.value ? '' : o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="시간대">
                {TIME_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={actTime === o.value}
                    onClick={() => setActTime(actTime === o.value ? '' : o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </FilterGroup>
            </div>
          </FilterBar>

          <div className="mt-4">
            {activitiesQ.isLoading ? (
              <CardGridSkeleton />
            ) : activitiesQ.data && activitiesQ.data.length > 0 ? (
              <div className={GRID}>
                {activitiesQ.data.map((a) => (
                  <ActivityCard key={a.id} activity={a} />
                ))}
              </div>
            ) : activityFiltering ? (
              <EmptyState
                noResults
                message="찾으시는 항목이 없어요 💜"
                hint="다른 필터로 시도해보세요"
              />
            ) : (
              <EmptyState
                message={
                  status === 'wishlist'
                    ? '아직 위시리스트가 비어있어요'
                    : '아직 다녀온 활동이 없어요'
                }
                hint="함께 하고 싶은 활동을 추가해 보세요"
                addHref="/activities/new"
                addLabel="첫 활동 추가하기"
              />
            )}
          </div>
        </div>
      )}

      {/* ── 장소 탭 ── */}
      {track === 'place' && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2">
            <StatusToggle value={status} onChange={setStatus} />
            <SearchBox value={search} onChange={setSearch} />
          </div>

          <FilterBar
            count={placeFilterCount}
            open={filtersOpen}
            onToggle={() => setFiltersOpen((v) => !v)}
          >
            <div className="space-y-3">
              <FilterGroup label="카테고리">
                {placeCatsQuery.data?.map((c) => (
                  <Chip
                    key={c.id}
                    active={placeCats.includes(c.id)}
                    onClick={() => toggleCat(placeCats, c.id, setPlaceCats)}
                  >
                    {c.icon} {c.name}
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="식사시간">
                {MEAL_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    active={placeMeal === o.value}
                    onClick={() => setPlaceMeal(placeMeal === o.value ? '' : o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </FilterGroup>
              <div>
                <p className={cn('mb-1.5 text-xs', styles.faint)}>위치</p>
                <input
                  value={placeLocation}
                  onChange={(e) => setPlaceLocation(e.target.value)}
                  placeholder="위치로 검색 (예: 성수동)"
                  className={cn(styles.plainInput, 'sm:max-w-xs')}
                />
              </div>
            </div>
          </FilterBar>

          <div className="mt-4">
            {placesQ.isLoading ? (
              <CardGridSkeleton />
            ) : placesQ.data && placesQ.data.length > 0 ? (
              <div className={GRID}>
                {placesQ.data.map((p) => (
                  <PlaceCard key={p.id} place={p} />
                ))}
              </div>
            ) : placeFiltering ? (
              <EmptyState
                noResults
                message="찾으시는 항목이 없어요 💜"
                hint="다른 필터로 시도해보세요"
              />
            ) : (
              <EmptyState
                message={
                  status === 'wishlist'
                    ? '아직 가보고 싶은 장소가 없어요'
                    : '아직 다녀온 장소가 없어요'
                }
                hint="가고 싶은 장소를 추가해 보세요"
                addHref="/places/new"
                addLabel="첫 장소 추가하기"
              />
            )}
          </div>
        </div>
      )}

      {/* FAB — 홈과 동일 (활동/장소 추가 메뉴) */}
      <HomeFab />
    </div>
  )
}
