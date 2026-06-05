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
  /**
   * 블록 헤더에 표시할 아이템 제목 (보기 모드 전용).
   * 편집 모드에서는 폼 내부의 제목 필드가 대신 표시되므로 숨겨진다.
   */
  blockTitle?: string
  /**
   * 블록 헤더에 표시할 카테고리 뱃지 (보기 모드 전용).
   */
  blockCategory?: ReactNode
  /**
   * 헤더 카테고리 옆에 함께 표시할 보조 노드
   * (예: "다녀온 곳" 상태 태그) — 선택.
   */
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * 상세 화면의 카드 블록 공용 셸.
 * - 스킬 카드 surface 토큰(styles.card)으로 별개 영역임을 보여준다.
 * - blockTitle / blockCategory: 보기 모드에서 카드 헤더 안에 카테고리+제목 표시.
 * - 우상단 고스트 연필 버튼(아이콘 전용) → 블록 전체 인라인 편집 전환.
 *   editGhostBtn 은 --s-* 토큰만 참조하므로 라이트/다크 모두 카드면과 조화됨.
 */
export function DetailBlock({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  blockTitle,
  blockCategory,
  headerExtra,
  children,
}: DetailBlockProps) {
  const hasHeaderContent = !editing && (blockCategory || blockTitle || headerExtra)

  return (
    <section className={cn(styles.card, 'p-5 lg:p-6')}>
      {/* ── 블록 헤더 ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* 섹션 라벨 */}
          <p className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}>{title}</p>

          {/* 카테고리 뱃지 + 상태 태그 + 아이템 제목 (보기 모드 전용) */}
          {hasHeaderContent && (
            <div className="mt-2">
              {(blockCategory || headerExtra) && (
                <div className="flex flex-wrap items-center gap-2">
                  {blockCategory}
                  {headerExtra}
                </div>
              )}
              {blockTitle && (
                <h1 className={cn('mt-1.5', styles.pageTitle)}>{blockTitle}</h1>
              )}
            </div>
          )}
        </div>

        {/* 고스트 연필 버튼 — editGhostBtn 이 --s-* 토큰 직접 참조 → 다크모드 자동 적응 */}
        {!editing && (
          <button
            type="button"
            className={styles.editGhostBtn}
            onClick={onEdit}
            aria-label={`${title} 수정`}
          >
            <Pencil className="h-4 w-4" />
          </button>
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
