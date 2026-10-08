'use client'

import { useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { DetailRow } from '@/components/track/DetailRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
}: {
  email: string
  initialNickname: string | null
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
          <div className="flex items-center gap-1.5">
            <span className={styles.bodyText}>
              {nickname ?? <span className={styles.faint}>설정 안 함</span>}
            </span>
            <button
              type="button"
              className={styles.editGhostBtn}
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
    </section>
  )
}
