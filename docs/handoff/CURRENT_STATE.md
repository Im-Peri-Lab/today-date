# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-29**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
P2 리팩터 배치 3건 병합 완료(PR #93~95) — dark/hover/focus 상태 정합화(기술 백로그 그룹 1
2/3·그룹 2 종결), 추천위저드 History/URL 동기화 공통 훅 추출, 활동·다이닝 폼-API 입력
검증 정합화(잘못된 API 입력 400 응답 통일). 상세 → CHANGELOG 2026-07-29 v2.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) 추천위저드 뒤로가기 정합성 확보** — 단계별 URL 히스토리 + 선택값 유지(PR #88),
  returnTo 확장·상세 복귀 라벨 분기·상단 버튼 리셋 통일·결과 캐시 복원(PR #89), 위저드
  1단계 버튼 "홈으로"/2단계 이상 "처음부터" 분기(PR #90) → 상세 CHANGELOG 2026-07-28
- **(신규) 자동화 테스트·CI 도입(PR #91)** — Vitest 단위 테스트(위저드 URL 파싱/직렬화, 결과
  캐시, returnTo 화이트리스트) + Playwright E2E(활동 위저드 뒤로가기, 다이닝 위저드 결과 캐시
  복원), `.github/workflows/ci.yml`(lint/test/build + e2e job) → 상세 CHANGELOG 2026-07-29
- **(신규) dark/hover/focus 상태 정합화(PR #93)** — shadcn Button의 죽은 `dark:` 클래스 제거,
  Button 전 variant focus-visible 링을 `--s-focus-ring` 토큰(다크 대응)으로 통일,
  `.detailDeleteBtn` 라이트 hover 불투명도를 공용 토큰과 정합화 → 상세 CHANGELOG 2026-07-29 v2
- **(신규) 추천위저드 History/URL 동기화 공통화(PR #94)** — `useWizardUrlSync` 훅 +
  `wizardUrl.ts` 유틸(pushWizardUrl/replaceWizardUrl/currentWizardUrl)로 활동·다이닝 위저드의
  중복 로직 추출, URL 파라미터·캐시 정책·사용자 동작 무변경 → 상세 CHANGELOG 2026-07-29 v2
- **(신규) 폼-API 입력 검증 정합화(PR #95)** — `apiFields.ts` 공유 Zod 스키마로 activities·
  places의 create/patch 필드 검증 중복 제거, GET 쿼리 파라미터 검증 추가, 손상된 JSON
  본문·비정상 응답을 500 대신 400/안전 처리로 통일 → 상세 CHANGELOG 2026-07-29 v2

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #95 기준 `f2055eb`)

## 진행 중 / 남은 작업
- **다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E** — `/places/[id]` 상세는
  서버 컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가로 판단, 카드 returnTo
  href 검증 + 결과 캐시 복원 검증으로 대체. 실제 상세 화면 왕복은 수동 QA로 유지(기존
  아이폰 실기기 검증에서 이미 확인됨)
- Android 스플래시 하트(PR #87) 실기기 홈 화면 추가 후 확인 — Android 기기 미확보로 보류
- Galaxy 실기기 QA — 하드웨어 미확보로 보류 중
- **기술 백로그 그룹 1 잔여 1건("다크 hover 2계열 분리 검토")** — 다음 착수 후보(그룹 1의
  나머지 2건·그룹 2는 PR #93로 해소, 아래 "알려진 이슈" 참조)
- 기술 백로그 그룹 3(레이아웃 구조, 우선순위 가장 낮음) — 순차 진행
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화(`values.x || null`)를
  PR #95의 `emptyToNull`로 정리 — 이번 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류
- (이하 기존 항목 유지)

## 알려진 이슈 · 기술 부채

### 그룹 1 — 죽은 코드/토큰 정리 → **2/3 항목 해소 (2026-07-29, PR #93)**
- ~~죽은 `dark:` 변형 점검~~ → 해소: `button.tsx`의 `.dark` 클래스 미적용 dead `dark:` 클래스
  3곳(aria-invalid·ghost hover·destructive focus ring) 제거. `select.tsx`/`tabs.tsx`에도 동일
  패턴이 있으나 앱 어디서도 import되지 않는 미사용 컴포넌트로 확인, 범위 제외
- ~~`.detailDeleteBtn` 라이트 hover 불일치 검토~~ → 해소: 공용 토큰(`--s-destructive-soft-bg`,
  `/0.10`)으로 통일. 라이트 시각이 옅어지는 변경(`/0.15`→`/0.10`)이라 사용자 사인오프 받아 적용
- **다크 hover 2계열 분리 검토 — 미착수, 다음 착수 후보로 이월**

### 그룹 2 — 포커스 접근성 → **종결 (2026-07-29, PR #93)**
- 진한 배경 Primary 버튼 focus 가시성(이중 링 검토) — shadcn Button 전 variant(default·
  secondary·outline·ghost·link·destructive)의 focus-visible 링을 `--s-focus-ring` 토큰(다크
  대응)으로 통일. Primary처럼 채움색이 보라 계열(`#7c3aed`)인 버튼이 다크에서 링과 겹쳐 안
  보이던 문제 해소. Playwright로 라이트/다크 각각 정확한 색(box-shadow computed style)으로
  전환됨을 실측 검증

### 그룹 3 — 레이아웃 구조 (우선순위 가장 낮음)
- 위저드 h1 수렴 검토
- 카드 그리드 구현 방식 통합 검토(`/list` CSS Grid vs 추천 결과 flex 중복, 렌더 결과 동일해 실익 낮음)

### 그룹 4 — 네비게이션 라벨 잔여 검토 → **종결 (2026-07-28)**
- "이전"(스텝 하단)·"취소"(다이얼로그)·신규등록 조건부 라벨 3건 모두 진단 결과 SKILL §13
  규칙에 이미 부합 또는 명시적 배제 대상으로 확인, 코드 수정 불필요. 상세 → CHANGELOG 2026-07-28

- iOS PWA 스플래시에는 하트 미반영(범위 제외, PR #87)
- (이하 기존 항목 유지)
