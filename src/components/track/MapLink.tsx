'use client'

import { MapPin, ChevronDown } from 'lucide-react'
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
 * 위치(location)를 지도 앱으로 여는 컨트롤.
 * - 왼쪽 링크(MapPin + 위치 텍스트): 기억된 기본 앱으로 새 탭 열기
 * - 오른쪽 ▾ 버튼: 앱 선택 시트 → 선택 시 그 앱으로 열고 기본값으로 저장
 * 열기는 모두 <a target="_blank" rel="noopener noreferrer"> 패턴 재활용.
 */
export function MapLink({ query }: { query: string }) {
  const { app: defaultApp, setApp } = useMapAppPreference()

  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <a
        href={defaultApp.build(query)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${query} 지도에서 열기`}
        className={cn(
          'inline-flex min-w-0 items-center gap-1.5 hover:underline',
          styles.textLink,
        )}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate">{query}</span>
      </a>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className={styles.editGhostBtn} aria-label="지도 앱 선택" />
          }
        >
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
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
  )
}
