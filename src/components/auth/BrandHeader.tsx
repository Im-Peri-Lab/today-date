import type { ReactNode } from 'react'
import styles from './auth.module.css'

interface BrandHeaderProps {
  /** "Today Date" 아래 한 줄 서브카피 */
  subtitle?: ReactNode
  /** 인증 확인 중 등 하트를 pulse 시킬 때 */
  pulse?: boolean
}

/** 보라→핑크 그라데이션 하트 + "Today Date" + 서브카피. 모든 인증 화면 공통. */
export function BrandHeader({ subtitle, pulse = false }: BrandHeaderProps) {
  return (
    <header className={styles.header}>
      <svg
        className={`${styles.heart} ${pulse ? styles.heartPulse : ''}`}
        viewBox="0 0 24 24"
        role="img"
        aria-label="Today Date"
      >
        <defs>
          <linearGradient id="brandHeartGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--heart-from, #a855f7)" />
            <stop offset="100%" stopColor="var(--heart-to, #ec4899)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#brandHeartGradient)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <h1 className={styles.title}>Today Date</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  )
}
