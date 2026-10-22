'use client'

import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { Plus, Sparkles, UtensilsCrossed } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { buildDetailHref } from '@/lib/listReturn'
import styles from '@/components/screens.module.css'

/** 우하단 FAB — 클릭 시 액티비티/다이닝 추가 메뉴를 위로 펼침 */
export function HomeFab({ returnTo }: { returnTo?: string }) {
  const router = useRouter()
  const topLoader = useTopLoader()

  // 메뉴 항목발 이동은 <Link> 가 아니라 바가 자동으로 뜨지 않는다. /new 가 라우터 캐시에 있으면
  // push 가 즉시 커밋돼 바가 페인트 전에 끝나므로(pushState 시점에 done) start() 한 프레임 뒤에 push 한다.
  function navigate(href: string) {
    topLoader.start()
    requestAnimationFrame(() => router.push(href))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.fab} aria-label="추가하기" />}
      >
        <Plus className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={12}>
        <DropdownMenuItem
          onClick={() => navigate(buildDetailHref('/activities/new', { returnTo }))}
        >
          <Sparkles />
          액티비티 추가
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(buildDetailHref('/places/new', { returnTo }))}
        >
          <UtensilsCrossed />
          다이닝 추가
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
