import { redirect } from 'next/navigation'
import { verifyToken, markTokenUsed } from '@/lib/auth/tokens'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function SetupVerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    redirect('/setup')
  }

  const tokenRow = await verifyToken(token, 'verify_email')

  if (!tokenRow) {
    redirect('/setup?error=invalid-token')
  }

  const supabase = getSupabaseClient()
  await supabase
    .from('app_config')
    .update({ email_verified: true })
    .eq('id', 1)

  await markTokenUsed(tokenRow.id)

  redirect('/setup?verified=true')
}
