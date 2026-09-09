'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTopLoader } from 'nextjs-toploader'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/forms/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 삭제를 실행하기 위해 정확히 입력해야 하는 문구.
 *
 * 되돌릴 수 없는 삭제라 "확인 문구 입력"과 "재확인 다이얼로그"를 둘 다 둔다 —
 * 문구 입력은 잘못된 화면에서 습관적으로 버튼을 누르는 것을 막고, 다이얼로그는
 * 문구를 채운 뒤의 마지막 정지 지점이다. 삭제 확인 다이얼로그가 항목 하나에 대해
 * 재확인 하나만 두는 것(§ DeleteConfirmDialog)과 다른 이유는 파괴 범위가 다르기
 * 때문이다: 항목 하나가 아니라 계정과 모든 기록이 사라진다.
 */
const CONFIRM_PHRASE = '계정 삭제'

/**
 * 계정 삭제 실행 폼(/account/delete).
 *
 * SOLO 판정과 진입 차단은 서버(화면 + API)가 각각 독립적으로 하고, 이 컴포넌트는
 * "정말 지울 것인가"만 묻는다 — 클라이언트가 상태를 판정해 버튼을 감추는 방식은
 * 보안 경계가 될 수 없다(§ app/partner/page.tsx 와 같은 판단).
 */
export function AccountDeleteForm() {
  const router = useRouter()
  const topLoader = useTopLoader()
  const queryClient = useQueryClient()

  const [phrase, setPhrase] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  /** 삭제 성공 후 화면 전환이 끝날 때까지 컨트롤을 잠근 상태(§ 디자인 12 navigating). */
  const [navigating, setNavigating] = useState(false)

  const phraseMatches = phrase.trim() === CONFIRM_PHRASE
  const busy = deleting || navigating

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        // "이미 파트너와 연결됨"(409)처럼 클라이언트가 알 수 없는 사실은 서버 문구를
        // 그대로 보여준다(§ PartnerInviteForm 과 같은 판단).
        toast.error(json.error ?? '계정을 삭제하지 못했어요.')
        setConfirmOpen(false)
        return
      }

      /*
       * 지워진 계정의 데이터가 클라이언트 캐시에 남지 않게 비운다.
       * 남겨두면 뒤로 가기로 돌아왔을 때 존재하지 않는 커플의 위시리스트·파트너
       * 응답이 화면에 그려진다(react-query 는 서버가 사라진 것을 스스로 알지 못한다).
       */
      queryClient.clear()

      toast.success('계정을 삭제했어요')

      // 세션과 app-ready 쿠키가 지워졌으므로 미들웨어는 이제 "설정 미완료"로 판정한다
      // → /setup 이 재가입 시작점이다(§ api/account/route.ts 의 app-ready 삭제 근거).
      setNavigating(true)
      topLoader.start()
      // 캐시가 warm 하면 push 가 동기 커밋돼 막대가 페인트 전에 끝난다 — 한 프레임 늦춘다
      // (§ 디자인 12 프로그래매틱 이동).
      requestAnimationFrame(() => router.push('/setup'))
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
      setConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <FormField
        label={`확인 문구 "${CONFIRM_PHRASE}" 입력`}
        htmlFor="account-delete-confirm"
        required
      >
        <Input
          id="account-delete-confirm"
          type="text"
          autoComplete="off"
          placeholder={CONFIRM_PHRASE}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          disabled={busy}
        />
      </FormField>

      <p className={cn('mt-2 text-xs leading-relaxed', styles.sub)}>
        위 문구를 정확히 입력하면 삭제 버튼이 활성화돼요.
      </p>

      {/*
        화면의 유일한 핵심 액션이므로 Tier A(40px · 풀폭) — destructive 색과 Tier 는
        서로 독립적이다(§ 디자인 4-A).
      */}
      <Button
        type="button"
        variant="destructive"
        className="mt-5 h-10 w-full gap-1.5"
        disabled={!phraseMatches || busy}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        계정 삭제
      </Button>

      {/* 결정 다이얼로그 → 닫기 수단은 하단 "취소" 하나만(§ 디자인 11). */}
      <Dialog
        open={confirmOpen || navigating}
        onOpenChange={(open) => {
          if (busy) return
          setConfirmOpen(open)
        }}
      >
        <DialogContent className="max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>계정을 삭제할까요?</DialogTitle>
            <DialogDescription>
              계정과 지금까지 쌓은 모든 기록이 삭제되고, 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" className="h-9" disabled={busy} />}
            >
              취소
            </DialogClose>
            <Button
              variant="destructive"
              className="h-9"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
