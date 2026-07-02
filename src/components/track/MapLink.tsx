'use client'

import { MapPin, Map, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useMapAppPreference } from '@/hooks/useMapAppPreference'
import { MAP_APPS } from '@/lib/map'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 위치(location)를 지도 앱으로 여는 컨트롤. 한 라인을 좌우로 분리:
 * - 왼쪽: MapPin + 위치 텍스트 (순수 텍스트, 클릭 동작 없음). 긴 값은 truncate.
 * - 오른쪽 끝(우측 정렬):
 *   · 지도 열기 아이콘 버튼 → 기억된 기본 앱으로 새 탭 열기
 *   · ▾ 버튼 → 앱 선택 시트 → 선택 시 그 앱으로 열고 기본값으로 저장
 * 열기는 모두 <a target="_blank" rel="noopener noreferrer"> 패턴 재활용.
 * 열기 아이콘은 유틸리티 아이콘이라 editGhostBtn 의 중성 hover 를 따른다.
 */
export function MapLink({ query }: { query: string }) {
  const { app: defaultApp, setApp } = useMapAppPreference()

  return (
    <div className="flex w-full items-center gap-2">
      {/* 왼쪽: 위치 텍스트 (비링크). flex-1 + min-w-0 로 truncate 보장 */}
      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
        <MapPin className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
        <span className="min-w-0 truncate">{query}</span>
      </span>

      {/* 오른쪽: 액션 2개 (지도 열기 / 앱 선택) — 한 세트로 인접 배치.
          editGhostBtn(36px 탭타깃)을 유지하되 박스를 거의 맞붙여(gap 2px, 비겹침)
          하나의 액션 세트로 읽히게 한다. 겹치지 않으므로 탭 오작동 없음. */}
      <span className="flex shrink-0 items-center gap-0.5">
        <a
          href={defaultApp.build(query)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="지도에서 열기"
          className={styles.editGhostBtn}
        >
          <Map className="h-4 w-4" />
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className={styles.editGhostBtn} aria-label="지도 앱 선택" />
            }
          >
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MAP_APPS.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => setApp(app.id)}
                render={
                  <a
                    href={app.build(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${app.label}에서 열기`}
                  />
                }
              >
                {app.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  )
}
