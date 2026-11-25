# CURRENT_STATE.md

> **마지막 업데이트: 2026-11-25 (PR #196 홈 타이틀 새로고침 반영, PR #134~#194 반영, 보류 12 프로덕션 재측정 종결, Sentry 연동(보류 18) 완료, 사용자 실기기 확인 결과 261121·261122 반영, 261123 Capacitor 보류 결정·로컬 env 서울 전환)**

## 현재 단계
커플(2인) 계정 전환 완료 + 파트너 표시용 닉네임 추가 단계 — 계정 없는 단일 워크스페이스에서
이메일 기반 SOLO/PAIRED 2인 모델로 전환(스키마·인증·데이터 격리·초대·파트너 화면·계정 삭제·
세션 주체 판정)한 뒤, 그 위에 이메일 대신(또는 함께) 보여줄 닉네임 설정 기능까지 병합 완료.
그 외 유지보수 / 점진적 UX 개선, Capacitor 네이티브 앱은 여전히 `main` 미머지 상태로 보류 중.

## 현재 한 줄 요약
**홈 타이틀 새로고침(PR #196, 머지 `788be1f`)**: 홈 상단의 하트나 Today Date 글자를 누르면 홈 카드의 목록 건수와 미리보기를 제자리에서 갱신한다. 당겨서 새로고침과 같은 조회를 사용한다. GitHub CI와 Vercel Preview 배포, 로컬 모바일 크기 브라우저 검증 완료.

**홈 카드 미리보기(PR #191, 머지 `c80ab1b`)**: 상단 추천 배너가 2열로 바뀌는 1024px 이상에서 홈 카드 제목 옆 전체 개수, 최근 항목 최대 2개와 해당 날짜를 표시한다. 항목명은 12px에 `--s-sub` 75%와 `--s-ink` 25%를 섞고 날짜는 11px에 캡션 색을 쓴다. 1024px 미만은 기존 요약을 사용한다. GitHub CI·Vercel 및 데스크톱 라이트·다크 프리뷰 확인 완료. iPad 실기기 미확인.

**선택 컨트롤과 홈 추천 카드의 눌림 피드백 정리(PR #186·#187, 261122)**: 목록·등록 폼의 선택 컨트롤과 홈 추천 카드 두 장의 iPhone 실기기 확인을 완료했다. 홈 추천 카드는 터치에서 크기를 고정하고 배경에 검정 16% 오버레이를 즉시 표시한 뒤, 손을 떼면 140ms에 걸쳐 복귀한다. SOLO 홈 파트너 안내 링크는 사용자의 실기기 화면에 노출되지 않아 미확인이다.

이전 배치(PR #184):
**Supabase 서울 리전 이전 + 함수 리전 icn1(신규, 261122, PR #184)**: 운영 DB(public)를 시드니 `ap-southeast-2` 에서
서울 `ap-northeast-2`(`zptouznrtacmjbcoikxw`)로 dump→restore(마이그레이션 재실행 없음, id·`session_version` 보존 → 기존
세션 유지), 함수 리전 `syd1`→`icn1`. 컷오버 직전 재적재 후 행 수·내용 md5·RLS·제약·인덱스·트리거·GRANT 144항목 시드니와
일치. Preview 실측 TTFB 함수 경로 약 1/3~1/5(unlock 269→72ms). 절차·롤백 → CHANGELOG 2026-11-22 v2,
스크립트 `scripts/region-migration/`. 시드니 프로젝트·dump·`.env.migration` 은 261129 삭제 예정(보류 26번).

이전 배치(PR #183):
**탭 눌림 피드백 + 위저드 선택 전환 지연(신규, 261122, PR #183)**: 탭 카드(`.cardInteractive` 0.98)·유틸 아이콘
버튼(`.headerNavBtn` 0.92 / `.iconBtn` 0.91 / `.mapActionBtn`·`.dialogCloseBtn` 0.90, hover 면 토큰)·위저드 `.optionCard` 0.98·`.chip` 0.97
에 `:active` 추가 — 누를 땐 transition 0 즉시, 뗄 때 200ms ease-out 복귀(iOS 짧은 탭에서 보이게). 위저드 자동 전환 단계는 선택 틴트를
150ms 보여 준 뒤 전환하고, 대기 중 재탭·전환+300ms 안에 시작된 탭은 무시(`useDelayedAdvance`). 상세 → CHANGELOG 2026-11-22,
교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §5. 사용자 실기기 확인 완료.

이전 배치(PR #137~#139):
**아이콘 버튼 티어 박스를 글리프 대비 여백 비율로 재정의(신규, 261013, PR #137~#139)**: 박스 크기를 글리프 대비
한쪽 여백 비율(0.375~0.41)로 정해 헤더 `.headerNavBtn` 44→40px(글리프 22px), 카드 ⋮ `.iconBtn` 44→36px(글리프 20px,
22px는 카드 안에서 과해 의도된 예외), `.mapActionBtn` 28/16 유지. 28/16 인접 쌍(연필·복사하기, 지도·▾)은 박스 gap 2px로
통일. 헤더는 제목 이하가 4px 위로 올라오는 걸 보정하지 않았고 카드 ⋮만 오프셋 보정으로 글리프 중심을 유지(비대칭은 의도).
`.editGhostBtn` 삭제·`.iconBtn` sticky hover 가드 포함. 상세 → CHANGELOG 2026-10-13 v4, 교훈 → PROJECT_CONTEXT §20,
스펙 → SKILL §7·§10-B·§10-I. 라이트/다크·모바일/데스크탑은 Playwright 렌더(computed·픽셀 실측)로 확인.

이전 배치(PR #134~#136):
**전 화면 우측 상단 고정 홈 아이콘 + 유틸 아이콘 색·두께 통일(261013, PR #134~#136)**:
홈(`/`)·`/list`를 뺀 모든 화면 우측 상단에 `.headerNavBtn` 홈 아이콘(공용 `TopBar`)을 두고, 좌측에는
기존 뒤로가기("홈으로"·"목록으로"·"처음부터" 등)를 그대로 둔다 — 좌측 링크의 목적지가 홈이어도 지우지
않는다(위치 일관성 우선, #134에서 지웠다가 #136에서 복원). 유틸 아이콘 4계열
(`.headerNavBtn`·`.mapActionBtn`·`.iconBtn`·`.dialogCloseBtn`)은 라이트 ink50/sub50·다크
ink30/sub70·stroke 1.25로 통일(#135). 상세 → CHANGELOG 2026-10-13 v3, 교훈 → PROJECT_CONTEXT §20,
스펙 → SKILL §6·§7·§10-B·§13. 라이트/다크·모바일/데스크탑은 Playwright 렌더로 확인, 실기기 확인은 미기록.

이전 배치:
**상세 복사하기 단독 버튼·모서리 아이콘 정렬(261013, PR #133)**: 상세 우상단 ⋮ 메뉴를 제거하고 복사하기를
등록 정보 블록 안 연필 왼쪽 단독 버튼으로 이동, 연필·복사하기·지도·▾ 28px/16px 정렬. 상세 → CHANGELOG
2026-10-13 v2, 교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §7·§10-B·§10-I.

**신규 등록·상세 상단 복귀 버튼 `returnTo` 누락 수정(신규, 261013, PR #132)**: 복사하기(리스트
카드·상세)·추천 결과 0건 "추가하기"·홈 FAB가 실제 출발 화면을 가리키도록 `returnTo`를 넘기게
했고, `getSafeListReturnTo`가 홈(`/`)·상세 경로까지 허용하도록 확장, 라벨은 `getReturnLabel`
단일 출처("목록으로"/"추천 결과로"/"상세로"/"홈으로"). 상세 → CHANGELOG 2026-10-13, 설계·교훈 →
PROJECT_CONTEXT §12·§20, 라벨 스펙 → SKILL §13. 화면 클릭 확인은 사용자가 완료.

**파트너 표시용 닉네임 설정(신규, 261012, PR #128)**: `users.nickname` nullable 컬럼(016,
additive) 추가 → `/account`("내 정보")에서 설정/재수정, `/partner/info`("파트너 정보")에서
닉네임+이메일 함께 표시(미설정 시 "설정 안 함") → 두 화면을 헤더 없는 동일 카드·동일 필드
순서(닉네임→이메일→가입일)로 통일 → `PATCH /api/account`(신규, 본인만 수정)·iOS Safari 이메일
자동 밑줄 차단(`format-detection` 메타 태그)까지 반영. 사용자 디자인 피드백 4라운드를 거쳐
반복 수정(명칭·레이아웃·편집 버튼 위치·여백). 상세 → CHANGELOG 2026-10-12, 배경·설계 근거 →
PROJECT_CONTEXT §5(인증 F-01)·§20.

⚠️ **머지 예외**: PR #128은 `gh pr merge --merge`(일반 머지)로 잘못 머지되어 `main`에 머지
커밋 + 개별 커밋 6개가 그대로 들어가 있다(`238d3de`, 표준은 squash). 사용자 확인 하에 되돌리지
않고 그대로 두기로 확정 — 기능적 문제 없음, 배포 목록에 커밋이 더 보이는 정도. 상세 → CHANGELOG
2026-10-12, 교훈 → PROJECT_CONTEXT §20.

이전 배치(커플 계정 전환, PR #118~127)는 상세 → CHANGELOG 2026-09-04~2026-09-22, 그 이전
(자동화 테스트·CI, P2 리팩터, 네이밍 용어 매핑, 기술 백로그 그룹 1·3, `.mealBadge` 대비 보정,
액션 버튼 Tier A/B 통일, 되돌리기 확인 다이얼로그 통일, Capacitor 네이티브 앱 셸/스플래시/아이콘)
는 상세 → CHANGELOG 2026-07-29~2026-08-11.

## 브랜치 상태
- `infra/supabase-seoul-region` — PR #184 squash 머지(머지 커밋 `942c13d`), 로컬·리모트 브랜치·worktree 삭제. `scripts/region-migration/`(dump·restore·reload-data·verify) + `vercel.json` `regions` `icn1`. Draft 로 연 뒤 DB 컷오버(재적재·검증·Production 환경변수 서울 교체) 완료 후 머지
- `fix/login-button-loading-until-home` — PR #182 squash 머지, 로컬·리모트 브랜치·worktree 삭제. `/lock` [로그인]·패스코드 제출 시 홈 전환 완료(언마운트)까지 로딩 유지(15초 안전 타임아웃), `inFlightRef` 로 연속 탭 중복 요청 차단. 실패 경로·인증 로직 변경 없음. Preview 확인은 사용자가 완료
- `fix/pwa-splash-icon-512-heart20` — PR #181 squash 머지(머지 커밋 `9850390`), 로컬·리모트 브랜치·worktree 삭제. `public/icon-512.png` 하트 폭 52%→20%(같은 중심·배경 `#f5f3ff`). Android 12+ WebAPK 로딩 화면(240dp 고정)의 하트를 화면 폭 약 34%→약 12.5% 로. 홈 아이콘(icon-192)·`apple-touch-icon`·manifest 변경 없음. 갤럭시 실기기 확인은 대기(보류 23번)
- `perf/app-ready-on-login` — PR #180 squash 머지, 로컬·리모트 브랜치·worktree 삭제. 잠금해제 성공 응답에 `app-ready` 발급(속성은 `lib/auth/appReady.ts` 단일 출처, 기존 값 그대로) + 미들웨어 `expireSession` 에서 `app-ready` 삭제(다른 기기 계정 삭제 후 재가입 경로 보존). Preview 확인은 사용자가 완료. 사용자 iPhone PWA 재로그인 완료(261121, `app-ready` 적용). 확인용 `diag/app-ready-verify`(이 브랜치 + diag 계측)는 머지 없이 삭제
- `diag/loading-server-timing`(`443f1cc`) — **머지 금지·재측정용(유지)**. 미들웨어·unlock·목록 API·홈/상세 렌더 구간별 Server-Timing 계측. 서버 컴포넌트는 Next 14 에서 헤더를 못 써서 홈·상세 렌더는 `/api/diag/render-timing` + 서버 로그 `[server-timing]` 로 잰다. 재측정 시 main 위로 rebase 후 Preview 로 띄울 것. worktree 는 제거됨
- `chore/codex-agents-md` — PR #178 squash 머지, 로컬·리모트 브랜치·worktree 삭제. 원래 폴더에 untracked 로 있던 `AGENTS.md`(Codex 지침, `CLAUDE.md` 사본에 경로만 `.Codex`)를 worktree 로 옮겨(mv, 복사 아님) 커밋. 본문은 `CLAUDE.md` 를 단일 출처로 가리키는 포인터 + Codex 전용 차이(디자인 기준 `.claude/skills/today-date-design/SKILL.md` 직접 읽기, worktree 는 리포 밖 `$CODEX_HOME/worktrees`)만 남김. 로컬 확인은 사용자가 완료. `/.agents/`(디자인 SKILL 사본)는 `.gitignore` 에 추가, 파일은 삭제하지 않음. `CLAUDE.md` 변경 없음
- `feat/list-card-dday` — PR #177 squash 머지, 로컬·리모트 브랜치·worktree 삭제. 위시리스트 카드 D-day(`D-n`/`D-DAY`/`D+n`, KST). Preview 화면 확인은 사용자가 완료
- `feat/ios-pwa-splash` — PR #176 squash 머지, 로컬·리모트 브랜치·worktree 삭제. iOS 홈 화면 PWA 시작 이미지 22장(배경 `#ede9fe`, 아이콘 그라데이션 하트 + 타이틀). HTML 스플래시 레이어는 위치 어긋남으로 제거. 진단 브랜치 `diag/ios-splash-metrics` 는 머지 없이 삭제. 실기기 확인은 사용자가 완료
- `feat/visited-date-default-planned` — PR #175 squash 머지, 로컬·리모트 브랜치·worktree 삭제. '다녀왔어요' 방문 날짜 기본값 = 방문예정일(오늘/지난 날짜일 때), 없거나 미래면 오늘(기기 로컬). Preview 화면 확인은 사용자가 완료
- `docs/concurrent-session-worktree-rule` — PR #172 squash 머지, 로컬·리모트 브랜치·worktree 삭제. 리포 루트 `CLAUDE.md` 신설(동시 세션 안전 규칙: 전용 worktree·커밋 전 브랜치 확인·포트/`.env.local`·자기 worktree 만 제거)
- `wip/capacitor-app-id-change`(`9c56088`) — **보류 작업 보존용(머지 대상 아님)**. `e159d31`(`chore/capacitor-init` 포함) 위에 worktree 에 커밋 안 돼 있던 `project.pbxproj` `DEVELOPMENT_TEAM` 2줄을 커밋. worktree 는 제거됨
- `backup/undo-dialog-diagnosis` — 삭제(261121, 로컬·리모트) — 복구용 SHA `a715202`, 반영 PR #109
- `feat/list-sort-planned-first` — PR #171 squash 머지, 로컬·리모트 브랜치 삭제. `/list` 위시리스트 3그룹 정렬(다가오는 예정 → 지난 예정 → 예정 없음, KST 기준). Preview 화면 확인은 사용자가 완료
- `fix/android-calendar-intent-pwa-splash` — PR #170 squash 머지 완료(머지 커밋 `c5de098`), 로컬·리모트 브랜치 삭제됨. Android 캘린더 추가 분기(애플=`.ics` / Android 카카오톡 인앱=intent / 그 외 Android=`.ics` + 안내 토스트 / PC=구글 웹, 앱 id `apple-ics`→`ics`). 갤럭시 실기기(크롬 `.ics` → 앱 등록 화면·카카오 intent·안내 토스트)는 사용자가 확인 완료. 스플래시 아이콘 확대(`e767316`)는 같은 PR 안에서 revert(`ff19f4f`) — 프로덕션 아이콘 변경 없음. CI(Lint·Unit·Build, E2E, Vercel) 통과
- `fix/ios-apple-touch-icon` — PR #174 squash 머지 완료(머지 커밋 `2a80cb8`), 로컬·리모트 브랜치·worktree 삭제됨. iOS 홈 화면 아이콘 "T" → `apple-touch-icon.png`(180px, 기존 모양) 복원 + `metadata.icons.apple`. CI 통과. 실기기 확인 완료(261121): iPhone 기존 아이콘 삭제 후 "홈 화면에 추가" → 하트 아이콘
- `fix/pwa-splash-hide-title` — PR #173 squash 머지 완료(머지 커밋 `e8d84fe`), 로컬·리모트 브랜치·worktree 삭제됨. manifest `name` → `"\u200B"`(Android 로딩 화면 문구 숨김) + `appleWebApp.title`. CI(Lint·Unit·Build, E2E, Vercel) 통과
- `diag/pwa-splash-no-title` — 삭제(261121, 로컬·리모트) — 복구용 SHA `904116c`, 반영 PR #173
- `diag/android-calendar-intent-compare` — 삭제(261121, 로컬·리모트, 진단 페이지 `/diag/calendar` 포함) — 복구용 SHA `b4ed70c`, 반영 PR #170
  - 안드로이드 캘린더 방식 재비교가 필요하면 `b4ed70c`로 복구
- `diag/android-calendar-check` — 삭제(261121, 리모트만 있었음) — 복구용 SHA `a231ecd`, 반영 PR #170(`diag/android-calendar-intent-compare`로 옮겨져 이어짐)
- `chore/e2e-stabilization-handoff` — PR #169 squash 머지 완료(머지 커밋 `5bb580b`), 로컬·리모트 브랜치 삭제됨. 패스코드 입력 하이드레이션 대기(보류 15번) + e2e/db 스펙 파일 수 가드(보류 17번) + 핸드오프 정합성. CI(Lint·Unit·Build, E2E, Vercel) 통과
- `chore/capacitor-init` — PR #111~#116 모두 병합 완료 상태 그대로 `main` 미머지 유지. 그 사이
  `main`이 커플 계정 전환(PR #118~127) + 닉네임 설정(PR #128)으로 크게 앞서 나가 이 브랜치의
  diverge 폭이 더 커짐 — 최종 머지 시 충돌 범위 재점검 필요. 머지 시점·방식은 여전히 사용자
  지시 대기
- `feat/partner-nickname` — PR #128 머지 완료, 로컬·리모트 브랜치 모두 삭제됨
- main 기준 build PASS (PR #128 반영분 포함, PR #129~#131은 tsc·eslint 확인, iOS 실기기 확인은 사용자가 완료. PR #132는 CI(lint/vitest/e2e/Vercel) 통과, 화면 클릭 검증은 사용자가 완료)
- `fix/new-entry-returnto-propagation` — PR #132 머지 완료, 로컬·리모트 브랜치 삭제됨
- `design/detail-copy-button-standalone` — PR #133 머지 완료, 로컬·리모트 브랜치 삭제됨 (CI lint/vitest/e2e/Vercel 통과, 화면 확인은 사용자가 완료)
- `feat/header-home-button-unify`(PR #134)·`fix/restore-back-link-when-duplicate-home`(PR #136)·`design/map-action-btn-color-align`(PR #135) — 모두 squash 머지 완료, 로컬·리모트 브랜치 삭제됨 (각 PR CI lint/vitest/e2e/Vercel 통과)
- `fix/home-stats-refresh-and-pull-to-refresh` — PR #156 squash 머지 완료, 로컬·리모트 브랜치 삭제됨 (CI·Vercel 통과, 실기기 확인은 사용자가 완료)
- `feat/planned-visit-date` — PR #157 squash 머지 완료, 로컬·리모트 브랜치 삭제됨 (lint·vitest·build·Playwright 스텁 렌더 확인)
- `fix/planned-at-clear-wording` — PR #160 squash 머지 완료, 로컬·리모트 브랜치 삭제됨 (방문예정일 지우기 문구 통일)
- `design/detail-date-typography-unify` — PR #158 squash 머지 완료, 브랜치 삭제됨 (CI 통과, 시각 확인은 사용자 몫)
- `chore/eslint-no-useless-escape` — PR #164 squash 머지 완료(머지 커밋 `db4225c`), 브랜치 삭제됨. `no-useless-escape: error`, 켤 당시 새 위반 0건
- `chore/lint-scope-e2e` — PR #166 squash 머지 완료(머지 커밋 `d2080ee`), 브랜치 삭제됨. `npm run lint` 범위를 `src`+`e2e`+루트 설정 파일 5개로 확장(PR #164 Codex 지적), 새 위반 0건
- `chore/eslint-root-config` — PR #179 squash 머지, 브랜치 삭제. `.eslintrc.json` `root: true` 로 리포 안 worktree lint 충돌 해소, 규칙 99개·경고 0 변경 전과 동일
- `fix/calendar-ux-polish` — PR #165 squash 머지 완료(머지 커밋 `d518941`), 로컬·리모트 브랜치 삭제됨. 머리말 안내 다이얼로그 취소·저장(문구에만 적용, 추가는 항상 진행, SKILL §11 의도된 예외) + 일정 수정 토스트("일정이 바뀌었어요…" + "다시 추가", 방문 예정·방문 기록) + `/settings` 안내 줄 삭제. CI·Vercel 통과, 프리뷰는 사용자 확인 완료
- `design/planned-time-inline-field` — PR #163 squash 머지 완료(머지 커밋 `3a2ce97`), 로컬·리모트 브랜치 삭제됨. 방문예정 시간 입력 UI 단순화("+ 시간 추가" 제거·상시 노출·미리 채우기 제거, 화면 라벨 없이 날짜 박스와 8px 한 묶음). CI(E2E 82 통과)·Vercel 통과. 실기기 확인 완료(261121): iOS Safari 빈 시간 칸 높이·휠 정상
- `fix/ics-escape-text` — PR #162 squash 머지 완료(머지 커밋 `aa7aad0`), 로컬·리모트 브랜치 삭제됨. `.ics` TEXT 이스케이프(`;`) 수정, 보류 14번 해소. 실기기 확인 완료(261121): iOS 에서 제목에 `;`·`,` 포함 캘린더 추가 정상
- `feat/planned-visit-time` — PR #161 squash 머지 완료(머지 커밋 `bbb8c5f`), 로컬·리모트 브랜치 삭제됨. 방문예정 시간 입력 + 캘린더 시간 지정 일정(021). Supabase `021_planned_time.sql` 은 머지 전 사용자가 실행·두 테이블 CHECK 제약 확인 완료. CI(Lint·Unit Test·Build, E2E 79 통과·재시도 없음)·Vercel 통과. iOS `.ics` 시간 지정 일정 실기기 확인 완료(261121). **남은 확인: 구글/Android 실기기**
- `feat/calendar-export` — PR #159 squash 머지 완료, 로컬·리모트 브랜치 삭제됨 (CI·Vercel 통과, 상세 블록·설정 화면·토스트·iOS 실기기 캘린더 추가는 사용자가 직접 확인 완료. **미확인: 구글 캘린더/Android 실기기.** 남은 확인: 시크릿 모드로 머리말 최초 미설정 안내 다이얼로그 1회 — 나중에 가볍게). 사전 스파이크 `diag/ics-blob-standalone-check` 는 폐기·삭제
- `feat/calendar-offer-on-create` — PR #167 squash 머지 완료(머지 커밋 `e364c47`), 로컬·리모트 브랜치 삭제됨 (CI·Vercel 통과, 토스트 가독성·[추가]·미표시 조건은 사용자가 실기기 확인 완료. **확정: 연속 등록 후 목록에서는 캘린더 제안을 표시하지 않음 — 연속 등록 중 미표시 판단과 같은 흐름. 목록에서는 대상 항목이 모호하므로, 필요하면 카드 ⋮ 메뉴로 추가**)
- `fix/e2e-db-spec-single-file` — PR #168 squash 머지 완료(머지 커밋 `29b2cb2`), 로컬·리모트 브랜치 삭제됨. DB 스펙 파일을 `isolation.spec.ts` 하나로 단일화해 CI #217 실패(워커 분리로 스텁 상태 충돌) 수정. CI(Lint·Unit·Build, E2E, Vercel) 통과

## 최근 구현 완료
- Supabase 서울 리전 이전 + 함수 리전 `icn1`(PR #184) → 상세 CHANGELOG 2026-11-22 v2
- 잠금해제 성공 시 `app-ready` 발급 — 로그인 기기의 미들웨어 워크스페이스 조회(couples→users 순차 2회) 제거(PR #180) → 상세 CHANGELOG 2026-11-21 v4
- 로그인 버튼 홈 전환 완료까지 로딩 유지 + 연속 탭 중복 요청 차단(`src/app/lock/page.tsx`, PR #182) → 상세 CHANGELOG 2026-11-21 v6
- Android PWA 로딩 화면 하트 축소: icon-512 만 하트 20%(홈=icon-192 / 로딩=icon-512 로 크기 분리, PR #181) → 상세 CHANGELOG 2026-11-21 v5
- iOS 홈 화면 PWA 시작 이미지(`apple-touch-startup-image`, `src/components/boot/pwaSplash.mjs` + `scripts/generate-pwa-splash.mjs`, PR #176) → 상세 CHANGELOG 2026-11-21
- '다녀왔어요' 방문 날짜 기본값을 방문예정일로(`src/lib/visitedDate.ts`, PR #175) → 상세 CHANGELOG 2026-11-20
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
- 파트너 표시용 닉네임 설정 — `users.nickname`(016), `/account`·`/partner/info` 통일 레이아웃, `PATCH /api/account`(PR #128) → 상세 CHANGELOG 2026-10-12
- 인라인 편집 저장/취소 버튼 규칙 통일(상세 편집 + 닉네임 편집) — 우측 정렬·취소 → 저장·"저장 중..."(PR #129~#131) → 상세 CHANGELOG 2026-10-12 v2
- 복사하기·추천 0건 "추가하기"·홈 FAB의 `returnTo` 전달 + 상단 복귀 버튼 라벨 통일(PR #132) → 상세 CHANGELOG 2026-10-13
- 상세 ⋮ 메뉴 제거 + 복사하기 단독 버튼(연필 왼쪽), 연필·복사하기·지도·▾ 28px 정렬(PR #133) → 상세 CHANGELOG 2026-10-13 v2
- 전 화면 우측 상단 고정 홈 아이콘(`TopBar`) + 좌측 "홈으로" 링크 복원(PR #134·#136), 유틸 아이콘 4계열 색·두께 통일(PR #135) → 상세 CHANGELOG 2026-10-13 v3
- 장소 카테고리 개편: 아시안·뷔페·브런치 추가, 디저트 제거(11종, 마이그레이션 017·018 적용 완료)(PR #141) → 상세 CHANGELOG 2026-10-13 v5
- 액티비티 카테고리 개편: 운동·쇼핑 추가 + 순서 재배치(9종, 마이그레이션 019 적용 완료, 다음 번호 020)(PR #144) → 상세 CHANGELOG 2026-10-15
- 홈·리스트 상단 서브텍스트 삭제 + 타이틀 아래 간격 확정(홈 `mt-6`, 리스트 탭 `mt-4`, `PageHeader` subtitle 선택 prop)(PR #145) → 상세 CHANGELOG 2026-10-15 v2
- 홈 바로가기 2열 그리드 타일 + 라벨 간소화("액티비티"/"다이닝") + 모바일 개수만/데스크탑 "항목명 외 N" + 섹션 제목 14px/`--s-ink` + 다크 칩 대비 개선 2건 + 다이닝 타입 아이콘 `MapPin`→`UtensilsCrossed` + 홈 "다녀온 곳" 미리보기를 `/list`와 같은 정렬로 통일(`orderByListRule` 공유)(PR #146) → 상세 CHANGELOG 2026-10-15 v3
- 홈 추천 CTA 이미지 배너(라이트 밝기·다크 분리 스크림, 색 스크림+후광) + 바로가기 타일 세로 2단(모바일 항목명 + 외 N개 → 2026-11-24 개수 제목 옆·대표 항목 2개로 대체(PR #195, 상세 CHANGELOG 2026-11-24 v3)) + 홈 서브타이틀 "우리 둘의 데이트를 채워가는 공간" 재도입 + 배너↔섹션 간격 모바일/lg 차등 + 솔로 모바일 FAB 겹침 수정(`pb-20`)(PR #147) → 상세 CHANGELOG 2026-10-16
- 위시리스트 빈 정보 줄 플레이스홀더 + 다이닝 지역 아이콘 `Compass`(위치 `MapPin`과 분리) + 다녀온 카드 후기 한 줄 미리보기(`min-h-4` 슬롯·"후기가 없습니다") + 다크 플레이스홀더/구분선 가시성(`.emptyHint`, `.divider`)(PR #148) → 상세 CHANGELOG 2026-10-19
- 카드 ⋮ 메뉴 여백을 카테고리·제목 줄에만(`pr-8`) 적용 — Link `pr-11` 제거로 메타·정보 줄·별점/후기 구분선·후기 미리보기가 카드 전체 폭 사용(PR #149) → 상세 CHANGELOG 2026-10-19 v2
- 홈 배너↔첫 섹션·섹션 사이 여백을 `svh clamp()` 대신 flex 스페이서(`.statSlack`/`.statGapSlack`)로 — 남는 높이만큼만 16~30 / 12~15로 늘어남, 홈·`/list`·홈 error 상단 `pt-6`→`pt-4`. 사파리 하단 바 뒤 영역은 웹 영역 밖(body 색)이라 CSS 로 칠할 수 없음을 실기기로 확인, 시도한 수정은 모두 걷어냄(PR #150) → 상세 CHANGELOG 2026-10-20
- 홈에서만 추천 배너 WebP 두 장을 `<link rel="preload">` 로 미리 받아 단색→이미지 전환 구간 단축(효과는 미세, 단색 구간은 남음). 거슬리면 폴백 그라데이션부터(PR #151) → 상세 CHANGELOG 2026-10-21
- 전역 로딩 지연 대응 1·2차: `vercel.json` 으로 함수 리전을 `iad1` → `syd1`(Supabase ap-southeast-2 권역)로 고정(PR #152, 프로덕션 `X-Vercel-Id: icn1::syd1::…` 확인) + 미들웨어 `session_version` 검증을 `couple_id` 기준 15초 TTL 인메모리 캐시로 감쌈(PR #153, 재설정 후 다른 기기 옛 세션이 인스턴스당 최대 15초 유효 — 허용한 트레이드오프). 진단 결과·사실 목록 → 상세 CHANGELOG 2026-10-22
- topLoader 수동 이동 정합: `HomeFab` 메뉴 항목과 카드 ⋮ 메뉴(정보 수정·기록 수정·복사하기)가 `start()` → `requestAnimationFrame` → `router.push` 순서를 따름(상세 화면 경로와 동일, PR #154). `<Link>` 탭 체감·CSS `:active` 피드백은 범위 밖 → 상세 CHANGELOG 2026-10-22 v2
- 홈 통계 갱신 누락 수정 + 홈·목록 당겨서 새로고침: 등록·수정·삭제·되돌리기 뒤 `['dashboard-stats']` 무효화(`invalidateDashboardStats`), `PullToRefresh` 가 화면 전체를 내렸다 올림(FAB 는 래퍼 밖)(PR #156) → 상세 CHANGELOG 2026-10-30
- 등록 직후 "캘린더에도 추가할까요?" 제안: 예정일과 함께 등록해 상세로 갈 때 상세 도착 시 1회(sessionStorage 예약·1회 소비, 성공 문구 없음), [추가]는 머리말 안내 경유(PR #167) → 상세 CHANGELOG 2026-11-13
- 일반 토스트 배경 투명 문제 수정: 맨 `var()`·`.dark` 전용 shadcn 토큰 대신 카드 토큰 + `.toaster` 다크 재선언(PR #167) → 상세 CHANGELOG 2026-11-13
- 위시리스트 방문 예정일(`planned_at`): 카드 footer·`/list` 방문예정 필터·상세 "방문 예정" 블록(방문 기록과 같은 생명주기, 값 없으면 하단 outline "언제 갈까요?")·카드 ⋮ "방문예정일 지우기"(확인 다이얼로그 "지우기", `PlannedAtClearDialog` 공용, PR #160)·`/new` 맨 아래 필드(PR #157) → 상세 CHANGELOG 2026-11-02. **열린 이슈**: outline Button 테두리 대비가 전역적으로 낮음(미결정)
- 상세 블록 타이포 정리: 방문 기록 날짜 16px/500 → 표준 `.bodyText` 14px/400, `DetailBlock` 블록 제목 500→600(PR #158) → 상세 CHANGELOG 2026-11-03
- 방문예정 시간(PR #161, 021): 방문예정에만 선택 시작 시간 `planned_time`(API `'HH:mm'`, 날짜·시간 짝 규칙 같은 요청 안에서 판정). 입력 "시간 (선택)" 칸(날짜가 있으면 바로 노출, 비우면 종일 — PR #163 에서 "+ 시간 추가" 버튼·다이닝 미리 채우기 제거), 표시 "2026.12.19 (토) 오후 7:00"·카드 footer 시간 말줄임, `/list` 같은 날 종일→시간순, 캘린더 시간 지정 일정(Asia/Seoul→UTC `Z`, +120분, 시간 없으면 종일 바이트 동일). 다녀온 곳 변경 없음 → 상세 CHANGELOG 2026-11-03 (021)
- 캘린더 추가(PR #159): 방문 예정·방문 기록 → 기기 기준(iOS 계열=Blob `.ics` 다운로드, 그 외=구글 캘린더 URL) 종일 일정. 진입점 3곳(상세 블록 날짜 옆 아이콘·카드 ⋮ "캘린더에 추가"·예정일 저장 직후 토스트), 앱 선택 UI 없음. 홈 삼선 메뉴 "설정" → `/settings`(첫 항목 캘린더 제목 문구, 인라인 취소/저장), 머리말 미설정 상태의 첫 추가 직전 안내 다이얼로그 1회 → 상세 CHANGELOG 2026-11-03
- 위시리스트 카드 D-day(PR #177): 방문예정일 footer 끝에 `D-n`·`D-DAY`(굵게)는 `--s-accent`, `D+n` 은 `--destructive`. 오늘은 KST(`todayKstIso`, 마운트 후 계산). 날짜 상태 색 규칙 → SKILL §8-A, 상세 CHANGELOG 2026-11-21
- `/list` 위시리스트 3그룹 정렬(PR #171): 오늘 이후 예정(가까운 순·종일 먼저·시간 순) → 지난 예정(최근 순) → 예정 없음(등록 최신순), "방문예정만"은 ③만 제외. API 응답 직전 `sortWishlistRows` 재정렬, "오늘"은 KST → 상세 CHANGELOG 2026-11-20 v2
- Android 캘린더 추가(PR #170): 크롬·삼성 인터넷·PWA 는 `.ics` 다운로드 + 안내 토스트("다운로드된 파일을 열면 캘린더에 추가돼요"), 카카오톡 인앱만 intent(INSERT). 웹 intent 로는 앱 "새 일정" 화면을 열 수 없음(BROWSABLE 제약) → 상세 CHANGELOG 2026-11-20, 교훈 PROJECT_CONTEXT §20
- E2E DB 스펙 파일 단일화(PR #168): `calendar-offer.spec.ts` 를 `isolation.spec.ts` 로 합쳐 워커 분리로 인한 스텁 상태 충돌(CI #217 실패) 수정, 테스트 수 94 그대로 → 상세 CHANGELOG 2026-11-18

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 함수 리전: `icn1`(`vercel.json`, PR #184 — 이전 `syd1`/PR #152). 미들웨어는 엣지 실행이라 이 설정과 무관
- DB: Supabase `zptouznrtacmjbcoikxw` 서울 `ap-northeast-2`(261122 컷오버, Vercel Production·Preview 환경변수 모두 서울). 이전 시드니 `xxqfiipzljkjstkgtawj` 는 롤백용으로 261129 까지 보관(보류 26번)
- 현재 브랜치: `main` (PR #184 반영 기준. PR #128 머지 커밋 `238d3de`만 예외적으로 squash가 아닌 일반 머지)

## 진행 중 / 남은 작업

**보류 작업 (261013 정리·261121 갱신, 우선순위 순 — 다음 세션이 놓치면 안 되는 것)**
- **로컬 `.env.local`(261123 갱신)**: 회사 노트북은 `.env.local` 이 있고 서울 프로젝트(`zptouznrtacmjbcoikxw`, `sb_secret_` 키)로 교체 완료 — 로컬 로그인·조회 사용자 확인. 운영 DB 를 직접 쓰므로 로컬에서 등록·삭제하면 실제 데이터가 바뀐다. 개인 맥북 `.env.local` 은 시드니를 가리킬 수 있어 261129 시드니 정리(보류 26번) 때 함께 확인. (이전 기록 261120: 다른 작업 폴더에서 `.env.local` 이 없어 로컬 로그인 불가였음)
1. **`android/`·`ios/` 빌드 캐시 `.gitignore` 패턴 — 머지 완료(PR #140, 머지 커밋 `7635617`, 261118 확인)**: `/android/build/`·`/android/.idea/`·`/ios/App/Pods/`·`/ios/DerivedData/` 등 빌드 캐시 패턴은 `main` 에 이미 들어 있다. 이전 기록의 "PR/머지 전"은 낡은 정보였다. **결정(261123, 사용자)**: 앱 출시 계획이 아직 없어 `chore/capacitor-init` 은 **보류 유지**, `main` 에 맞춰 계속 갱신하지 않는다. 출시를 정하면 오래된 브랜치를 억지로 머지하지 않고 최신 `main` 에서 새 브랜치로 Capacitor 를 다시 설정한 뒤, 필요한 커밋·에셋(아이콘·스플래시·`NativeBootOverlay`·Android 서명 설정)만 기존 브랜치에서 가져온다(기존 브랜치는 참고용). `android/`·`ios/` 소스(`main` 작업 트리에 untracked, `git log -- ios/` 비어 있음 — 그 브랜치 작업물이 남은 것으로 **추정**)는 커밋하지 않는다. **회사 노트북**(`~/workspace/personal/today-date`)은 실수 커밋을 막으려고 `.git/info/exclude` 에 `/android/`·`/ios/` 를 추가(이 기기 전용, 저장소 미반영, 파일은 삭제 안 함, 이유는 같은 파일 주석). 개인 맥북 등 다른 기기는 여전히 `git status` 에 보이므로 `git add -A` 주의. 출시 작업을 시작하면 exclude 두 줄을 지울 것.
2. ~~헤더 40/22·카드 ⋮ 36/20·28/16 쌍 gap 2px 최종 실기기 확인 미기록(PR #139)~~ → **종결(261121)**: 사용자 실기기 확인 결과 헤더·카드 ⋮ 탭 영역(헤더 한 변 91%, 카드 ⋮ 82%) 불편 없음. 이후 불편 신호가 오면 보류 7번으로 28px 사용처와 함께 일괄 재검토.
3. ~~카드 `Link`의 `pr-11`이 ⋮ 36px 박스와 약 2px 겹침(PR #139, 잔여)~~ → **해소(PR #149)**: `pr-11` 제거, 카테고리·제목 줄만 `pr-8`(14+32=46px = ⋮ 박스 끝과 정확히 맞닿음).
4. **다이얼로그 X 포커스 글로우 링 (F) — 보류, 별도 이슈**: 다른 아이콘 버튼은 중성 면 포커스, X만 글로우 링.
5. **폼 요소 안 아이콘 톤 — 미판단**: 필터 셰브런·입력창 돋보기·달력 트리거는 PR #135 통일 대상이 아니라(유틸 버튼이 아니라 폼 요소) 헤더 아이콘보다 옅게 남는다. `/list`에서 관찰됨. 손대려면 별도로 범위부터 정할 것.
6. **PR #134~#136 `color-mix` 폴백 — 실기기 이질감 없음(261121 사용자 확인)**: 라이트/다크·390/1280px는 Playwright 렌더로 확인했고, 실기기(iPhone)에서도 이질감 없음. 아이콘 색은 `color-mix` 미지원 엔진에서 윗줄 폴백(`--s-sub` 단색)으로 떨어진다 — iOS/Android 앱 셸 WebView 에서 이질감이 보이면 이 폴백을 먼저 의심.
7. **아이콘 버튼 박스(28/36/40px) 탭 영역 보완 여부 — 현재 보완 없음(의도된 트레이드오프, PROJECT_CONTEXT §20)**: 사용자가 "누르기 불편하다"는 신호를 줄 때만 28px 사용처(`MapLink`·닉네임 연필·상세 연필·복사하기)와 헤더·카드 ⋮를 일괄 재검토. 신호 없음(261121 확인).
8. **복귀 흐름 E2E 없음(PR #132)**: 리스트 카드 복사하기·상세 복사하기·추천 0건 "추가하기"·홈 FAB →
   신규 → 저장 → 새 상세의 상단 버튼은 사용자가 화면에서 직접 확인했지만 자동화 회귀 장치는
   단위 테스트(`listReturn.test.ts`)뿐이다(PROJECT_CONTEXT §19 그룹 7)
9. 추천 결과에서 온 상세를 삭제한 뒤 결과 화면 캐시에 항목이 남는지 미확인(PROJECT_CONTEXT §19 그룹 7)
10. 복사하기를 연속 사용하면 `returnTo`가 중첩돼 URL이 길어진다 — 저빈도 엣지케이스, 방치 중
11. **사파리 하단 바 뒤 흰 띠 + 홈 약 34pt 스크롤 잔존(261020, 수용한 한계)**: 주소창이 떠 있으면 웹 영역(예: 714pt) 밖 상태바·하단 바 뒤는 사파리가 `body` 색으로 칠해 CSS 로 위·아래를 따로 칠할 수 없다(`html`·`.page::before`·`body` 단색·`box-shadow`·진단 오버레이 시도 전부 걷어냄 — CHANGELOG 2026-10-20 "재시도 금지" 목록 참고). 홈은 웹 영역 714pt 에서 문서 748pt 라 여백 최솟값에도 약 34pt 스크롤이 남는다 — 더 줄이려면 `pb-20`(FAB 겹침 방지)을 건드려야 해 보류.
12. ~~전역 로딩 지연~~ → **종결(261124, 프로덕션 재측정)**: 미들웨어 병목(`mw-workspace` couples→users 순차 2회, 요청마다 60~100ms)은 잠금해제 시 `app-ready` 발급으로 제거(PR #180, 미들웨어 약 1ms). 남은 비용이던 icn1→syd1 경로는 Supabase 를 서울로 옮기고 함수 리전을 `icn1` 로 맞춰 해소(PR #184) — 디렉터 Preview 실측(TTFB 10회 중앙값) unlock 269→72ms, 홈 문서 375→181ms, `/list` 문서 290→96ms, `/api/activities` 348→103ms(→ CHANGELOG 2026-11-22 v2). **프로덕션 재측정(261124)**: 사용자 데스크톱 Chrome 콘솔·로그인 상태·throttling 없음, 구간별 10회 연속 fetch(no-store)·TTFB(`responseStart−startTime`) 중앙값, `x-vercel-id` icn1::icn1 확인. 결과(ms) icon-192.png(HIT) 108.5 / 홈 218.5 / `/list` 151 / `/api/activities` 161.5 / `/api/activity-categories` 158.5. 정적 기준값을 뺀 함수 구간 추정 홈 ~110·`/list` ~43·activities ~53·categories ~50 (261122 syd1 프로덕션 ~268/183/241/185) → 리전 이전 효과가 프로덕션에서도 확인됨. **판단**: activities 의 `select *`·무페이지네이션은 작은 categories 와 차이가 없어 현재 데이터량에서는 비용 없음(데이터 증가 시 재검토). 홈 렌더(다른 경로의 약 2배)만 조건부 후보로 남기고 체감 지연 신호가 있을 때 진단. `/list` 렌더 후 API 3건(클라이언트 순차 여부)은 이 방식으로 측정되지 않아 미확인 유지. 프로덕션 도메인 정적 기준값 ~108ms(Preview 39ms) 차이는 엣지 수준이라 앱 코드와 무관하며 원인 미확인 유지. **교훈**: DevTools 네트워크 제한(Slow 4G, 요청당 약 562ms)이 켜져 있으면 정적 HIT 포함 전 구간이 약 565ms 로 평평하게 나온다 — 측정 전 No throttling 확인. (→ CHANGELOG 2026-11-24 v2)
13. **탭 직후 시각 반응 부족 — `:active` 분리분 해소(261122, PR #183), 로더 분리분은 대기**: 카드·유틸 아이콘 버튼·위저드 선택지에 터치 눌림을 넣고(즉시 눌림·200ms 복귀), 위저드 자동 전환은 선택 틴트 150ms 노출 후 전환 + 더블탭 차단(상세 → CHANGELOG 2026-11-22, 스펙 → SKILL §5). 사용자 실기기 확인 완료. 남은 것: route-level `loading.tsx`(`pushState` 시점이 바뀌므로 #154 의 rAF 지연과 상호작용 확인 필요) — topLoader 가 빨리 커밋되는 이동에서 안 보이는 문제(코드상 추론, 실측 없음)는 신호가 오면 별도 진행.

14. ~~`.ics` 세미콜론 미이스케이프~~ → **해소(261103, PR #162, 머지 커밋 `aa7aad0`)**: `escapeIcsText` 치환 문자열을 `String.raw` 로 바꿔 `;` → `\;` 가 실제로 나간다. 점검 결과 `,`·`\`·줄바꿈은 원래 정상이었고 `;` 만 누락. 잘못된 값을 고정하던 테스트(`ics.test.ts:25·99`)를 `String.raw` 기대값으로 바로잡고 케이스 추가. 저장소 전체 `no-useless-escape` 스캔에서 같은 패턴은 이 3곳뿐(규칙은 `next/core-web-vitals`·`next/typescript` 에 포함돼 있지 않아 꺼진 상태). **iOS 실기기 확인 완료 → 종결(261121)**: 제목에 `;`·`,` 포함 캘린더 추가, 시간 지정 일정 추가 정상(PR #161·#162)
15. ~~e2e `chromium-db` 잠금 화면 테스트 간헐 실패~~ → **해소(261121 종결, 수정 PR #169, 머지 커밋 `5bb580b`, 261118)**: 머지 후 관찰 기간 261118 13:08 KST(`5bb580b` push) ~ 261121 00:47 KST(`7b76653` #177 push)의 CI 실행 25건(main push 11·PR 14) 전부 success, E2E 잡 25개 모두 94 passed, 재실행(attempt 2+) 0건. CI 는 `retries: 1`(`playwright.config.ts:35`)이라 재시도 통과가 success 로 묻힐 수 있어 E2E 로그 25개를 전수 확인 — `retry #`·`flaky`·`✘` 0건(로그의 "failed" 는 `[WebServer] email failed: RESEND_FROM_EMAIL not configured` 서버 출력뿐). 이하 기존 기록: 로컬 `--workers=1 --repeat-each=15`(잠금·로그인 관련 29개 ×15 = 435회) 비교: main 0건 실패, 이 브랜치 0건 실패 — main 에서도 재현되지 않아 수정 효과는 로컬에서 입증하지 못했다(원인 분석은 하이드레이션 전 입력 유실이며 수정은 그 경로를 막는다). CI 에서 재발하면 다시 연다. 수정 내용: 패스코드 입력 전에 `PasscodeInput` 의 키보드 리스너 등록(하이드레이션) 완료를 `data-passcode-ready` 표지로 기다린다(`e2e/helpers/passcode.ts` `typePasscode`, `isolation.spec.ts` 의 모든 패스코드 입력이 사용). 로컬 전체 E2E 4회 연속 94/94 통과(재현 0회). 재현 기록(수정 전): `page.goto('/lock')` 직후 `page.keyboard.type(passcode)` 가 페이지 준비(하이드레이션) 전에 시작되면 입력이 누락돼(스냅샷 "패스코드 5/6자리 입력됨") 잠금해제 다음 단계(`waitForURL('/')`·"내 이메일 주소" 입력)에서 타임아웃난다. `main`(fc52b27) 전체 E2E 3회 중 1회에서 2건 실패(`:854` 평소 잠금해제 회귀, `:1039` 로그아웃 기기 기억), `feat/planned-visit-time` 로컬에서도 실행마다 1건씩 번갈아 실패. 단독 재실행·CI(PR #161, 재시도 없이 79 통과)는 통과.
16. **필드 라벨 위계 통일 완료 (PR #189, `bac84a8`, 261122)** — 필드 라벨 14px/500/보조색, 방문 카드 제목 15px/600/본문색, 일반 그룹 제목 12px/600/보조색. 폼 간격 유지. 모바일 라이트·다크 계산값, GitHub CI, 사용자 iPhone Preview 확인 완료. 상세 → PROJECT_CONTEXT §19 그룹 8.
17. ~~e2e/db 스펙 파일 수 가드 — 미착수(261118 등록, PR #168 후속)~~ → **해소(PR #169, 머지 커밋 `5bb580b`, 261118)**: `src/test/e2eDbSpecGuard.test.ts` 단위 테스트가 `e2e/db/*.spec.ts` 가 2개 이상이면 실패한다. `npm test`(CI Unit Test 단계)에서 돌아간다. 설정 로드 시점 체크 대신 단위 테스트를 고른 이유: 설정 로드는 E2E 실행 때만 일어나 CI 의 Unit Test 단계에서는 잡히지 않는다. 배경 → CHANGELOG 2026-11-18.
18. ~~Sentry/관측성 연동~~ → **완료(PR #192, 머지 `faa6c61`, 261123)**: `@sentry/nextjs` 10.78.0(Next 14.2.35). 클라이언트/서버/엣지 초기화 + `withSentryConfig`(DSN 없으면 비활성, `SENTRY_AUTH_TOKEN` 없으면 소스맵 업로드만 생략, 업로드 후 소스맵 삭제). `sendDefaultPii:false`·Replay 미사용, `src/lib/sentry/scrub.ts` 가 이벤트·breadcrumb·transaction(span·trace data URL/쿼리 포함)에서 이메일·패스코드·토큰·쿠키·본문을 제거. `tracesSampleRate` production 0.1·그 외 0. `src/lib/observability.ts` 의 `reportError`(로그+전송)·`logError`(로그만, 의도한 409 용)로 API 라우트 오류를 한 곳에서 수집, `(home)/error.tsx`·`global-error.tsx` 에서 captureException. 검증: lint·tsc·테스트 328개·빌드(DSN 있음/없음), CI(Lint·Unit·Build, E2E, Vercel) 통과, Preview 임시 라우트로 이벤트 도착(flush·noflush 둘 다)·마스킹·Request/User 비식별·route 태그·release 연결 확인(임시 라우트는 PR 에서 제거). Vercel 환경변수 4개(`NEXT_PUBLIC_SENTRY_DSN`·`SENTRY_AUTH_TOKEN`·`SENTRY_ORG`·`SENTRY_PROJECT`) 등록 완료(DSN 은 All Environments, 나머지는 Production·Preview). **남은 확인**: ① ~~머지 후 첫 Production 빌드 로그에서 소스맵 업로드 성공 여부~~ → **종결(261123, 사용자)**: Production(`bb1bd0f`) 빌드 로그에서 "Successfully uploaded source maps to Sentry" 확인, ② ~~홈 서버 컴포넌트 오류의 자동 수집~~ → **종결(261123, PR #193 Preview 검증)**: 홈 서버 컴포넌트가 던진 오류가 서버에서 원래 메시지로 자동 수집됨(Sentry TODAY-DATE-4, "Page Server Component"). `(home)/error.tsx` 의 클라이언트 `captureException` 이 같은 오류를 메시지가 가려진 채 중복 전송(TODAY-DATE-3)하던 것은 `error.digest` 가 있으면 건너뛰도록 해소(`reportBoundaryError`, 재확인에서 재발 없음)(DB 장애를 일으켜야 재현 — Next 14 에는 `onRequestError` 가 없다). → PROJECT_CONTEXT §20
19. ~~getDashboardStats 에러 경계 개선~~ → **완료(PR #193, 머지 `5cf5d82`, 261123)**: 정책 — 개수 쿼리 4개 중 하나라도 실패하면 전체 실패(throw) 유지(0개로 잘못 보이는 것보다 오류 화면이 낫다). 미리보기 제목 쿼리 4개는 실패해도 그 타일의 미리보기만 비우고 개수는 정상 반환 — 화면은 개수만 표시(모바일은 본문, 1024px 이상은 헤더; 새 문구·스타일 없음)하고, 실패한 쿼리는 `reportError` 로 쿼리별 Sentry 이슈(`[getDashboardStats] 미리보기 실패(<쿼리 이름>)`)가 된다. `/api/dashboard/stats` 도 같은 함수를 쓰므로 같은 규칙, 반환 타입 변경 없음. 함께 처리: `POST /api/auth/invite` 깨진 JSON → 400(`readJsonBody`), `server_error` 와 초대 메일 실패 `reportError`; `reportError` fingerprint `['{{ default }}', tag]`; 오류 경계 digest 중복 제거; `accountDeletion` 삭제 예외·`RESEND_FROM_EMAIL` 미설정·forgot 메일 발송 실패·`addCoupleUser`(23505 는 `logError`, 그 외 `reportError`) 보고. Preview 검증 완료(count 실패는 서버 자동 수집 이슈에만, 미리보기 실패는 TODAY-DATE-5~8 로 분리, 클라이언트 중복 재발 없음). → PROJECT_CONTEXT §20
    - ~~후속 후보: `POST /api/auth/forgot` 바깥 `catch {}`~~ → **완료(PR #194, 머지 `9dc5162`, 261124)**: `readJsonBody` 로 깨진 JSON 400, 실제 예외는 `reportError('[POST /api/auth/forgot]', e)` 후 기존 500. 사용자 열거 방지(스키마 실패·미가입·미인증 → `{ success: true }`)·토큰·메일 로직 불변, 이메일·토큰은 보고하지 않음. 단위 테스트 7개 추가
    - 후속 후보(Sentry, 낮음): npm install-scripts 경고 — `@sentry/cli`·`esbuild`·`msw`·`unrs-resolver` 가 `allowScripts` 미지정이다. 향후 npm 이 설치 스크립트를 기본 차단하면 설치가 깨질 수 있어 허용 목록 설정을 검토한다
    - 후속 후보(Sentry): 빌드 경고 `sentry.client.config.ts` → `instrumentation-client.ts` 이름 변경 권고는 Next 15.3+ 전용이다. Next 14 에서는 현행 유지하고 Next 업그레이드 때 함께 처리한다
20. ~~Android PWA 스플래시 하트–이름 간격~~ → **해소(PR #173, 261120)**: 아이콘 확대는 하트가 너무 커서 원복(PR #170). 대신 manifest `name` 을 `"\u200B"` 로 두어 로딩 화면 문구를 숨겼다(갤럭시 V3 실기기 확인, 아이콘 원본 유지). iOS 홈 화면 이름은 `apple-mobile-web-app-title` 로 고정. 남은 확인: 갤럭시 기존 설치 기기의 이름 변경 확인 창, 최근 앱 목록 이름, iPhone 새로 추가 시 이름 → PROJECT_CONTEXT §20
21. ~~Codex worktree 경로 미확정(261121 등록)~~ → **해소(261121)**: Codex 는 worktree 를 리포 밖 `$CODEX_HOME/worktrees`(기본 `~/.codex/worktrees`)에서 관리한다(Codex 공식 문서 developers.openai.com/codex/app/worktrees). 그래서 `AGENTS.md` 에서 처음 사본에 있던 리포 안 `.Codex/worktrees/<이름>` 언급을 지우고 이 사실로 바꿨다. 리포 안 `.claude/worktrees/` 는 Claude Code 전용이다(`.git/info/exclude` 에 등록돼 있음)
22. 상세 "추천 결과로"는 Link push라 브라우저 뒤로가기와 히스토리 동작이 다르다 — 문제 여부 미판단, 보류 (261121: 중복 번호 11 → 22 로 이동, 12~21 번호는 기존 참조 유지를 위해 그대로)
23. **실기기 확인 대기 — 갤럭시 앱 재설치 후 로딩 화면 하트 크기(화면 폭 약 12.5%) / 홈 아이콘 유지 확인(261121, PR #181)**: 프로덕션에서 기존 앱을 지우고 다시 설치한 뒤 홈 아이콘으로 실행해 확인한다. 로딩 하트가 화면 폭의 약 12.5%(360dp 폭 기기는 약 13%)이고, 홈 화면 아이콘이 이전과 같은 모습(icon-192, 하트 52%)이면 종결. 크롬 메뉴·설치 직후 "열기"로 실행했을 때 이름이 보이는 다른 로딩 화면이 뜨는지도 함께 보면 이전 7% 화면의 경로를 가릴 수 있다(→ CHANGELOG 2026-11-21 v5)
    → 확인 후 PROJECT_CONTEXT §20 의 PR #173 설명('\u200B 덕분에 문구가 사라졌다')을 실기기 결과에 맞게 정리(Android 12+ WebAPK 로딩 화면에 원래 제목이 없는지, '홈 화면에 추가' 바로가기 방식에서는 제목이 나오는지 함께 기록)
24. **선택·컨트롤 눌림 피드백 완료(PR #186, 261122)** — 폼 선택 옵션, 목록 탭·필터 토글·초기화, 날짜/시간 지우기(0.97)는 사용자 iPhone 확인 완료. 홈 파트너 안내 링크(0.98)는 SOLO 상태에서만 노출되어 실기기 미확인. 정적 안내는 적용 대상에서 제외했다.
25. **버튼·컨트롤 높이 기준 재검토 — 채움 면 보정 완료, 크기 프리셋 정리 보류(261122)**. 공용 `Button`의 배경을 박스 끝까지 칠해 36px·40px 채움 면을 outline 높이와 맞췄다. 확인 다이얼로그는 화면 폭에 따라 배치가 달라져도 두 버튼 모두 36px이며, 검색·방문 예정·방문 기록의 풀폭 단독 제출은 40px이다. 액션 크기 프리셋과 전체 Tier 문구 정리는 후속으로 남긴다. 검증은 CHANGELOG 2026-11-22 v3 참고.
26. **시드니 Supabase 프로젝트·dump 파일·`.env.migration` 삭제 — 261129 예정(261122 등록, PR #184 후속)**: 컷오버 후 1주는 롤백용으로 보관한다(롤백 절차 → CHANGELOG 2026-11-22 v2). 261129 에 ① 시드니 프로젝트 `xxqfiipzljkjstkgtawj` 삭제(사용자, 대시보드) ② 원래 작업 폴더 루트 `.migration/`(dump — 운영 데이터 포함, git 무시) 삭제 ③ 리포 루트 `.env.migration`(DB 접속 문자열, `.git/info/exclude`) 삭제. 그 전에 롤백이 필요해지면 이 세 가지가 모두 있어야 한다. 참고: `.env.migration` 비밀번호는 대시보드 템플릿의 `[ ]` 가 남은 형태라 스크립트가 벗겨 쓴다.

**그 외 남은 작업**
- ~~worktree 가 리포 안(`.claude/worktrees`)에 있으면 로컬 `npm run lint` 가 상위 `.eslintrc.json` 과 충돌해 실패(261121 확인)~~ → **해소(PR #179, 261121)**: `.eslintrc.json` 에 `"root": true` 추가. 이제 worktree 에서도 `npm run lint` 를 그대로 쓴다(`--no-eslintrc -c` 우회 불필요). 규칙 집합 변화 없음(99개 동일)
- **`chore/capacitor-init` → `main` 최종 머지**: PR #111~#116 모두 병합 완료 상태지만, 전체
  Capacitor 네이티브 셸 자체를 `main`(프로덕션 배포 소스)에 반영할지는 아직 사용자 확인 전 —
  머지 시점·방식(ff-only/squash)은 별도로 지시받아 진행할 것. `main`이 그 사이 커플 계정 전환
  (PR #118~127) + 닉네임 설정(PR #128)으로 크게 앞서 나갔으므로, 실제 머지 시도 전에
  diverge 범위(특히 `middleware.ts`·`src/app/api/auth/*`)를 다시 살펴야 함
- **파트너 계정으로의 실 로그인 테스트 미실시(PR #128)**: `/partner/info`의 "닉네임+이메일 동시
  노출"은 상대 계정 이메일을 몰라(조회가 Production Reads 가드에 막힘) 사용자 승인 하에 실 로그인
  검증을 생략하고 코드 레벨 검토로 대체함. 실제 두 계정 교차 확인이 필요하면 상대 이메일을 받아
  별도로 진행할 것
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
- ~~PR #108(되돌리기 확인 다이얼로그 통일) 브라우저 실행 검증~~ → **종결(261122)**: 4개 지점 다이얼로그 노출→확인→재전환 시 기존 별점/후기/방문일 프리필까지 사용자 실기기 확인 완료
- ~~PR #106(액션 버튼 Tier 통일) 실기기 확인~~ → **보류 25번으로 이관(261122)**: Production 모바일 375px 실측 박스 높이는 SKILL 과 일치(액티비티·다이닝 등록 40/40, 홈 검색 40, 방문기록 저장 40, 되돌리기 확인 36/36). 단 되돌리기 확인(`RevertConfirmDialog`)의 채움 버튼은 `.detailPrimaryBtn` 미사용으로 background-clip 보정이 빠져 보이는 면 34px(outline 취소는 36px) — 사용자가 높이 차이로 관찰
- 아이콘 버튼 크기 통일: 28px 쌍(`mapActionBtn`)은 PR #133으로, 색·stroke는 PR #135로 정리됨. 헤더(`headerNavBtn`) 40/22·카드 ⋮(`iconBtn`) 36/20 박스는 여백 비율 기준으로 재정의됨(261013, SKILL §7). FAB 56px·다이얼로그 닫기는 위 보류 2~4번과 PROJECT_CONTEXT §19 그룹 5 참고. 위저드 "처음부터"/"홈으로" 구현 방식 불일치(ghost 버튼 vs 텍스트 링크)는 PR #106 범위 밖으로 분리된 채 미판단
- 다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E — `/places/[id]` 상세는 서버
  컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가, 카드 returnTo·결과 캐시 복원
  검증으로 대체(실제 왕복은 기존 아이폰 실기기 수동 검증으로 확인됨)
- Android 스플래시 실기기 홈 화면 확인(다크모드 포함), Galaxy 실기기 QA — 하드웨어 미확보로 보류
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화 정리(PR #95의 `emptyToNull`
  재사용 여지) — PR #95 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류

## 알려진 이슈 — PWA 상단 로딩바 흐림

- **증상**: iOS 27.0.1(2026-10-21 업데이트)에서 홈 화면에 추가한 PWA(standalone)에서만 상단 로딩바(`#nprogress .bar`)가 반투명 레이어에 가려진 듯 흐리게 보임. Safari 탭·PC/모바일 크롬에서는 정상.
- **원인 판단**: 저장소 변경이 아니라 iOS 쪽 동작으로 봄. 최근 3주간 manifest·viewport/themeColor·`apple-mobile-web-app-*` 메타·서비스워커·Capacitor 설정 변경 없음(`apple-mobile-web-app-status-bar-style`은 미지정, 기본값 사용 중). 배경색 작업(#146·#147·#150)과도 무관.
- **실기기 진단 결과**(Vercel 프리뷰 PWA, 안전영역 아래 위치별 2px 고정 바 비교): +0 거의 안 보임 / +8 흐림 / +24 약간 부드러움 / +48·+96 선명. 스크롤되는(absolute) 줄과 하단 고정 줄은 처음 진단에서 선명했으나 +120 위치라 구간 밖이어서였음. 이후 absolute를 +8에 두고 다시 확인하니 흐림 — 고정 여부가 아니라 상태바 아래 약 20pt 구간 자체가 문제.
- **시도한 수정과 보류 사유**: 바를 `safe-area-inset-top + 28px` 로 내리면 선명해지지만 홈·리스트 헤더(로고·아이콘 줄)와 바짝 붙어 보여 레이아웃을 해침 → 반영 보류. `apple-mobile-web-app-status-bar-style` 명시는 기본값과 같을 가능성이 커 시험하지 않음.
- **참고**: 바 끝의 사선 글로우는 nextjs-toploader 기본 효과(`.peg` box-shadow)이며 `<NextTopLoader shadow={false}>` 로 끌 수 있음(미반영). 진단·시험은 `fix/pwa-status-bar-overlay` 브랜치(마지막 커밋 `0c607d1`)에서 했고 머지 없이 삭제함.
- **완화 적용(PR #155, 2026-10-26)**: 위치는 그대로 두고 standalone 에서만 바 두께 3px(라이트·다크 공통), standalone+다크에서만 색 `#c084fc`. 색 후보 비교와 근거는 CHANGELOG 2026-10-26 항목. **3px 유지로 확정(261121 사용자 실기기 확인)** — 4px 상향은 하지 않는다.
- **재개 조건**: 이후 iOS 업데이트에서 구간이 바뀌었는지 재확인, 또는 헤더 상단 여백을 늘리는 디자인 변경을 할 때 바를 +24~28px 로 내리는 안을 함께 검토.
