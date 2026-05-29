import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  message: string
  hint?: string
  addHref: string
  addLabel: string
}

export function EmptyState({ message, hint, addHref, addLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-white/50 px-6 py-16 text-center">
      <Heart className="mb-3 h-10 w-10 text-violet-300 fill-violet-100" />
      <p className="font-medium text-violet-800">{message}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      <Link href={addHref} className="mt-5">
        <Button className="bg-violet-600 hover:bg-violet-700 text-white">{addLabel}</Button>
      </Link>
    </div>
  )
}
