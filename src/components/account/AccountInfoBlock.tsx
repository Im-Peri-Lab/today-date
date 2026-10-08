'use client'

import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DetailRow } from '@/components/track/DetailRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatKoreanTimestamp } from '@/lib/date'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const NICKNAME_MAX_LENGTH = 20

/**
 * 내 정보 카드(/account) — 닉네임(편집 가능, 표시용)과 이메일(읽기 전용, 인증 식별자)을
 * 한 카드에 담는다. /partner/info 와 같은 헤더 없는 카드 형태를 공유하되(§ 디자인 통일),
 * 편집 가능한 필드가 닉네임 하나뿐이라 카드 전체가 아니라 닉네임 행만 편집 상태를
 * 갖는다 — DetailBlock(블록 전체 편집)은 이 용도에 맞지 않아 쓰지 않는다.
 */
export function AccountInfoBlock({
  email,
  initialNickname,
  joinedAt,
}: {
  email: string
  initialNickname: string | null
  /** users.created_at (ISO timestamptz). /partner/info·/account/delete 와 동일하게 "가입일"로 표시한다. */
  joinedAt: string
}) {
  const [nickname, setNickname] = useState(initialNickname)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialNickname ?? '')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setValue(nickname ?? '')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function saveNickname() {
    setSaving(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(json.error ?? '닉네임을 저장하지 못했어요.')
        return
      }

      setNickname(json.data.nickname)
      setEditing(false)
      toast.success('수정되었습니다!')
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={cn(styles.card, styles.detailCard, 'px-5 py-4 lg:px-6 lg:py-5')}
    >
      {/*
        각 행(sheetRow)은 자체 padding-top(0.875rem)을 갖는데, 이 카드는 헤더가
        없어 그 패딩이 카드의 py-4 와 겹쳐 첫 행 위쪽만 유독 넓어 보인다
        (§ /partner/info 도 동일). 첫 자식의 padding-top 만 0으로 되돌려 위·아래
        여백을 카드의 py 값 하나로 맞춘다.
      */}
      <div className="[&>*:first-child]:!pt-0">
        <div className={styles.sheetRow}>
          <p className={cn('mb-1.5 uppercase tracking-wide', styles.fieldLabel)}>닉네임</p>
          {editing ? (
            <div>
              <Input
                id="account-nickname"
                type="text"
                autoComplete="off"
                maxLength={NICKNAME_MAX_LENGTH}
                placeholder="예: 민지"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={saving}
                autoFocus
              />
              <p className={cn('mt-1.5 text-xs', styles.sub)}>
                최대 {NICKNAME_MAX_LENGTH}자. 비워두면 이메일로 표시돼요.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  onClick={saveNickname}
                  disabled={saving}
                  className={cn(styles.detailPrimaryBtn, 'h-9 gap-1.5 px-4 text-white hover:brightness-105')}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? '저장 중...' : '저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="h-9 px-4"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            /*
              버튼을 relative 행 안에서 absolute + 세로 중앙 정렬로 띄운다 — flex
              자식으로 나란히 두면 버튼의 고정 높이(28px)가 텍스트 한 줄(~20px)보다
              커서 행 자체가 그만큼 늘어나 다음 행(이메일)과의 간격이 유독 넓어
              보인다(DetailBlock 모서리 펜슬도 같은 이유로 absolute다 — § 디자인 10-B).
              absolute로 빼면 행 높이는 텍스트 한 줄에만 좌우되고, 버튼도 그 중앙에
              겹쳐 떠 "라인 오른쪽 끝"에 자연스럽게 고정된다.
            */
            <div className="relative pr-9">
              <span className={styles.bodyText}>
                {nickname ?? <span className={styles.faint}>설정 안 함</span>}
              </span>
              {/*
                mapActionBtn(28px/16px 글리프, §7)을 재사용한다 — 원래 "인접 액션
                쌍 전용"이지만 토큰·색은 동일하고, 이 자리는 애초에 absolute라 어느
                크기든 행 높이에 영향이 없다. editGhostBtn(36px)보다 한 단계 작아
                텍스트 한 줄 곁에서 과하지 않다.
              */}
              <button
                type="button"
                className={cn(styles.mapActionBtn, 'absolute right-0 top-1/2 -translate-y-1/2')}
                onClick={startEdit}
                aria-label="닉네임 수정"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <DetailRow label="이메일">
          <span className="break-all">{email}</span>
        </DetailRow>

        <DetailRow label="가입일">{formatKoreanTimestamp(joinedAt)}</DetailRow>
      </div>
    </section>
  )
}
