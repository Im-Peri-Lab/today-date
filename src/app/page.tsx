import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { Heart, Zap, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'

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
          <CardTitle className="text-2xl text-violet-800">우리의 데이트 플래너 💜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-500 text-sm">함께 하고 싶은 활동과 가고 싶은 장소를 추가해 보세요</p>

          <Link href="/activities/new" className="block">
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Zap className="w-4 h-4" />
              활동 추가하기
            </Button>
          </Link>

          <Link href="/places/new" className="block">
            <Button
              variant="outline"
              className="w-full border-violet-300 text-violet-700 hover:bg-violet-50 gap-2"
            >
              <MapPin className="w-4 h-4" />
              장소 추가하기
            </Button>
          </Link>

          <div className="pt-1">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
