'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

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
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
    >
      <LogOut className="w-4 h-4 mr-2" />
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </Button>
  )
}
