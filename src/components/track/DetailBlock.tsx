'use client'

import { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface DetailBlockProps {
  /** 섹션 라벨 (예: "등록 정보", "방문 기록") */
  title: string
  /** 이 블록이 인라인 편집 모드인지 */
  editing: boolean
  /** 연필 클릭 → 편집 시작 */
  onEdit: () => void
  /** 편집 취소 */
  onCancel: () => void
  /** 편집 저장 */
  onSave: () => void
  /** 저장 진행 중 (버튼 비활성/문구) */
  saving: boolean
  /** 헤더 라벨 옆 보조 노드(예: "다녀온 곳" 태그) — 선택 */
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * 상세 화면의 카드 블록 공용 셸.
 * - 스킬 카드 surface 토큰(styles.card: 배경/보더/radius/그림자)으로 별개 영역임을 보여준다.
 * - 우상단 연필 버튼 → 블록 전체가 인라인 편집으로 전환, 하단에 저장/취소.
 * - 등록 정보/방문 기록 두 블록이 이 셸을 공유해 편집 경험이 완전히 동일하다.
 */
export function DetailBlock({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  headerExtra,
  children,
}: DetailBlockProps) {
  return (
    <section className={cn(styles.card, 'p-5 lg:p-6')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>{title}</h2>
          {headerExtra}
        </div>
        {!editing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={onEdit}
            aria-label={`${title} 수정`}
          >
            <Pencil className="h-3.5 w-3.5" />
            수정
          </Button>
        )}
      </div>

      <div className="mt-3">{children}</div>

      {editing && (
        <div className="mt-5 flex gap-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="gap-1.5 text-white hover:brightness-105"
            style={{
              background: 'var(--s-active-fill, linear-gradient(135deg,#a855f7 0%,#ec4899 100%))',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            취소
          </Button>
        </div>
      )}
    </section>
  )
}
