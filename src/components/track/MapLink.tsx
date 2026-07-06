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
import { useIsIosSafari } from '@/hooks/useIsIosSafari'
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
 * `requiresApp`(앱 스킴 전용) 지도앱 공통 미설치 안내 문구.
 * 티맵 하드코딩이 아니라 requiresApp 앱 전체가 이 패턴을 쓴다(향후 추가 앱도 동일).
 */
function installPrompt(label: string) {
  return `${label} 앱을 설치해 주세요.`
}

/**
 * 앱 스킴(tmap://)을 실행하고, 앱이 열리지 않으면(=미설치 추정) 안내를 띄운다.
 * 앱이 열리면 페이지가 백그라운드로 가며 pagehide/blur 가 발생 → 안내를 띄우지 않는다.
 * (열림을 감지하면 오탐 없이 넘어가고, 아무 이벤트도 없을 때만 미설치로 간주)
 *
 * 브라우저별 한계(감지는 best-effort):
 * - Chrome iOS·Android: 미설치 스킴이 조용히 실패 → 이 timeout 토스트가 정상 동작.
 * - iOS Safari: 미설치 시 브라우저가 네이티브 오류 모달을 먼저 띄우고, 그 모달이 blur를
 *   유발해 이 토스트가 억제된다. 그래서 iOS Safari는 아래 openRequiresApp에서 이동 전에
 *   안내를 먼저 보여준다(warn-first).
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
      toast.info(installPrompt(label))
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
  const isIosSafari = useIsIosSafari()

  // 데스크탑에서는 앱 스킴 전용 앱(티맵)을 목록에서 제외.
  const visibleApps = MAP_APPS.filter((app) => isMobile || !app.requiresApp)

  /**
   * 앱 스킴 전용(requiresApp) 앱 열기.
   * - iOS Safari: 미설치 시 브라우저가 네이티브 오류를 먼저 띄워 사용자가 당황하므로,
   *   이동 전에 "설치돼 있어야 열려요" 안내를 먼저 보여주고 [열기] 눌렀을 때 스킴 이동.
   * - 그 외(Chrome iOS·Android): 기존 동작 유지(바로 이동 + 미설치 timeout 토스트).
   */
  const openRequiresApp = (url: string, label: string) => {
    if (isIosSafari) {
      toast.info(installPrompt(label), {
        action: { label: '열기', onClick: () => openAppScheme(url, label) },
        duration: 6000,
      })
      return
    }
    openAppScheme(url, label)
  }

  // 기억된 기본 앱이 현재 환경에서 숨겨진(=쓸 수 없는) 앱이면 첫 노출 앱으로 대체.
  const effectiveDefault =
    visibleApps.find((app) => app.id === defaultApp.id) ?? visibleApps[0]
  const defaultUrl = effectiveDefault.build(query)

  return (
    // items-start: 왼쪽 텍스트를 상단 정렬해 라벨↔내용 여백을 다른 DetailRow(소요시간 등)와
    // 동일하게 맞춘다(28px 버튼이 행을 키우고 center 정렬로 텍스트가 밀리던 문제 해소).
    <div className="flex w-full items-start gap-2">
      {/* 왼쪽: 위치 텍스트 (비링크). flex-1 + min-w-0 로 truncate 보장 */}
      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
        <MapPin className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
        <span className="min-w-0 truncate">{query}</span>
      </span>

      {/* 오른쪽: 액션 2개 (지도 열기 / 앱 선택) — 한 세트로 인접 배치.
          mapActionBtn(28px)로 박스를 줄여 글리프 여백·우측 끝 여백을 좁힌다.
          gap 2px, 비겹침 → 탭 오작동 없음.
          -mt-1: 28px 버튼의 시각 중심을 ~21px 텍스트 줄 중심에 맞춘다(상단 정렬 보정). */}
      <span className="-mt-1 flex shrink-0 items-center gap-0.5">
        {/* 기본 앱 열기 — 웹은 anchor(새 탭), 앱 스킴은 button(openAppScheme) */}
        {effectiveDefault.requiresApp ? (
          <button
            type="button"
            className={styles.mapActionBtn}
            aria-label="지도에서 열기"
            onClick={() => openRequiresApp(defaultUrl, effectiveDefault.label)}
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
                    openRequiresApp(url, app.label)
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
