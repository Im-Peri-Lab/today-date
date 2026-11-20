'use client'

import { useEffect, useState } from 'react'
import { todayKstIso } from '@/lib/date'

/**
 * KST 기준 오늘('YYYY-MM-DD'). 위시리스트 정렬(`sortWishlistRows`)과 같은 `todayKstIso` 를 써서
 * 정렬 그룹(다가오는/지난 예정)과 카드 D-day 의 경계가 같은 날짜를 본다.
 * SSR·첫 렌더는 null → 마운트 후 채운다(서버·브라우저 날짜 차이로 hydration mismatch 가 나지 않게).
 */
export function useTodayKst(): string | null {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    setToday(todayKstIso())
  }, [])
  return today
}
