# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-29**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
프로젝트 최초로 자동화 테스트·CI 도입(`test/recommend-navigation-regression`, PR 병합 대기) —
추천위저드(PR #88~90) 네비게이션 회귀 방지용 Vitest 단위 테스트 42건 + Playwright E2E 2건,
`.github/workflows/ci.yml` 신규. 상세 → CHANGELOG 2026-07-29.

## 브랜치 상태
- 작업 브랜치: `test/recommend-navigation-regression` (main에서 분기, PR 생성 후 병합 대기)
- main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) 추천위저드 뒤로가기 정합성 확보** — 단계별 URL 히스토리 + 선택값 유지(PR #88),
  returnTo 확장·상세 복귀 라벨 분기·상단 버튼 리셋 통일·결과 캐시 복원(PR #89), 위저드
  1단계 버튼 "홈으로"/2단계 이상 "처음부터" 분기(PR #90) → 상세 CHANGELOG 2026-07-28
- **(신규) 자동화 테스트·CI 도입** — Vitest 단위 테스트(위저드 URL 파싱/직렬화, 결과 캐시,
  returnTo 화이트리스트) + Playwright E2E(활동 위저드 뒤로가기, 다이닝 위저드 결과 캐시
  복원), `.github/workflows/ci.yml`(lint/test/build + e2e job) → 상세 CHANGELOG 2026-07-29

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #90 기준 `6024119`)

## 진행 중 / 남은 작업
- **`test/recommend-navigation-regression` PR 병합** — Draft PR 생성, Vercel Preview 확인 후
  병합 대기(자동 병합 금지 정책에 따라 병합은 별도 승인 필요)
- **다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E** — `/places/[id]` 상세는
  서버 컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가로 판단, 카드 returnTo
  href 검증 + 결과 캐시 복원 검증으로 대체. 실제 상세 화면 왕복은 수동 QA로 유지(기존
  아이폰 실기기 검증에서 이미 확인됨)
- **PR #89·#90 아이폰 실기기 스와이프 뒤로가기 최종 실측** — 미실행(세션 중 프리뷰 단계
  생략), 다음 세션 권장
- Android 스플래시 하트(PR #87) 실기기 홈 화면 추가 후 확인 — Android 기기 미확보로 보류
- Galaxy 실기기 QA — 하드웨어 미확보로 보류 중
- **기술 백로그 그룹 1(토큰/hover 정리)** — 다음 착수 후보, 진단부터 시작 예정
- 기술 백로그 그룹 2(focus 접근성), 그룹 3(레이아웃 구조) — 그룹1 이후 순차 진행
- (이하 기존 항목 유지)

## 알려진 이슈 · 기술 부채

### 그룹 1 — 죽은 코드/토큰 정리 (다음 착수 후보)
- 죽은 `dark:` 변형 점검
- `.detailDeleteBtn` 라이트 hover 불일치 검토
- 다크 hover 2계열 분리 검토

### 그룹 2 — 포커스 접근성
- 진한 배경 Primary 버튼 focus 가시성(이중 링 검토)

### 그룹 3 — 레이아웃 구조 (우선순위 가장 낮음)
- 위저드 h1 수렴 검토
- 카드 그리드 구현 방식 통합 검토(`/list` CSS Grid vs 추천 결과 flex 중복, 렌더 결과 동일해 실익 낮음)

### 그룹 4 — 네비게이션 라벨 잔여 검토 → **종결 (2026-07-28)**
- "이전"(스텝 하단)·"취소"(다이얼로그)·신규등록 조건부 라벨 3건 모두 진단 결과 SKILL §13
  규칙에 이미 부합 또는 명시적 배제 대상으로 확인, 코드 수정 불필요. 상세 → CHANGELOG 2026-07-28

- iOS PWA 스플래시에는 하트 미반영(범위 제외, PR #87)
- (이하 기존 항목 유지)
