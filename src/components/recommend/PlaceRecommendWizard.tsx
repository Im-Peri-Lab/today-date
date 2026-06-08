'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Plus,
  MapPin,
  Utensils,
  Sunset,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MiniHeart } from '@/components/BrandMark'
import { Input } from '@/components/ui/input'
import { PlaceCard } from '@/components/track/PlaceCard'
import { CategoryIcon } from '@/components/track/categoryIcon'
import { usePlaceCategories } from '@/hooks/useCategories'
import {
  useRecommendPlace,
  type PlaceRecommendResponse,
} from '@/hooks/useRecommend'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'
import type { MealTime } from '@/types'

const MEALS: { value: MealTime; icon: LucideIcon; label: string; sub: string }[] = [
  { value: 'lunch', icon: Utensils, label: '점심', sub: '가볍게 한 끼' },
  { value: 'dinner', icon: Sunset, label: '저녁', sub: '분위기 있게' },
]

function StepDots({ step }: { step: number }) {
  return (
    <div className="mb-6 flex justify-center gap-1.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            'h-1.5 rounded-full transition-all',
            n === step
              ? 'w-6 bg-[var(--s-active-fill,#7c3aed)]'
              : 'w-1.5 bg-[var(--s-faint,#9ca3af)]'
          )}
        />
      ))}
    </div>
  )
}

export function PlaceRecommendWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showResult, setShowResult] = useState(false)
  const [meal, setMeal] = useState<MealTime | null>(null)
  const [location, setLocation] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [result, setResult] = useState<PlaceRecommendResponse | null>(null)

  const cats = usePlaceCategories()
  const recommend = useRecommendPlace()

  function run(overrideCategories?: string[]) {
    if (!meal) return
    const ids = overrideCategories ?? categoryIds
    recommend.mutate(
      {
        meal_time: meal,
        location: location.trim() || undefined,
        category_ids: ids.length > 0 ? ids : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          setShowResult(true)
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : '추천 중 오류가 발생했습니다.'),
      }
    )
  }

  function reset() {
    setStep(1)
    setShowResult(false)
    setResult(null)
    setMeal(null)
    setLocation('')
    setCategoryIds([])
  }

  function toggleCat(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  // ── 결과 화면 ──
  if (showResult && result) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-10 lg:px-8 lg:py-14">
        <button
          onClick={reset}
          className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.accent)}
        >
          <ArrowLeft className="h-4 w-4" />
          처음부터
        </button>

        <div className="mb-6 text-center">
          <span className={cn(styles.gradIcon, 'h-8 w-8')}>
            <MapPin className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className={cn('mt-3 text-xl font-semibold', styles.ink)}>
            {result.reason.replace(/\s*💜\s*$/, '')}
          </h1>
        </div>

        <div className="relative">
          <div
            className={cn(
              recommend.isPending && 'pointer-events-none opacity-40 transition-opacity'
            )}
          >
            {result.recommendations.length === 0 ? (
              <div
                className={cn(
                  'flex flex-col items-center rounded-xl border px-6 py-12 text-center',
                  styles.recEmptyBox
                )}
              >
                <MiniHeart className="h-10 w-10 lg:h-10 lg:w-10" />
                <p className={cn('mt-3 font-medium', styles.ink)}>가고 싶은 곳을 더 모아보세요</p>

                <Link href="/places/new" className="mt-6 block w-full max-w-md">
                  <Button
                    className={cn(
                      'h-10 w-full gap-1.5 text-white hover:brightness-105',
                      styles.detailPrimaryBtn
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    장소 추가하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {result.recommendations.map((p) => (
                  <PlaceCard key={p.id} place={p} hideMenu />
                ))}
              </div>
            )}
          </div>
          {recommend.isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className={cn('h-6 w-6 animate-spin', styles.accent)} />
              <p className={cn('text-sm', styles.sub)}>다른 추천을 찾고 있어요</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          {result.recommendations.length > 0 && (
            <Button
              className={cn(
                'h-10 w-full gap-1.5 text-white hover:brightness-105 sm:w-auto',
                styles.detailPrimaryBtn
              )}
              onClick={() => run()}
              disabled={recommend.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              다른 추천 보기
            </Button>
          )}
          <Button
            variant="ghost"
            className={cn('h-10 w-full sm:w-auto', styles.sub)}
            onClick={reset}
            disabled={recommend.isPending}
          >
            처음부터
          </Button>
        </div>
      </div>
    )
  }

  // ── 마법사 화면 ──
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10 lg:py-14">
      <Link
        href="/"
        className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.accent)}
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <div className={cn(styles.card, 'px-6 py-8 lg:px-8 lg:py-10')}>
        <div className="mb-6 text-center">
          <span className={cn(styles.gradIcon, 'h-8 w-8')}>
            <MapPin className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className={cn('mt-3 text-xl font-semibold', styles.ink)}>어디 갈까?</h1>
        </div>

        <StepDots step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <p className={cn('text-center text-sm', styles.sub)}>언제 먹을까요?</p>
            <div className="grid grid-cols-2 gap-3">
              {MEALS.map((m) => {
                const active = meal === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMeal(m.value)
                      setStep(2)
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-5 transition-all',
                      styles.optionCard,
                      active && styles.optionCardActive
                    )}
                  >
                    <m.icon
                      className={cn('h-7 w-7 shrink-0', !active && styles.accent)}
                      strokeWidth={2}
                    />
                    <span className={cn('font-medium', !active && styles.ink)}>{m.label}</span>
                    <span className={cn('text-xs', !active && styles.sub)}>{m.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className={cn('text-center text-sm', styles.sub)}>
              가고 싶은 동네가 있어요? <span className={styles.faint}>(선택)</span>
            </p>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 마포, 강남, 성수동"
              autoFocus
            />
            <div className="space-y-2 pt-2">
              <Button
                className={cn('h-10 w-full text-white hover:brightness-105', styles.detailPrimaryBtn)}
                onClick={() => setStep(3)}
              >
                다음
              </Button>
              <Button variant="outline" className="h-10 w-full" onClick={() => setStep(1)}>
                이전
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className={cn('text-center text-sm', styles.sub)}>
              카테고리를 골라볼까요? <span className={styles.faint}>(선택)</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {cats.data?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={cn(styles.chip, categoryIds.includes(c.id) && styles.chipActive)}
                >
                  <CategoryIcon name={c.name} className="h-3.5 w-3.5" />
                  {c.name}
                </button>
              ))}
            </div>
            <div className="space-y-2 pt-2">
              <Button
                className={cn(
                  'h-10 w-full gap-1.5 text-white hover:brightness-105',
                  styles.detailPrimaryBtn
                )}
                onClick={() => run()}
                disabled={recommend.isPending}
              >
                <Sparkles className="h-4 w-4" />
                {recommend.isPending ? '추천 받는 중...' : '추천 받기'}
              </Button>
              <Button variant="outline" className="h-10 w-full" onClick={() => setStep(2)}>
                이전
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
