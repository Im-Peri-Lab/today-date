'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/hooks/fetcher'
import { type ListTab } from '@/lib/listReturn'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 홈 상단바 검색 진입점 — 아이콘 버튼 + 검색어 입력 오버레이.
 * 제출 시 활동/장소 매치 유무를 병렬로 확인해 매치가 있는 탭이 선택된 `/list`로 이동한다.
 * 입력 폼 다이얼로그이므로 닫기 수단은 상단 X 하나만(스킬 §11), 하단엔 검색 CTA만 둔다.
 */
export function HomeSearchButton() {
  const router = useRouter()
  const topLoader = useTopLoader()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // 닫힐 때 입력값 초기화(다음 열림은 빈 상태로 시작)
    if (!next) setQuery('')
  }

  async function doSearch() {
    const q = query.trim()
    // trim 후 빈 문자열이면 제출 무시(어떤 API 호출도 없음)
    if (!q || submitting) return

    setSubmitting(true)
    topLoader.start()
    try {
      const enc = encodeURIComponent(q)
      // 기존 API 재사용 — status 미지정이라 양쪽 모두 기본값(wishlist) 대상으로 매치 확인.
      // /list 도착 화면도 status 미지정 → wishlist 기본이라 판정과 결과가 일관된다.
      const [act, plc] = await Promise.all([
        fetchJson<{ data: unknown[] }>(`/api/activities?q=${enc}`),
        fetchJson<{ data: unknown[] }>(`/api/places?q=${enc}`),
      ])
      const hasActivity = (act.data?.length ?? 0) > 0
      const hasPlace = (plc.data?.length ?? 0) > 0

      // 한쪽만 매치 → 그 탭. 둘 다 or 둘 다 없음 → 기본값('activity').
      let tab: ListTab = 'activity'
      if (hasActivity && !hasPlace) tab = 'activity'
      else if (hasPlace && !hasActivity) tab = 'place'

      // 성공 경로에서는 topLoader.done()을 호출하지 않는다 —
      // pushState 패치가 RSC 도착 시 자동 종료(스킬 §12). submitting 은 화면 전환까지 유지.
      router.push(`/list?tab=${tab}&q=${enc}`)
    } catch (err) {
      topLoader.done()
      setSubmitting(false)
      toast.error(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.')
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.headerNavBtn}
        aria-label="검색"
        onClick={() => setOpen(true)}
      >
        <Search className="h-[22px] w-[22px]" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="px-5 pt-6 pb-5">
          <DialogHeader className="mb-1 gap-0">
            <DialogTitle>검색</DialogTitle>
            <DialogDescription className={styles.pageSubtitle}>
              찾고 싶은 활동이나 장소를 검색해 보세요.
            </DialogDescription>
          </DialogHeader>

          {/* Enter 제출은 form onSubmit, 버튼 클릭은 onClick — 둘 다 doSearch 로 일원화 */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void doSearch()
            }}
          >
            <div className={styles.search}>
              <Search className={cn(styles.searchIcon, 'h-4 w-4')} />
              <input
                type="search"
                autoFocus
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목·메모 검색"
                className={styles.searchInput}
                disabled={submitting}
              />
            </div>

            <DialogFooter className="-mx-5 -mb-5 mt-5 p-5">
              <Button
                type="button"
                onClick={() => void doSearch()}
                disabled={submitting}
                className={cn(styles.detailPrimaryBtn, 'h-12 w-full text-white hover:brightness-105')}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? '검색 중...' : '검색'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
