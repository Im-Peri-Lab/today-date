import Link from 'next/link'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 하위 화면 상단 줄 — 좌측은 화면별 뒤로가기(없을 수 있음), 우측은 항상 홈 아이콘.
 * 홈 아이콘은 PageHeader(/list)와 같은 `.headerNavBtn`(44px 박스/22px 글리프)이다.
 * 버튼의 세로 마진을 음수로 줘서 줄 높이는 기존 텍스트 링크(20px)와 같게 유지한다.
 */
export function TopBar({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-5 items-center justify-between', className)}>
      {children ?? <span />}
      <Link href="/" className={cn('-my-3', styles.headerNavBtn)} aria-label="홈으로">
        <Home className="h-[22px] w-[22px]" />
      </Link>
    </div>
  )
}
