'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Heart,
  Plus,
  Hourglass,
  Sun,
  Moon,
  Clock,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityCard } from '@/components/track/ActivityCard'
import { CategoryIcon } from '@/components/track/categoryIcon'
import { useActivityCategories } from '@/hooks/useCategories'
import {
  useRecommendActivity,
  type ActivityRecommendResponse,
} from '@/hooks/useRecommend'
import { TIME_OPTIONS, TIME_OF_DAY_ICONS, TIME_OF_DAY_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'
import type { DurationBucket, TimeOfDay } from '@/types'

const DURATIONS: { value: DurationBucket; icon: LucideIcon; label: string; sub: string }[] = [
  { value: 'half', icon: Hourglass, label: '반나절', sub: '2~4시간 가볍게' },
  { value: 'full', icon: Sun, label: '하루', sub: '하루를 꽉 채워서' },
  { value: 'overnight', icon: Moon, label: '1박 이상', sub: '멀리 떠나기' },
]

function StepDots({ step, steps }: { step: number; steps: number[] }) {
  return (
    <div className="mb-6 flex justify-center gap-1.5">
      {steps.map((n) => (
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

export function ActivityRecommendWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showResult, setShowResult] = useState(false)
  const [duration, setDuration] = useState<DurationBucket | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(null)
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [includeShorter, setIncludeShorter] = useState(false)
  const [result, setResult] = useState<ActivityRecommendResponse | null>(null)

  const cats = useActivityCategories()
  const recommend = useRecommendActivity()

  // overnight(1박 이상)은 시간대 단계를 건너뛴다 → 표시 단계도 2개([1,3])
  const steps = duration === 'overnight' ? [1, 3] : [1, 2, 3]

  function run(overrideCategories?: string[], overrideShorter?: boolean) {
    if (!duration) return
    const ids = overrideCategories ?? categoryIds
    const shorter = overrideShorter ?? includeShorter
    recommend.mutate(
      {
        duration_bucket: duration,
        time_of_day: timeOfDay ?? undefined,
        category_ids: ids.length > 0 ? ids : undefined,
        include_shorter: shorter || undefined,
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

  // 결과 화면 토글: 상태를 바꾸고 새 값으로 즉시 재호출(기존 "다른 추천 보기" 재호출 구조 활용)
  function toggleShorter() {
    const next = !includeShorter
    setIncludeShorter(next)
    run(undefined, next)
  }

  function reset() {
    setStep(1)
    setShowResult(false)
    setResult(null)
    setDuration(null)
    setTimeOfDay(null)
    setCategoryIds([])
    setIncludeShorter(false)
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
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
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
              <div className="flex flex-col items-center rounded-xl border border-dashed border-violet-200 bg-white/50 px-6 py-14 text-center">
                <Heart className="mb-3 h-10 w-10 fill-violet-100 text-violet-300" />
                <p className="font-medium text-violet-800">조건에 맞는 항목이 없어요</p>
                <p className="mt-1 text-sm text-gray-500">
                  위시리스트에 새 활동을 추가해 보세요.
                </p>
                <Link href="/activities/new" className="mt-5">
                  <Button className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
                    <Plus className="h-4 w-4" />
                    활동 추가하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {result.recommendations.map((a) => (
                  <ActivityCard key={a.id} activity={a} hideMenu />
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

        {duration !== 'half' && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={toggleShorter}
              aria-pressed={includeShorter}
              disabled={recommend.isPending}
              className={cn(styles.filterToggle, includeShorter && styles.filterToggleActive)}
            >
              <Hourglass className="h-4 w-4" />
              더 짧은 일정도 볼까요?
            </button>
          </div>
        )}

        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3',
            duration === 'half' ? 'mt-6' : 'mt-4'
          )}
        >
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
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className={cn('mt-3 text-xl font-semibold', styles.ink)}>오늘 뭐할까?</h1>
        </div>

        <StepDots step={step} steps={steps} />

        {step === 1 && (
          <div className="space-y-4">
            <p className={cn('text-center text-sm', styles.sub)}>
              얼마나 시간을 낼 수 있어요?
            </p>
            <div className="space-y-2">
              {DURATIONS.map((d) => {
                const active = duration === d.value
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      setDuration(d.value)
                      if (d.value === 'overnight') {
                        // 1박 이상은 낮/밤 구분이 무의미 → 시간대 단계 건너뛰고 바로 카테고리로
                        setTimeOfDay(null)
                        setStep(3)
                      } else {
                        setStep(2)
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
                      styles.optionCard,
                      active && styles.optionCardActive
                    )}
                  >
                    <d.icon
                      className={cn('h-6 w-6 shrink-0', !active && styles.accent)}
                      strokeWidth={2}
                    />
                    <div>
                      <div className={cn('font-medium', !active && styles.ink)}>{d.label}</div>
                      <div className={cn('text-xs', !active && styles.sub)}>{d.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className={cn('text-center text-sm', styles.sub)}>언제 만날까요?</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map((t) => {
                const active = timeOfDay === t.value
                // 입력 단계 한정: any 는 공용 매핑상 아이콘이 없어(카드·상세 규칙 유지)
                // day/night 와 시각 무게를 맞추기 위해 중립 아이콘(Clock)으로 폴백.
                const Icon = TIME_OF_DAY_ICONS[t.value] ?? Clock
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setTimeOfDay(t.value)
                      setStep(3)
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 rounded-xl border p-3 transition-all',
                      styles.optionCard,
                      active && styles.optionCardActive
                    )}
                  >
                    <Icon
                      className={cn('h-6 w-6 shrink-0', !active && styles.accent)}
                      strokeWidth={2}
                    />
                    <span className={cn('text-sm font-medium', !active && styles.ink)}>
                      {TIME_OF_DAY_LABELS[t.value]}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                className="h-10 w-full"
                onClick={() => setStep(1)}
              >
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
              <Button
                variant="outline"
                className="h-10 w-full"
                onClick={() => setStep(duration === 'overnight' ? 1 : 2)}
              >
                이전
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
