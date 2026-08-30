# CURRENT_STATE.md

> **마지막 업데이트: 2026-08-11**

## 현재 단계
유지보수 / 점진적 UX 개선 단계 + Capacitor 네이티브 앱 다크모드 스플래시/아이콘 작업 마무리 단계.

## 현재 한 줄 요약
자동화 테스트·CI 도입(PR #91) + P2 리팩터 배치(PR #93~95: dark/hover/focus 정합화, 추천위저드
히스토리 공통화, 폼-API 검증 정합화) + `/list` 다녀온 곳 정렬 보정(PR #99) + 네이밍 용어 매핑
SKILL.md 반영(PR #100) + 기술 백로그 그룹 1·3 진단·처리(PR #101·#103) + `.mealBadge` 대비 보정
(PR #105) + 액션 버튼 Tier A/B 통일(PR #106) + 되돌리기 확인 다이얼로그 4곳 통일(PR #108) 모두
병합 완료 (상세 → CHANGELOG 2026-07-29~2026-08-01). 이어서 `chore/capacitor-init` 브랜치에서
Capacitor 8.x iOS/Android 네이티브 앱 셸 초기화(PR #111·#112) → 네이티브 부팅 스플래시 오버레이
도입(PR #113·#114) → 스플래시 콘텐츠 비율 실측 보정 + 다크모드 지원(PR #115) → 다크 CSS가
`chore/capacitor-init`에만 머지되고 프로덕션엔 배포된 적이 없었던 갭을 발견해 별도 cherry-pick
PR #117로 프로덕션 재배포 → iOS AppIcon 다크모드 variant 병합(PR #116)까지 순차 완료. 상세 →
CHANGELOG 2026-08-07~2026-08-11.

## 브랜치 상태
- `chore/capacitor-init` — PR #111~#116 모두 병합 완료(23 커밋 `main` 대비 앞섬). `main`으로의
  최종 머지는 아직 진행 안 함 — 사용자 확인 후 진행 예정
- main 기준 build PASS (PR #117 `main` 반영분 포함)

## 최근 구현 완료
- 자동화 테스트·CI, dark/hover/focus 정합화, 추천위저드 History/URL 동기화 공통 훅, 폼-API
  입력 검증 공유 → 상세 CHANGELOG 2026-07-29. 전체 누적 기능 목록은 PROJECT_CONTEXT §5 참조
- `/list` 다녀온 곳 정렬 보정(PR #99), 네이밍 용어 매핑 SKILL.md 반영(PR #100), 기술 백로그
  그룹 1 진단·종결(PR #101) → 상세 CHANGELOG 2026-07-30
- 기술 백로그 그룹 3 실측 4건 + 카드 그리드 의도된 예외 문서화·spacing 토큰화(PR #103) →
  상세 CHANGELOG 2026-07-30
- `.mealBadge` 텍스트 색 대비 보정(PR #105), 액션 버튼 높이 Tier A(40px)/Tier B(36px) 통일
  (PR #106) → 상세 CHANGELOG 2026-07-31
- 되돌리기 확인 다이얼로그 4곳 통일(PR #108) → 상세 CHANGELOG 2026-08-01
- Capacitor 8.x iOS/Android 네이티브 앱 셸 초기화, 브랜드 하트 아이콘·스플래시 반영, iOS 아이콘
  배경색 수정(`013e3db`~`09f2183`) → 상세 CHANGELOG 2026-08-05
- iOS safe-area 토스트/로더 수정(PR #111), Android 릴리즈 서명 설정(PR #112) →
  상세 CHANGELOG 2026-08-07
- 네이티브 부팅 스플래시 오버레이(`NativeBootOverlay`) 도입, Android SplashScreen 테마 버그 수정,
  하트+타이틀 전용 스플래시 아이콘(PR #113·#114) → 상세 CHANGELOG 2026-08-09
- 스플래시 콘텐츠 폭 실측 재보정(iOS 16.39%/Android 56.4%), 오버레이·네이티브 스플래시 다크모드
  지원(PR #115) → 상세 CHANGELOG 2026-08-09 v2
- 다크 CSS 프로덕션 미배포 갭 발견·cherry-pick 재배포(PR #117), WKWebView 네이티브 배경 수정은
  불필요 판정 → 상세 CHANGELOG 2026-08-10
- iOS AppIcon 다크모드 variant 병합(PR #116) → 상세 CHANGELOG 2026-08-11

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #117 반영 기준)

## 진행 중 / 남은 작업
- **`chore/capacitor-init` → `main` 최종 머지**: PR #111~#116 모두 병합 완료 상태지만, 전체
  Capacitor 네이티브 셸 자체를 `main`(프로덕션 배포 소스)에 반영할지는 아직 사용자 확인 전 —
  머지 시점·방식(ff-only/squash)은 별도로 지시받아 진행할 것
- **오픈 이슈(코드 레벨 미해결)**: 앱 실행 시 SpringBoard 아이콘-줌 전환 중 "하트만 있고 타이틀
  없는" 라이트 톤이 짧게 노출되는 현상 — iOS 플랫폼이 그 전환 단계에서 AppIcon 다크 variant를
  반영하지 못하는 것으로 추정되나 확정된 해결책 없음(CHANGELOG 2026-08-11)
- **Home Screen 아이콘 다크모드 반영 여부는 사용자 Settings 토글에 의존**: iOS 18+ "홈 화면
  아이콘 모양"이 시스템 다크모드와 별개 설정이라 앱이 강제할 수 없음 — 문의 들어오면 안내용으로
  참고
- PR #108(되돌리기 확인 다이얼로그 통일) 브라우저 실행 검증 — 4개 지점 모두 다이얼로그 노출→확인
  →재전환 시 기존 별점/후기/방문일 프리필까지의 실사용 흐름. `.env.local`(Supabase) 부재로 세션
  환경에서 미실행, tsc/lint/build PASS + 코드 리뷰로 대체 확인함
- PR #106(액션 버튼 Tier 통일) Vercel 프리뷰 실기기 확인 — `/activities/new`(활동·다이닝), 홈
  검색 다이얼로그, 방문기록 저장 다이얼로그, 되돌리기 다이얼로그(현재는 `RevertConfirmDialog`)
  4곳. 세션 환경 제약으로 미실행
- 아이콘 버튼 5종(headerNavBtn/iconBtn 44px, editGhostBtn 36px, mapActionBtn 28px, FAB 56px,
  다이얼로그 닫기 24px) 크기 통일 여부, 위저드 "처음부터"/"홈으로" 구현 방식 불일치(ghost 버튼
  vs 텍스트 링크) — 둘 다 PR #106 범위 밖으로 분리, PROJECT_CONTEXT §19 그룹 5 백로그 참고
- 다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E — `/places/[id]` 상세는 서버
  컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가, 카드 returnTo·결과 캐시 복원
  검증으로 대체(실제 왕복은 기존 아이폰 실기기 수동 검증으로 확인됨)
- Android 스플래시 실기기 홈 화면 확인(다크모드 포함), Galaxy 실기기 QA — 하드웨어 미확보로 보류
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화 정리(PR #95의 `emptyToNull`
  재사용 여지) — PR #95 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류
