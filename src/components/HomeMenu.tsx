'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { Menu, LogOut, Loader2, Users, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { usePartner } from '@/hooks/usePartner'
import styles from '@/components/screens.module.css'

/**
 * 메뉴 항목 정의 — 항목이 늘어나도 모양이 갈리지 않도록 "선언 → 단일 렌더"로 둔다.
 *
 * 항목 종류는 두 가지뿐이다:
 *   link   — 다른 화면으로 이동한다(`<a>`, 스크린리더가 "링크"로 읽는다).
 *   action — 현재 화면에서 무언가를 실행한다(로그아웃처럼 이동이 부수 효과인 것 포함).
 *
 * 항목을 추가할 때 건드리는 곳은 아래 items 배열 하나다 — 아이콘·라벨·이동/실행만
 * 정하면 표면(패딩·글자 크기·hover·아이콘 크기)은 ui/dropdown-menu 의 공통
 * 클래스가 자동으로 맞춘다.
 */
type MenuItemDef =
  | { kind: 'link'; key: string; label: string; icon: LucideIcon; href: string }
  | {
      kind: 'action'
      key: string
      label: string
      icon: LucideIcon
      onSelect: () => void
      /** destructive 는 빨강 글자 + 위쪽 구분선(파괴적 액션 격리, § 디자인 5-A). */
      variant?: 'default' | 'destructive'
      /** 진행 중 표시 — 아이콘이 스피너로 바뀌고 라벨이 pendingLabel 로 교체된다. */
      pending?: boolean
      pendingLabel?: string
    }

/** 홈/목록 우상단 미니멀 메뉴 — 햄버거 → (파트너) · 로그아웃 */
export function HomeMenu() {
  const router = useRouter()
  const topLoader = useTopLoader()
  const [isLoading, setIsLoading] = useState(false)
  const { data: partnerData } = usePartner()

  async function handleLogout() {
    setIsLoading(true)
    topLoader.start()
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) {
        toast.error('로그아웃 중 오류가 발생했습니다.')
        topLoader.done()
        return
      }
      router.push('/lock')
      router.refresh()
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
      topLoader.done()
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * "파트너"는 상대가 실제로 있을 때만 그린다(PAIRED).
   *
   * SOLO 에서는 보여줄 사람이 없으므로 항목 자체를 만들지 않는다 — 화면(/partner/info)도
   * 같은 판정으로 홈으로 되돌리지만(§ app/partner/info/page.tsx), 눌러야 알 수 있는
   * 빈 화면을 메뉴에 남겨두지 않는다. 조회 전(undefined)에도 그리지 않아 "있다"로
   * 잘못 깜빡이는 일이 없다.
   */
  const items: MenuItemDef[] = [
    ...(partnerData?.partner
      ? [
          {
            kind: 'link' as const,
            key: 'partner',
            label: '파트너',
            icon: Users,
            href: '/partner/info',
          },
        ]
      : []),
    {
      kind: 'action',
      key: 'logout',
      label: '로그아웃',
      icon: LogOut,
      onSelect: handleLogout,
      variant: 'destructive',
      pending: isLoading,
      pendingLabel: '로그아웃 중...',
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.headerNavBtn} aria-label="메뉴" />}
      >
        <Menu className="h-[22px] w-[22px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item, index) => {
          const Icon = item.icon

          if (item.kind === 'link') {
            return (
              <DropdownMenuLinkItem key={item.key} render={<Link href={item.href} />}>
                <Icon />
                {item.label}
              </DropdownMenuLinkItem>
            )
          }

          const pending = !!item.pending

          return (
            <Fragment key={item.key}>
              {/* 파괴적 액션은 위의 일반 항목들과 구분선으로 갈라 둔다(첫 항목이면 불필요). */}
              {item.variant === 'destructive' && index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant={item.variant}
                disabled={pending}
                onClick={item.onSelect}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Icon />}
                {pending ? (item.pendingLabel ?? item.label) : item.label}
              </DropdownMenuItem>
            </Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
