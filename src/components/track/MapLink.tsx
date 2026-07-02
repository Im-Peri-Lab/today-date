'use client'

import { MapPin, Map, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useMapAppPreference } from '@/hooks/useMapAppPreference'
import { useIsMobile } from '@/hooks/useIsMobile'
import { MAP_APPS } from '@/lib/map'
import { cn } from '@/lib/utils'
import styles from '@/components/screens.module.css'

/**
 * 링크 성격에 맞는 anchor 속성.
 * - 웹 URL(http/https): 새 탭(target="_blank" + noopener) — 기존 패턴 재활용.
 * - 앱 스킴(tmap:// 등)은 anchor 로 열지 않고 openAppScheme 로 처리한다.
 */
function anchorProps(url: string): { target?: '_blank'; rel?: string } {
  return /^https?:/i.test(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/**
 * 앱 스킴(tmap://)을 실행하고, 앱이 열리지 않으면(=미설치 추정) 안내를 띄운다.
 * 앱이 열리면 페이지가 백그라운드로 가며 pagehide/blur 가 발생 → 안내를 띄우지 않는다.
 * (열림을 감지하면 오탐 없이 넘어가고, 아무 이벤트도 없을 때만 미설치로 간주)
 */
function openAppScheme(url: string, label: string) {
  let opened = false
  const mark = () => {
    opened = true
  }
  window.addEventListener('pagehide', mark, { once: true })
  window.addEventListener('blur', mark, { once: true })

  window.location.href = url

  window.setTimeout(() => {
    window.removeEventListener('pagehide', mark)
    window.removeEventListener('blur', mark)
    if (!opened && document.visibilityState === 'visible') {
      toast.info(`${label} 앱을 설치해 주세요.`)
    }
  }, 2000)
}

/**
 * 위치(location)를 지도 앱으로 여는 컨트롤. 한 라인을 좌우로 분리:
 * - 왼쪽: MapPin + 위치 텍스트 (순수 텍스트, 클릭 동작 없음). 긴 값은 truncate.
 * - 오른쪽 끝(우측 정렬):
 *   · 지도 열기 아이콘 버튼 → 기억된 기본 앱으로 열기
 *   · ▾ 버튼 → 앱 선택 시트 → 선택 시 그 앱으로 열고 기본값으로 저장
 * 앱 스킴 전용(티맵)은 데스크탑에서 숨기고, 웹 지도는 새 탭으로 연다.
 * 열기 아이콘은 유틸리티 아이콘이라 중성 hover(mapActionBtn)를 따른다.
 */
export function MapLink({ query }: { query: string }) {
  const { app: defaultApp, setApp } = useMapAppPreference()
  const isMobile = useIsMobile()

  // 데스크탑에서는 앱 스킴 전용 앱(티맵)을 목록에서 제외.
  const visibleApps = MAP_APPS.filter((app) => isMobile || !app.requiresApp)

  // 기억된 기본 앱이 현재 환경에서 숨겨진(=쓸 수 없는) 앱이면 첫 노출 앱으로 대체.
  const effectiveDefault =
    visibleApps.find((app) => app.id === defaultApp.id) ?? visibleApps[0]
  const defaultUrl = effectiveDefault.build(query)

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
        {/* 기본 앱 열기 — 웹은 anchor(새 탭), 앱 스킴은 button(openAppScheme) */}
        {effectiveDefault.requiresApp ? (
          <button
            type="button"
            className={styles.mapActionBtn}
            aria-label="지도에서 열기"
            onClick={() => openAppScheme(defaultUrl, effectiveDefault.label)}
          >
            <Map className="h-4 w-4" />
          </button>
        ) : (
          <a
            href={defaultUrl}
            {...anchorProps(defaultUrl)}
            aria-label="지도에서 열기"
            className={styles.mapActionBtn}
          >
            <Map className="h-4 w-4" />
          </a>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className={styles.mapActionBtn} aria-label="지도 앱 선택" />
            }
          >
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {visibleApps.map((app) => {
              const url = app.build(query)
              // 앱 스킴 앱은 button(openAppScheme), 웹 앱은 anchor(새 탭)로 연다.
              return app.requiresApp ? (
                <DropdownMenuItem
                  key={app.id}
                  aria-label={`${app.label}에서 열기`}
                  onClick={() => {
                    setApp(app.id)
                    openAppScheme(url, app.label)
                  }}
                >
                  {app.label}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={app.id}
                  onClick={() => setApp(app.id)}
                  render={
                    <a
                      href={url}
                      {...anchorProps(url)}
                      aria-label={`${app.label}에서 열기`}
                    />
                  }
                >
                  {app.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  )
}
