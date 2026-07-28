'use client'

import { useEffect, useRef, useState } from 'react'
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

type PlaceWizardStep = 1 | 2 | 3 | 'result'

interface PlaceWizardUrlState {
  step: PlaceWizardStep
  meal: MealTime | null
  area: string
  categoryIds: string[]
}

function parseMealParam(v: string | null): MealTime | null {
  return v === 'lunch' || v === 'dinner' ? v : null
}
function parseCategoryIdsParam(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : []
}

function readPlaceWizardUrlState(search: string): PlaceWizardUrlState {
  const params = new URLSearchParams(search)
  const stepParam = params.get('step')
  const step: PlaceWizardStep =
    stepParam === 'result' ? 'result' : stepParam === '2' || stepParam === '3' ? (Number(stepParam) as 2 | 3) : 1
  return {
    step,
    meal: parseMealParam(params.get('meal')),
    area: params.get('area') ?? '',
    categoryIds: parseCategoryIdsParam(params.get('cats')),
  }
}

function buildPlaceWizardQuery(s: PlaceWizardUrlState): string {
  const params = new URLSearchParams()
  params.set('step', String(s.step))
  if (s.meal) params.set('meal', s.meal)
  if (s.area) params.set('area', s.area)
  if (s.categoryIds.length > 0) params.set('cats', s.categoryIds.join(','))
  return params.toString()
}

