'use client'

import { useEffect } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 홈(`/`) 전용 오류 경계.
 *
 * `(home)` 라우트 그룹 안에 둔 이유 — error.tsx 는 자신이 속한 세그먼트와 그 하위 전체를
 * 감싸므로, src/app/error.tsx 에 두면 /list·/activities/[id] 등 이 파일과 무관한 화면까지
 * 전부 이 경계로 묶인다. 그룹 폴더는 URL에 흔적을 남기지 않으므로 경로는 여전히 `/` 다.
 *
 * getDashboardStats 가 DB 오류를 삼키지 않고 throw 하도록 바꾼 뒤(§ src/lib/data/dashboard.ts)
 * 여기서 실제로 잡을 오류가 생겼다 — 그 전에는 항상 "전부 0"으로 조용히 렌더돼 경계가 뜰 일이
 * 없었다.
 *
 * reset()·router.refresh() 는 실측으로 배제했다 — 프로덕션 빌드(`next start`)에서, 이 라우트가
 * 한 번 던진 뒤에는 RSC 전용 재요청(`router.refresh()`가 보내는 `?_rsc=` 요청)이 DB 복구
 * 여부와 무관하게 항상 이전의 오류 RSC 페이로드를 그대로 돌려줬다 — curl로 같은 요청을 반복
 * 재현해 스텁 DB가 확실히 살아있는 순간에도 매번 재현됐고, 라우트 그룹을 걷어내고 `/`를
 * 최상위 `src/app/page.tsx`로 되돌려도 동일했다(Next 14.2.35 자체의 동작, 이 파일의 구조와는
 * 무관). 반면 RSC 헤더 없는 일반 최상위 GET(주소창 새로고침과 동일 경로)은 그때마다 매번
 * 새로 실행돼 정확히 반영했다. 그래서 재시도는 reset() 이 아니라 `window.location.reload()`
 * 로 최상위 GET을 강제한다 — 이 경로만 실측으로 신뢰할 수 있었다.
 */
export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[HomePage error boundary]', error)
  }, [error])

  // reset() 으로 React 오류 경계 상태를 먼저 지우고, 실제 데이터 재조회는
  // location.reload() 로 강제한다(위 주석 — RSC 전용 재요청은 신뢰할 수 없었다).
  function handleRetry() {
    reset()
    window.location.reload()
  }

  return (
    <main className={cn(styles.page, styles.pageHome)}>
      <div
        className={cn(
          styles.fill,
          'mx-auto w-full max-w-xl px-5 pb-16 pt-6 lg:max-w-3xl lg:px-8 lg:pt-12'
        )}
      >
        <PageHeader
          title="잠시 문제가 생겼어요"
          subtitle="데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
        />

        <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <CloudOff className={cn('h-10 w-10', styles.faint)} strokeWidth={1.5} />

          <div className="w-full max-w-[200px]">
            <Button
              type="button"
              onClick={handleRetry}
              className={cn(styles.detailPrimaryBtn, 'h-10 w-full gap-1.5 text-white hover:brightness-105')}
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
