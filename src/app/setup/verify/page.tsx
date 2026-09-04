import { redirect } from 'next/navigation'
import { verifyToken, markTokenUsed } from '@/lib/auth/tokens'
import { markUserEmailVerified } from '@/lib/auth/couple'

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

  const verified = await markUserEmailVerified(tokenRow.target_email)

  if (!verified) {
    redirect('/setup?error=invalid-token')
  }

  await markTokenUsed(tokenRow.id)

  redirect('/setup?verified=true')
}
