import { toast } from 'sonner'
import type { ScheduleSaveKind } from './scheduleChange'

/** 수정 토스트 문구 — 캘린더 일정이 따라 바뀌지 않는다는 안내는 결과가 생기는 시점(수정 직후)에 보여준다. */
export const SCHEDULE_CHANGED_MESSAGE = '일정이 바뀌었어요. 이미 추가한 캘린더 일정은 직접 수정해 주세요'

interface ScheduleSavedToastOptions {
  /** classifyScheduleSave 결과 */
  kind: ScheduleSaveKind
  /** 처음 등록·변경 없음일 때의 기존 성공 문구(예: "방문 예정일을 저장했어요") */
  savedMessage: string
  /** 처음 등록 때 "추가" 제안을 붙일지 — 방문 예정은 true, 방문 기록은 기존대로 false */
  offerAddOnCreate: boolean
  /** "추가"·"다시 추가" 를 누르면 실행할 캘린더 추가(저장한 값으로 만든 항목) */
  onAdd: () => void
}

/**
 * 일정 저장 직후 토스트 한 벌(PlannedAtDialog·VisitRecordBlock 공용).
 * - changed  : "일정이 바뀌었어요. 이미 추가한 캘린더 일정은 직접 수정해 주세요" + [다시 추가]
 * - created  : 기존 문구 그대로 — offerAddOnCreate 면 "캘린더에도 추가할까요?" + [추가]
 * - unchanged: 기존 문구만(별점·후기만 수정, 그대로 재저장 등)
 */
export function showScheduleSavedToast({ kind, savedMessage, offerAddOnCreate, onAdd }: ScheduleSavedToastOptions) {
  if (kind === 'changed') {
    toast.success(SCHEDULE_CHANGED_MESSAGE, {
      duration: 8000,
      action: { label: '다시 추가', onClick: onAdd },
    })
    return
  }
  if (kind === 'created' && offerAddOnCreate) {
    // 1회성 제안 — 이 토스트가 사라지면 상세 블록·카드 ⋮ 메뉴가 같은 진입점을 이어 받는다.
    toast.success(savedMessage, {
      description: '캘린더에도 추가할까요?',
      duration: 8000,
      action: { label: '추가', onClick: onAdd },
    })
    return
  }
  toast.success(savedMessage)
}
