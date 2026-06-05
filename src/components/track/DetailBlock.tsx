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
  /** 블록 헤더에 표시할 카테고리 뱃지 (보기 모드 전용) */
  blockCategory?: ReactNode
  /**
   * 카테고리 옆 보조 노드 (예: "다녀온 곳" 상태 태그) — 선택.
   */
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * 상세 화면의 카드 블록 공용 셸.
 * - detailCard(radius 1.5rem) + card surface 토큰으로 부드러운 블록 표현.
 * - 연필 버튼: 카드 relative + absolute top/right 로 모서리에 밀착.
 *   editGhostBtn 이 --s-* 토큰만 참조하므로 라이트/다크 모두 카드면과 조화됨.
 * - blockTitle/blockCategory: 보기 모드에서 카드 헤더 안에 카테고리+제목 표시.
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
  // blockTitle(h1) 아래에 올 때 h2→h1 역순을 피하기 위해 <p>로 강등.
  // blockTitle 없는 블록(방문 기록 등)은 <h2>를 유지해 스크린리더 섹션 탐색 보장.
  const SectionLabel = blockTitle ? 'p' : 'h2'

  return (
    /* detailCard: .card보다 한 단계 더 둥근 1.5rem. relative: 연필 버튼 절대위치 기준 */
    <section
      className={cn(
        styles.card,
        styles.detailCard,
        'relative',
        'px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
      )}
    >
      {/* 고스트 연필 버튼 — absolute로 카드 우상단 모서리에 밀착 */}
      {!editing && (
        <button
          type="button"
          className={cn(styles.editGhostBtn, 'absolute top-3.5 right-3.5')}
          onClick={onEdit}
          aria-label={`${title} 수정`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {/* ── 블록 헤더 — 편집 중엔 pr 불필요(버튼 없음), 보기 모드엔 버튼 영역 확보 */}
      <div className={cn(!editing && 'pr-10')}>
        <SectionLabel
          className={cn('text-xs font-medium uppercase tracking-wide', styles.sub)}
        >
          {title}
        </SectionLabel>

        {/* 카테고리 뱃지 + 상태 태그 + 아이템 제목 (보기 모드 전용) */}
        {hasHeaderContent && (
          <div className="mt-2">
            {(blockCategory || headerExtra) && (
              <div className="flex flex-wrap items-center gap-2">
                {blockCategory}
                {headerExtra}
              </div>
            )}
            {/* 칩↔제목 간격: mt-3(12px) — 이전 mt-1.5(6px)에서 넓혀 숨 쉬게 */}
            {blockTitle && (
              <h1 className={cn('mt-3', styles.pageTitle)}>{blockTitle}</h1>
            )}
          </div>
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
