'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import styles from '@/components/screens.module.css'

export function LogoutButton() {
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
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={styles.iconBtn}
      aria-label="로그아웃"
      title="로그아웃"
    >
      <LogOut className="h-[18px] w-[18px]" />
    </button>
  )
}
