'use client'

import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

interface VisitPeriodToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 이 스위치가 펼치는 종료일 필드의 id (aria-controls 연결용) */
  controls?: string
}

/**
 * 방문 기간 on/off 스위치 — activities 방문 기록에서 "종료일" 필드 노출을 켜고 끈다.
 *
 * ⚠️ "가보고 싶은 곳/다녀온 곳" 세그먼트 토글(`styles.segment`)과는 **별개 패턴**이다.
 * 세그먼트 = 두 값 중 택1(iOS 흰 면 떠오름), 이 컴포넌트 = 단일 기능 on/off(iOS 스위치).
 * 시각 토큰은 screens.module.css `.periodSwitch*`(§4-B) — 임의 색 없음.
 */
export function VisitPeriodToggle({ checked, onChange, controls }: VisitPeriodToggleProps) {
  return (
    <div className={styles.periodToggle}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="종료일 추가"
        aria-controls={controls}
        onClick={() => onChange(!checked)}
        className={cn(styles.periodSwitch, checked && styles.periodSwitchOn)}
      >
        <span className={styles.periodSwitchKnob} />
      </button>
      <span className={styles.periodToggleLabel}>종료일</span>
    </div>
  )
}
