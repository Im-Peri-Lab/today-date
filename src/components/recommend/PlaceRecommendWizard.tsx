'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Sparkles, RotateCcw, Heart, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlaceCard } from '@/components/track/PlaceCard'
import { usePlaceCategories } from '@/hooks/useCategories'
import {
  useRecommendPlace,
  useSelectRecommendation,
  type PlaceRecommendResponse,
} from '@/hooks/useRecommend'
import { cn } from '@/lib/utils'
import type { MealTime } from '@/types'

const MEALS: { value: MealTime; emoji: string; label: string; sub: string }[] = [
  { value: 'lunch', emoji: '🍽️', label: '점심', sub: '가볍게 한 끼' },
  { value: 'dinner', emoji: '🌆', label: '저녁', sub: '분위기 있게' },
]

function defaultMeal(): MealTime {
  return new Date().getHours() < 14 ? 'lunch' : 'dinner'
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="mb-4 flex justify-center gap-1.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={cn(
            'h-1.5 rounded-full transition-all',
            n === step ? 'w-6 bg-violet-500' : 'w-1.5 bg-violet-200'
          )}
        />
      ))}
    </div>
  )
}

export function PlaceRecommendWizard() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showResult, setShowResult] = useState(false)
  const [meal, setMeal] = useState<MealTime>(defaultMeal())
  const [location, setLocation] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [result, setResult] = useState<PlaceRecommendResponse | null>(null)

  const cats = usePlaceCategories()
  const recommend = useRecommendPlace()
  const select = useSelectRecommendation()

  function run(overrideCategories?: string[]) {
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
    setMeal(defaultMeal())
    setLocation('')
    setCategoryIds([])
  }

  function toggleCat(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function handleLike(id: string) {
    if (result?.log_id) select.mutate({ log_id: result.log_id, selected_id: id })
    router.push(`/places/${id}`)
  }

  // ── 결과 화면 ──
  if (showResult && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={reset}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
        >
          <ArrowLeft className="h-4 w-4" />
          처음부터
        </button>

        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          <p className="text-lg font-medium text-violet-800">{result.reason}</p>
        </div>

        {result.recommendations.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-violet-200 bg-white/50 px-6 py-14 text-center">
            <Heart className="mb-3 h-10 w-10 fill-violet-100 text-violet-300" />
            <p className="font-medium text-violet-800">조건에 맞는 항목이 없어요</p>
            <p className="mt-1 text-sm text-gray-500">위시리스트에 새 장소를 추가해 보세요.</p>
            <Link href="/places/new" className="mt-5">
              <Button className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
                <Plus className="h-4 w-4" />
                장소 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.recommendations.map((p) => (
              <PlaceCard
                key={p.id}
                place={p}
                hideMenu
                actionSlot={
                  <Button
                    onClick={() => handleLike(p.id)}
                    className="w-full gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                  >
                    <Heart className="h-4 w-4" />
                    이거 좋아 💜
                  </Button>
                }
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => run()}
            disabled={recommend.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            {recommend.isPending ? '추천 받는 중...' : '다른 추천 보기'}
          </Button>
          <Button variant="ghost" className="flex-1 text-violet-700" onClick={reset}>
            처음부터
          </Button>
        </div>
      </div>
    )
  }

  // ── 마법사 화면 ──
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <Card className="shadow-xl border-violet-100">
        <CardHeader className="text-center">
          <div className="mb-1 text-4xl">📍</div>
          <CardTitle className="text-xl text-violet-800">어디 갈까?</CardTitle>
        </CardHeader>
        <CardContent>
          <StepDots step={step} />

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">언제 먹을까요?</p>
              <div className="grid grid-cols-2 gap-3">
                {MEALS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMeal(m.value)
                      setStep(2)
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border-2 p-5 transition-all',
                      meal === m.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300'
                    )}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="font-medium text-foreground">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                가고 싶은 동네가 있어요? <span className="text-gray-400">(선택)</span>
              </p>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 마포, 강남, 성수동"
                autoFocus
              />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  이전
                </Button>
                <Button
                  className="flex-1 bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => setStep(3)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                카테고리를 골라볼까요? <span className="text-gray-400">(선택)</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {cats.data?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      categoryIds.includes(c.id)
                        ? 'border-violet-500 bg-violet-50 font-medium text-violet-700'
                        : 'border-input text-muted-foreground hover:border-violet-300'
                    )}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  이전
                </Button>
                <Button
                  className="flex-1 gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => run()}
                  disabled={recommend.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  {recommend.isPending ? '추천 받는 중...' : '추천 받기'}
                </Button>
              </div>
              <button
                onClick={() => run([])}
                disabled={recommend.isPending}
                className="w-full text-center text-sm text-gray-400 hover:text-violet-600 disabled:opacity-50"
              >
                건너뛰고 추천 받기
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
