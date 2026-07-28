'use client'

import { useEffect, useState } from 'react'
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
import { readPlaceResult, stashPlaceResult } from '@/lib/recommend/resultCache'
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

// 결과 캐시(resultCache.ts) 무효화 키 — 선택 조건만으로 구성(step은 항상 고정값이라 무관).
function placeConditionsKey(
  s: Pick<PlaceWizardUrlState, 'meal' | 'area' | 'categoryIds'>
): string {
  return buildPlaceWizardQuery({ step: 'result', ...s })
}

// 단계 전환은 실제 화면 전환에 대응하므로 next/navigation 라우터(RSC 재요청 유발) 대신
// 히스토리 API를 직접 사용해 엔트리를 쌓는다 — ListView의 필터 URL 동기화와 동일한 패턴.
// 모든 전환(다음/이전/처음부터)이 항상 push만 사용 → 뒤로가기 한 번 = 직전에 보였던 화면으로 복귀.
function pushPlaceWizardState(s: PlaceWizardUrlState) {
  const qs = buildPlaceWizardQuery(s)
  window.history.pushState(null, '', `${window.location.pathname}?${qs}`)
}

// 같은 단계에 머문 채 선택값만 바뀔 때(직전 단계 엔트리에 방금 고른 값을 반영할 때,
// 동네 입력·카테고리 토글처럼 화면 전환 없이 값만 바뀔 때) 사용 — 새 엔트리를 쌓지 않고
// "현재 엔트리"를 갱신한다. 이걸 거치지 않으면 어떤 단계를 처음 지나칠 때 저장된
// (아직 선택 전) 엔트리가 그대로 남아, 뒤로가기로 그 단계에 돌아왔을 때 선택이
// 안 된 것처럼 보인다.
function replacePlaceWizardState(s: PlaceWizardUrlState) {
  const qs = buildPlaceWizardQuery(s)
  window.history.replaceState(null, '', `${window.location.pathname}?${qs}`)
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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showResult, setShowResult] = useState(false)
  const [meal, setMeal] = useState<MealTime | null>(null)
  const [area, setArea] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [result, setResult] = useState<PlaceRecommendResponse | null>(null)

  const cats = usePlaceCategories()
  const recommend = useRecommendPlace()

  // 조건만으로 결과를 다시 조회 — 마운트 시 URL이 이미 step=result인데 sessionStorage
  // 캐시가 없을 때(사생활 보호 모드 등 저장이 막혔거나 최초 진입 등)의 폴백 전용.
  // 이 시점엔 result가 항상 비어 있으므로(새로 마운트된 인스턴스) run()과 달리 재조회 여부를
  // 따질 필요 없이 바로 호출하며, 히스토리도 건드리지 않는다(이미 그 URL에 있으므로).
  function fetchResultForUrlState(next: PlaceWizardUrlState) {
    if (!next.meal) return
    recommend.mutate(
      {
        meal_time: next.meal,
        area: next.area.trim() || undefined,
        category_ids: next.categoryIds.length > 0 ? next.categoryIds : undefined,
      },
      {
        onSuccess: (data) => {
          setResult(data)
          setShowResult(true)
          stashPlaceResult(placeConditionsKey(next), data)
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : '추천 중 오류가 발생했습니다.'),
      }
    )
  }

  // 마운트 시 URL → state 1회 동기화. `window.location`은 next/link의 클라이언트 사이드
  // 전환(예: 상세 화면 "추천 결과로" 복귀) 중에는 렌더 시점에 아직 갱신되지 않은 경우가 있어
  // useState 지연 초기화 대신 커밋 이후 실행되는 이펙트에서 읽어야 안전하다. URL이 이미
  // step=result면(결과 카드 → 상세 → 복귀 등, 실제 페이지 이동이라 새로 마운트되는 경우)
  // result 데이터 자체는 URL에 담기지 않으므로 먼저 sessionStorage 캐시에서 복원을
  // 시도한다 — 재조회하면 pickTopWithShuffle이 매번 다른 카드를 뽑을 수 있어 "정확히 그
  // 결과 화면으로 복귀"가 깨지기 때문. 캐시가 없을 때만(조건이 바뀌었거나 저장이 막힌 경우)
  // 실제 재조회로 폴백한다.
  useEffect(() => {
    const next = readPlaceWizardUrlState(window.location.search)
    setMeal(next.meal)
    setArea(next.area)
    setCategoryIds(next.categoryIds)

    if (next.step === 'result') {
      setStep(3)
      const cached = readPlaceResult(placeConditionsKey(next))
      if (cached) {
        setResult(cached)
        setShowResult(true)
      } else {
        fetchResultForUrlState(next)
      }
    } else {
      setStep(next.step)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // 아직 결과 화면이 아니었을 때만(=최초 진입) push 한다. (URL이 이미 step=result인 채로
    // 마운트될 때의 재조회는 별도의 fetchResultForUrlState가 담당하며 run()을 거치지
    // 않으므로 여기서 고려하지 않아도 된다.)
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
          // 트랙당 슬롯 하나뿐이라 매 성공 응답이 그대로 최신값으로 덮어쓴다 — "다른 추천
          // 보기"로 화면이 갱신될 때도 다음 뒤로가기 복귀가 그 최신 화면을 그대로 복원하게 한다.
          stashPlaceResult(placeConditionsKey({ meal, area, categoryIds: ids }), data)
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
    setCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      // 화면 전환 없이 같은 단계(step3)에 머무는 값 변경 — 새 엔트리를 쌓지 않고
      // 현재 엔트리만 갱신해 뒤로가기/앞으로가기로 돌아왔을 때도 반영되게 한다.
      replacePlaceWizardState({ step, meal, area, categoryIds: next })
      return next
    })
  }

  // ── 결과 화면 ──
  if (showResult && result) {
    // 결과 카드 → 상세 진입 후 "추천 결과로" 복귀 시 정확히 이 결과 화면(선택 조건 포함)으로
    // 돌아오게 하는 returnTo. 위저드는 순수 History API로만 URL을 관리하므로(§ pushPlaceWizardState)
    // 현재 주소를 그대로 읽으면 된다 — 이 분기는 항상 클라이언트 상호작용 이후에만 렌더되므로
    // window 접근이 안전하다(SSR에서는 도달하지 않음).
    const resultReturnTo =
      typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : undefined
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
                    <PlaceCard place={p} hideMenu returnTo={resultReturnTo} />
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
      {/* 1단계는 아직 아무 선택도 하지 않아 리셋할 대상이 없다 — 유일한 동작은 홈 이탈
          자체이므로 목적지 이동형("홈으로"+Link). 2단계부터는 이미 선택한 값이 있어
          되돌릴 대상이 생기므로 상태 리셋형("처음부터"+reset())으로 분기(§13). */}
      {step === 1 ? (
        <Link
          href="/"
          className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.backLink)}
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>
      ) : (
        <button
          type="button"
          onClick={reset}
          className={cn('mb-3 inline-flex items-center gap-1.5 text-sm', styles.backLink)}
        >
          <ArrowLeft className="h-4 w-4" />
          처음부터
        </button>
      )}

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
                      // 방금 고른 값을 "떠나는" step1 엔트리에도 반영 — 뒤로가기로 이 단계에
                      // 돌아왔을 때 방금 고른 값이 미선택 상태로 보이지 않도록.
                      replacePlaceWizardState({ step: 1, meal: m.value, area, categoryIds })
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
              onChange={(e) => {
                const next = e.target.value
                setArea(next)
                // 텍스트 입력은 화면 전환이 아니므로 push 대신 현재(step2) 엔트리만 갱신 —
                // 키 입력마다 히스토리가 쌓이지 않으면서도 뒤로가기 시 입력값이 보존된다.
                replacePlaceWizardState({ step: 2, meal, area: next, categoryIds })
              }}
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
