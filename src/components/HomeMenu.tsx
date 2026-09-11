'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopLoader } from 'nextjs-toploader'
import { Menu, LogOut, Loader2, Trash2, Users, type LucideIcon } from 'lucide-react'
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
  | {
      kind: 'link'
      key: string
      label: string
      icon: LucideIcon
      href: string
      /** destructive 는 빨강 글자(파괴적 액션 격리, § 디자인 5-A). */
      variant?: 'default' | 'destructive'
    }
  | {
      kind: 'action'
      key: string
      label: string
      icon: LucideIcon
      onSelect: () => void
      /** destructive 는 빨강 글자(파괴적 액션 격리, § 디자인 5-A). */
      variant?: 'default' | 'destructive'
      /** 진행 중 표시 — 아이콘이 스피너로 바뀌고 라벨이 pendingLabel 로 교체된다. */
      pending?: boolean
      pendingLabel?: string
    }

/** 홈/목록 우상단 미니멀 메뉴 — 햄버거 → (파트너) · 로그아웃 · (계정 삭제) */
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
   *
   * "계정 삭제"는 그 반대로 SOLO 에서만 그린다 — 파트너가 있는 계정의 삭제는 상대의
   * 데이터까지 지우는 일이라 이 경로가 다루지 않는다(§ lib/auth/accountDeletion.ts).
   * 판정 근거는 같은 응답 하나다: partner 가 null 이면 SOLO, 값이 있으면 PAIRED.
   * 그래서 두 항목은 절대 동시에 나오지 않고, 조회 전(undefined)에는 둘 다 나오지 않는다
   * — "혼자인지 둘인지" 모르는 동안 탈퇴 진입점을 보여주지 않는 것이 안전한 기본값이다.
   */
  const isSolo = partnerData !== undefined && partnerData.partner === null

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
    /*
     * 로그아웃은 중성이다(destructive 아니다) — 되돌릴 수 있는 일이기 때문이다.
     * 패스코드를 다시 넣으면 같은 자리로 돌아오고 잃는 것이 없다. 빨강은 "계정 삭제"
     * 하나에만 남긴다: 한 메뉴 안에 빨강이 둘이면 둘 다 같은 무게로 읽혀, 진짜로
     * 되돌릴 수 없는 항목의 경고가 묻힌다(§ 디자인 5-A 파괴적 액션 격리의 취지).
     */
    {
      kind: 'action',
      key: 'logout',
      label: '로그아웃',
      icon: LogOut,
      onSelect: handleLogout,
      pending: isLoading,
      pendingLabel: '로그아웃 중...',
    },
    /*
     * 삭제는 메뉴에서 즉시 실행하지 않고 전용 화면으로 보낸다(link) — 되돌릴 수 없는
     * 작업이라 확인 문구 입력과 재확인이 필요하고(§ AccountDeleteForm), 그건 드롭다운
     * 항목 안에 들어갈 수 없다. 파괴적 액션은 맨 끝(§ 디자인 5-A ItemMenu 순서 근거).
     */
    ...(isSolo
      ? [
          {
            kind: 'link' as const,
            key: 'account-delete',
            label: '계정 삭제',
            icon: Trash2,
            href: '/account/delete',
            variant: 'destructive' as const,
          },
        ]
      : []),
  ]

  /**
   * 첫 파괴적 항목 앞에만 구분선을 둔다.
   *
   * 구분선의 역할은 "되돌릴 수 없는 항목을 위의 평범한 항목들과 갈라 두는 것" 하나다.
   * 카드 ⋮ 메뉴가 "구분선은 삭제 앞 하나만"으로 정한 것과 같은 규칙이다(§ 디자인 5-A).
   * 그래서 파괴적 항목이 없는 조합(PAIRED — 파트너 · 로그아웃)에는 선이 없고, 파괴적
   * 항목이 첫 항목이면 위에 가를 것이 없으므로 역시 그리지 않는다.
   */
  const firstDestructiveIndex = items.findIndex((item) => item.variant === 'destructive')

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
          // 되돌릴 수 없는 항목만 위의 평범한 항목들과 갈라 둔다(첫 파괴적 항목 앞 한 번).
          const separator = index === firstDestructiveIndex && index > 0

          if (item.kind === 'link') {
            return (
              <Fragment key={item.key}>
                {separator && <DropdownMenuSeparator />}
                <DropdownMenuLinkItem
                  variant={item.variant}
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  {item.label}
                </DropdownMenuLinkItem>
              </Fragment>
            )
          }

          const pending = !!item.pending

          return (
            <Fragment key={item.key}>
              {separator && <DropdownMenuSeparator />}
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
