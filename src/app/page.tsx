import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { Heart, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const session = await getSession()

  if (!session.authenticated) {
    redirect('/lock')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl border-violet-100 text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <Heart className="w-12 h-12 text-violet-500 fill-violet-200" />
          </div>
          <CardTitle className="text-2xl text-violet-800">환영합니다! 💜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">인증이 완료되었습니다.</p>
          <p className="text-sm text-gray-400">다음 단계에서 데이트 대시보드가 여기에 표시됩니다.</p>
          <form action="/api/auth/logout" method="POST">
            <Button
              type="submit"
              variant="outline"
              className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
