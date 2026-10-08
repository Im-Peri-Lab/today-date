'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { DetailBlock } from '@/components/track/DetailBlock'
import { DetailRow } from '@/components/track/DetailRow'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

const NICKNAME_MAX_LENGTH = 20

/**
 * 계정 정보 블록(/account) — 이메일(읽기 전용, 인증 식별자)과 닉네임(편집 가능, 표시용)을
 * 한 카드에 담는다. 이메일을 이 블록에서 함께 보여주는 이유: 닉네임이 뭘 바꾸는
 * 값인지("이메일 대신 화면에 보일 이름") 바로 옆에서 확인할 수 있어야 한다.
 *
 * DetailBlock 의 기존 편집/저장/취소 셸을 그대로 재사용한다(§ ActivityDetail 등과
 * 같은 패턴) — 이 화면만을 위한 새 편집 UI를 만들지 않는다.
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
    <DetailBlock
      title="계정 정보"
      editing={editing}
      onEdit={startEdit}
      onCancel={cancelEdit}
      onSave={saveNickname}
      saving={saving}
    >
      {editing ? (
        <div>
          <FormField label="닉네임" htmlFor="account-nickname">
            <Input
              id="account-nickname"
              type="text"
              autoComplete="off"
              maxLength={NICKNAME_MAX_LENGTH}
              placeholder="예: 민지"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={saving}
            />
          </FormField>
          <p className={cn('mt-1.5 text-xs', styles.sub)}>
            최대 {NICKNAME_MAX_LENGTH}자. 비워두면 이메일로 표시돼요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* 이메일은 길어서 줄바꿈이 필요하므로 wide(2열 점유) — § 디자인 10-C */}
          <DetailRow label="이메일" wide>
            <span className="break-all">{email}</span>
          </DetailRow>
          <DetailRow label="닉네임">
            {nickname ?? <span className={styles.faint}>설정 안 함</span>}
          </DetailRow>
        </div>
      )}
    </DetailBlock>
  )
}
