'use client'

import { RevertConfirmDialog } from './RevertConfirmDialog'

interface PlannedAtClearDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading?: boolean
  onConfirm: () => void
}

/**
 * 방문예정일 지우기 확인 — 상세 "방문 예정" 블록 휴지통과 카드 ⋮ 메뉴가 공용(문구 단일 출처).
 * "삭제"는 항목 자체를 영구 삭제하는 빨간 버튼 전용이라 쓰지 않고 "지우기" 계열로 통일한다.
 * "가보고 싶은 곳으로" 되돌리기 다이얼로그(기본 문구 "되돌리기")와는 별개 — 그쪽은 건드리지 않는다.
 */
export function PlannedAtClearDialog(props: PlannedAtClearDialogProps) {
  return (
    <RevertConfirmDialog
      {...props}
      title="방문예정일을 지울까요?"
      description="입력한 방문예정일이 지워집니다."
      confirmLabel="지우기"
    />
  )
}
