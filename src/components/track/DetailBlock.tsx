'use client'

import { ReactNode } from 'react'
import { Pencil, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface DetailBlockProps {
  /** 섹션 라벨 (예: "방문 기록") — blockTitle이 있으면 렌더하지 않음 */
  title: string
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
  /**
   * 복사하기 (보기 모드 전용). 제공되면 연필 버튼 바로 왼쪽에 단독 버튼으로 노출.
   * 연필과 같은 absolute 패턴 — 텍스트 행 흐름에 끼우지 않아 행 높이를 늘리지 않는다.
   */
  onCopy?: () => void
  /**
   * 블록 헤더에 표시할 아이템 제목 (보기 모드 전용).
   * 제공되면 섹션 라벨(title)을 숨기고 이 제목을 h1으로 표시한다.
   * 편집 모드에서는 폼 내부의 제목 필드가 대신 표시되므로 헤더 전체 숨김.
   */
  blockTitle?: string
  /** 블록 헤더에 표시할 카테고리 뱃지 (보기 모드 전용) */
  blockCategory?: ReactNode
  /** 카테고리 옆 보조 노드 (예: "다녀온 곳" / "가보고 싶은 곳" 상태 태그) */
  headerExtra?: ReactNode
  children: ReactNode
}

/**
 * 상세 화면의 카드 블록 공용 셸.
 *
 * 섹션 라벨 표시 규칙:
 *  - blockTitle 있음(등록 정보 블록): 라벨 숨김. 카테고리+상태태그+제목이 자체 식별.
 *  - blockTitle 없음(방문 기록 등): 라벨(h2) 표시 → 스크린리더 섹션 탐색 보장.
 *
 * 헤더 영역 렌더 조건(showHeader):
 *  - !blockTitle: 섹션 라벨을 항상 보여야 하므로 헤더 표시.
 *  - hasHeaderContent: 카테고리/제목/상태 태그가 있을 때 헤더 표시.
 *  - editing+blockTitle: hasHeaderContent=false, !blockTitle=false → 헤더 숨김.
 *    (폼이 카드 최상단에서 바로 시작 → 불필요한 여백 없음)
 */
export function DetailBlock({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  onCopy,
  blockTitle,
  blockCategory,
  headerExtra,
  children,
}: DetailBlockProps) {
  const hasHeaderContent = !editing && (blockCategory || blockTitle || headerExtra)
  const showHeader = !blockTitle || !!hasHeaderContent

  return (
    <section
      className={cn(
        styles.card,
        styles.detailCard,
        'relative',
        'px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-5',
      )}
    >
      {/* 연필 버튼 — absolute, 박스 오른쪽 끝을 카드 콘텐츠 패딩(px-5 / lg:px-6)에 맞춰 MapLink와 한 열 */}
      {!editing && (
        <button
          type="button"
          className={cn(styles.mapActionBtn, 'absolute top-[1.125rem] right-5 lg:right-6')}
          onClick={onEdit}
          aria-label={`${title} 수정`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {/* 복사하기 — 연필 바로 왼쪽: 연필 right(카드 패딩 20/24px) + 28px = 48/52px */}
      {!editing && onCopy && (
        <button
          type="button"
          className={cn(styles.mapActionBtn, 'absolute top-[1.125rem] right-12 lg:right-[3.25rem]')}
          onClick={onCopy}
          aria-label="복사하기"
        >
          <Copy className="h-4 w-4" />
        </button>
      )}

      {/* 블록 헤더 — showHeader 일 때만 렌더 */}
      {showHeader && (
        <div className={cn(!editing && (onCopy ? 'pr-16' : 'pr-10'))}>
          {/* 섹션 라벨: blockTitle이 없는 블록(방문 기록 등)에서만 표시 */}
          {!blockTitle && (
            <h2 className={cn('text-sm font-medium', styles.ink)}>
              {title}
            </h2>
          )}

          {/* 카테고리 뱃지 + 상태 태그 + 아이템 제목 (보기 모드 전용) */}
          {hasHeaderContent && (
            <div>
              {(blockCategory || headerExtra) && (
                <div className="flex flex-wrap items-center gap-2">
                  {blockCategory}
                  {headerExtra}
                </div>
              )}
              {blockTitle && (
                <h1 className={cn('mt-3', styles.pageTitle)}>{blockTitle}</h1>
              )}
            </div>
          )}
        </div>
      )}

      {/* children — showHeader가 있을 때 mt-3으로 헤더와 분리.
          editing 시 space-y-5: 추가 화면 FormLayout(space-y-5)과 동일한 필드 간 리듬을
          인라인 편집에도 부여(읽기 모드는 영향 없음). */}
      <div className={cn(showHeader && (editing ? 'mt-5' : 'mt-3'), editing && 'space-y-5')}>
        {children}
      </div>

      {/* 인라인 편집 액션 — 우측 정렬, DOM 순서 = 시각 순서(취소 → 저장, Primary 우측 끝).
          로딩은 앱 공통 규칙(§12-A)대로 "저장 중..." + 스피너 프리펜드이고, 두 버튼 모두
          transition-colors 로 제한해 저장 중 전환 때 opacity/레이아웃 애니메이션이 겹쳐
          생기던 취소 버튼 잔상을 없앤다(§12-A). */}
      {editing && (
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="h-9 px-4 transition-colors"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              styles.detailPrimaryBtn,
              'h-9 gap-1.5 px-4 text-white transition-colors hover:brightness-105',
            )}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      )}
    </section>
  )
}