// 단계 전환은 실제 화면 전환에 대응하므로 next/navigation 라우터(RSC 재요청 유발) 대신
// 히스토리 API를 직접 사용해 엔트리를 쌓는다 — ListView의 필터 URL 동기화와 동일한 패턴.
// 모든 전환(다음/이전/처음부터)이 항상 push만 사용 → 뒤로가기 한 번 = 직전에 보였던 화면으로 복귀.
function pushPlaceWizardState(s: PlaceWizardUrlState) {
  const qs = buildPlaceWizardQuery(s)
  window.history.pushState(null, '', `${window.location.pathname}?${qs}`)
}

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
  // 히스토리 back/forward로 이 화면에 처음 진입할 때(예: 새로고침)는 URL의 선택값을 그대로
  // 초기 state로 복원한다. result 데이터는 URL에 담기지 않으므로 result 단계로는 복원하지 않는다.
  const initialUrlStateRef = useRef<PlaceWizardUrlState | null>(null)
  if (initialUrlStateRef.current === null && typeof window !== 'undefined') {
    initialUrlStateRef.current = readPlaceWizardUrlState(window.location.search)
  }
  const initialUrlState = initialUrlStateRef.current

  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const s = initialUrlState?.step ?? 1
    return s === 'result' ? 3 : s
  })
  const [showResult, setShowResult] = useState(false)
  const [meal, setMeal] = useState<MealTime | null>(() => initialUrlState?.meal ?? null)
  const [area, setArea] = useState(() => initialUrlState?.area ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>(() => initialUrlState?.categoryIds ?? [])
  const [result, setResult] = useState<PlaceRecommendResponse | null>(null)

  const cats = usePlaceCategories()
  const recommend = useRecommendPlace()

  // 브라우저/OS 뒤로가기(모바일 스와이프 포함) 시 URL → state 역동기화.
  // result 데이터가 메모리에 없는 채로 step=result를 만나면(새로고침 등) 결과 화면 대신
  // 마지막 입력 단계로 대체한다.
  useEffect(() => {
    function handlePopState() {
      const next = readPlaceWizardUrlState(window.location.search)
      setMeal(next.meal)
      setArea(next.area)
      setCategoryIds(next.categoryIds)

      if (next.step === 'result') {
        if (result) {
          setShowResult(true)
        } else {
          setShowResult(false)
          setStep(3)
        }
      } else {
        setShowResult(false)
        setStep(next.step)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [result])

  function run(overrideCategories?: string[]) {
    if (!meal) return
    const ids = overrideCategories ?? categoryIds
    // run()은 step3→결과 진입과 결과 화면 내 재조회("다른 추천 보기") 모두에서 호출된다 —
    // 히스토리 엔트리는 "결과 화면 진입" 그 자체에서만 한 번 쌓아야 하므로, 호출 시점에
    // 아직 결과 화면이 아니었을 때만(=최초 진입) push 한다.
    const enteringResult = !showResult
    recommend.mutate(
      {
        meal_time: meal,
        area: area.trim() || undefined,
        category_ids: ids.length > 0 ? ids : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          setShowResult(true)
          if (enteringResult) {
            pushPlaceWizardState({ step: 'result', meal, area, categoryIds: ids })
          }
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
    setArea('')
    setCategoryIds([])
    pushPlaceWizardState({ step: 1, meal: null, area: '', categoryIds: [] })
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
          className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.backLink)}
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
                  'mx-auto flex w-full flex-col items-center rounded-xl border px-6 py-12 text-center sm:max-w-md',
                  styles.recEmptyBox
                )}
              >
                <MiniHeart className="h-10 w-10 lg:h-10 lg:w-10" />
                <p className={cn('mt-3 font-medium', styles.ink)}>가고 싶은 곳을 더 모아보세요</p>

                <Link href="/places/new" className="mx-auto mt-6 block w-full sm:max-w-xs">
                  <Button
                    className={cn(
                      'h-10 w-full gap-1.5 text-white hover:brightness-105',
                      styles.gradIcon
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    다이닝 추가하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {result.recommendations.map((p) => (
                  // 1~2개여도 가운데로 모이게 flex+justify-center. 폭은 3열 그리드와 동일(≈267px),
                  // 단독일 때 화면을 꽉 채우지 않도록 sm 이상 max-width 캡. 모바일은 w-full 그대로.
                  <div
                    key={p.id}
                    className="w-full sm:w-[calc(50%-0.5rem)] sm:max-w-[280px] lg:w-[calc(33.333%-0.667rem)]"
                  >
                    <PlaceCard place={p} hideMenu />
                  </div>
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

        {/* 하단 액션: 액티비티 화면과 동일한 max-w-md 세로 스택(동일 높이 40px). 다른 추천 보기 → 처음부터 */}
        <div className="mx-auto mt-6 flex w-full flex-col gap-2 sm:max-w-xs">
          {result.poolSize > 3 && (
            <Button
              className={cn(
                'h-10 w-full gap-1.5 text-white hover:brightness-105',
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
            className={cn(
              'h-10 w-full bg-transparent text-[color:var(--s-sub,#6b7280)]',
              // 액티비티 화면과 동일: 회색 채움 hover 폐기 → 투명 유지 + accent 글씨
              'hover:bg-transparent hover:text-[color:var(--s-active-text,#7c3aed)]'
            )}
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
        className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.backLink)}
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <div className={cn(styles.card, 'px-6 py-8 lg:px-8 lg:py-10')}>
        <div className="mb-6 text-center">
          <span className={cn(styles.gradIcon, 'h-8 w-8')}>
            <MapPin className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className={cn('mt-3 text-xl font-semibold', styles.ink)}>오늘 뭐먹을까?</h1>
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
                      pushPlaceWizardState({ step: 2, meal: m.value, area, categoryIds })
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
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 마포, 강남, 성수동"
              autoFocus
            />
            <div className="space-y-2 pt-2">
              <Button
                className={cn('h-10 w-full text-white hover:brightness-105', styles.detailPrimaryBtn)}
                onClick={() => {
                  setStep(3)
                  pushPlaceWizardState({ step: 3, meal, area, categoryIds })
                }}
              >
                다음
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full"
                onClick={() => {
                  setStep(1)
                  pushPlaceWizardState({ step: 1, meal, area, categoryIds })
                }}
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
                {recommend.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {recommend.isPending ? '추천 받는 중...' : '추천 받기'}
              </Button>
              <Button
                variant="outline"
                className="h-10 w-full"
                onClick={() => {
                  setStep(2)
                  pushPlaceWizardState({ step: 2, meal, area, categoryIds })
                }}
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
