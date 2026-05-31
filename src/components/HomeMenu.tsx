'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import styles from '@/components/screens.module.css'

/** 홈/목록 우상단 미니멀 메뉴 — 햄버거 → 로그아웃 */
export function HomeMenu() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) {
        toast.error('로그아웃 중 오류가 발생했습니다.')
        return
      }
      router.push('/lock')
      router.refresh()
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className={styles.iconBtn} aria-label="메뉴" />}
      >
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          variant="destructive"
          disabled={isLoading}
          onClick={handleLogout}
        >
          <LogOut />
          {isLoading ? '로그아웃 중...' : '로그아웃'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
