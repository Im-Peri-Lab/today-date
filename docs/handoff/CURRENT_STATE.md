# CURRENT_STATE.md

> **마지막 업데이트: 2026-09-22**

## 현재 단계
커플(2인) 계정 전환 완료 단계 — 계정 없는 단일 워크스페이스에서 이메일 기반 SOLO/PAIRED 2인
모델로 전환하는 스키마·인증·데이터 격리·초대·파트너 화면·계정 삭제·세션 주체 판정까지 순차
병합 완료. 그 외 유지보수 / 점진적 UX 개선, Capacitor 네이티브 앱은 여전히 `main` 미머지 상태로
보류 중.

## 현재 한 줄 요약
**커플 계정 전환(신규, 260904~260922, PR #118~127)**: `couples`/`users` additive 스키마 +
단일 워크스페이스 백필(012/013, PR #118) → 인증 단일 출처를 `app_config`에서 `couples`/`users`로
전환(PR #119) → `activities`/`places`/`recommendations_log` 커플 데이터 격리 + 403 대신 404
정책(PR #120) → `couple_id` NOT NULL 승격(014) + 대시보드 DB 오류를 200/전부 0으로 삼키지 않게
수정 + PostgREST 스텁 기반 실 라우트 e2e 하네스 신규(PR #121) → 홈 화면 error.tsx 오류 경계(PR
#122) → 파트너 초대로 SOLO→PAIRED 전환(015, PR #123) → 파트너 정보 화면 + 초대 진입점을 카드에서
상태 안내 배너(`styles.notice`, SKILL §5-C 신규)로 계위 분리(PR #124) → SOLO 상태 계정 삭제 +
같은 이메일 재가입 경로(PR #125) → 다크모드 파트너 초대 배너 대비 보정(PR #126) → 세션 주체를
기기별로 기억해 초대받은 사람이 재로그인해도 자기 세션을 유지하도록 수정(`deviceUser.ts`,
`resolveSessionUser`, PR #127) 모두 병합 완료. 상세 → CHANGELOG 2026-09-04~2026-09-22, 배경·
설계 근거 → PROJECT_CONTEXT §1·§2·§5·§19·§20, 배너 스펙 → SKILL §5-C.

이전 배치(자동화 테스트·CI, P2 리팩터, 네이밍 용어 매핑, 기술 백로그 그룹 1·3, `.mealBadge` 대비
보정, 액션 버튼 Tier A/B 통일, 되돌리기 확인 다이얼로그 통일, Capacitor 네이티브 앱 셸/스플래시/
아이콘)는 상세 → CHANGELOG 2026-07-29~2026-08-11.

## 브랜치 상태
- `chore/capacitor-init` — PR #111~#116 모두 병합 완료 상태 그대로 `main` 미머지 유지. 그 사이
  `main`이 커플 계정 전환(PR #118~127)으로 크게 앞서 나가 이 브랜치의 diverge 폭이 더 커짐 —
  최종 머지 시 충돌 범위 재점검 필요. 머지 시점·방식은 여전히 사용자 지시 대기
- main 기준 build PASS (PR #127 반영분 포함)

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
- `couples`/`users` additive 스키마 + 단일 워크스페이스 백필(012/013, PR #118) → 상세 CHANGELOG 2026-09-04
- 인증 단일 출처 `app_config` → `couples`/`users` 전환(PR #119) → 상세 CHANGELOG 2026-09-07
- activities/places/recommendations_log 커플 데이터 격리, 소유권 미일치는 403 대신 404(PR #120) → 상세 CHANGELOG 2026-09-07 v2
- `couple_id` NOT NULL 승격(014) + 대시보드 DB 오류 처리 + PostgREST 스텁 실 라우트 e2e 하네스 신규(PR #121) → 상세 CHANGELOG 2026-09-08
- 홈 화면 `error.tsx` 오류 경계(PR #122) → 상세 CHANGELOG 2026-09-08 v2
- 파트너 초대로 SOLO → PAIRED 전환(015: 발송/수락/자가가입 대기초대 확인, PR #123) → 상세 CHANGELOG 2026-09-08 v3
- 파트너 정보 화면(`/partner/info`) + 초대 진입점을 상태 안내 배너(`styles.notice`)로 계위 분리, 삼선 메뉴 선언 배열화(PR #124) → 상세 CHANGELOG 2026-09-09
- SOLO 상태 계정 삭제 + 같은 이메일 재가입 경로, 외래키 순서(activities/places/recommendations_log → email_tokens → users → couples)로 삭제(PR #125) → 상세 CHANGELOG 2026-09-11
- 다크모드 파트너 초대 배너 대비 개선(`--s-notice-bg`/`-line` 다크값 보정, PR #126) → 상세 CHANGELOG 2026-09-11 v2
- 세션 주체를 기기별로 기억(`deviceUser.ts`) — 초대받은 사람이 재로그인해도 자기 세션 유지(PR #127) → 상세 CHANGELOG 2026-09-22

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #127 반영 기준)

## 진행 중 / 남은 작업
- **`chore/capacitor-init` → `main` 최종 머지**: PR #111~#116 모두 병합 완료 상태지만, 전체
  Capacitor 네이티브 셸 자체를 `main`(프로덕션 배포 소스)에 반영할지는 아직 사용자 확인 전 —
  머지 시점·방식(ff-only/squash)은 별도로 지시받아 진행할 것. `main`이 그 사이 커플 계정 전환
  (PR #118~127, 스키마·미들웨어·다수 라우트 변경)으로 크게 앞서 나갔으므로, 실제 머지 시도 전에
  diverge 범위(특히 `middleware.ts`·`src/app/api/auth/*`)를 다시 살펴야 함
- **PAIRED 상태 계정 삭제는 범위 밖(PR #125)**: 한 사람의 탈퇴가 상대의 위시리스트까지 지우는
  문제라 상대 동의·데이터 승계 정책을 먼저 정해야 함. 현재는 PAIRED에서 삭제 자체를 차단만 함 —
  착수 전 정책 결정 필요(PROJECT_CONTEXT §19)
- **패스코드 공유는 여전히 수동 안내뿐**: 초대 메일에 패스코드가 담기지 않아(계정 보안상 의도),
  초대자가 발송 직후 배너 안내를 보고 직접 알려줘야 파트너가 로그인 가능. 자동 전달 채널은 아직
  없음(의도된 설계인지 향후 개선 대상인지는 미판단 — PROJECT_CONTEXT §19)
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
