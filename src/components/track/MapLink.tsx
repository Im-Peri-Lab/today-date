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
 * 링크 성격에 맞는 anchor 속성.
 * - 웹 URL(http/https): 새 탭(target="_blank" + noopener) — 기존 패턴 재활용.
 * - 앱 스킴(tmap:// 등): 같은 탭. OS가 스킴을 가로채 앱을 실행하므로 페이지는
 *   그대로 남고, target="_blank" 로 인한 빈 탭이 생기지 않는다.
 */
function anchorProps(url: string): { target?: '_blank'; rel?: string } {
  return /^https?:/i.test(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/**
 * 위치(location)를 지도 앱으로 여는 컨트롤. 한 라인을 좌우로 분리:
 * - 왼쪽: MapPin + 위치 텍스트 (순수 텍스트, 클릭 동작 없음). 긴 값은 truncate.
 * - 오른쪽 끝(우측 정렬):
 *   · 지도 열기 아이콘 버튼 → 기억된 기본 앱으로 열기
 *   · ▾ 버튼 → 앱 선택 시트 → 선택 시 그 앱으로 열고 기본값으로 저장
 * 웹 지도는 새 탭, 앱 스킴(티맵)은 같은 탭으로 연다(anchorProps).
 * 열기 아이콘은 유틸리티 아이콘이라 중성 hover(mapActionBtn)를 따른다.
 */
export function MapLink({ query }: { query: string }) {
  const { app: defaultApp, setApp } = useMapAppPreference()
  const defaultUrl = defaultApp.build(query)

  return (
    <div className="flex w-full items-center gap-2">
      {/* 왼쪽: 위치 텍스트 (비링크). flex-1 + min-w-0 로 truncate 보장 */}
      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
        <MapPin className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
        <span className="min-w-0 truncate">{query}</span>
      </span>

      {/* 오른쪽: 액션 2개 (지도 열기 / 앱 선택) — 한 세트로 인접 배치.
          mapActionBtn(28px)로 박스를 줄여 글리프 여백·우측 끝 여백을 좁힌다.
          gap 2px, 비겹침 → 탭 오작동 없음. */}
      <span className="flex shrink-0 items-center gap-0.5">
        <a
          href={defaultUrl}
          {...anchorProps(defaultUrl)}
          aria-label="지도에서 열기"
          className={styles.mapActionBtn}
        >
          <Map className="h-4 w-4" />
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className={styles.mapActionBtn} aria-label="지도 앱 선택" />
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
                    {...anchorProps(app.build(query))}
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
