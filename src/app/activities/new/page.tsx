import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityForm } from '@/components/track/ActivityForm'

export default async function NewActivityPage() {
  const session = await getSession()
  if (!session.authenticated) redirect('/lock')

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 p-4">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <Card className="shadow-xl border-violet-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-violet-500" />
              <CardTitle className="text-xl text-violet-800">활동 추가</CardTitle>
            </div>
            <p className="text-sm text-gray-500">함께 하고 싶은 활동을 위시리스트에 추가해요</p>
          </CardHeader>
          <CardContent>
            <ActivityForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
