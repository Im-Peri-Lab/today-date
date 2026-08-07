# CURRENT_STATE.md

> **마지막 업데이트: 2026-08-05**

## 현재 단계
유지보수 / 점진적 UX 개선 단계 + Capacitor 네이티브 앱 초기화 진행 중.

## 현재 한 줄 요약
자동화 테스트·CI 도입(PR #91) + P2 리팩터 배치(PR #93~95: dark/hover/focus 정합화, 추천위저드
히스토리 공통화, 폼-API 검증 정합화) + `/list` 다녀온 곳 정렬 보정(PR #99) + 네이밍 용어 매핑
SKILL.md 반영(PR #100) + 기술 백로그 그룹 1("다크 hover 2계열 분리 검토") 진단 후 종결(PR #101)
모두 병합 완료, main 기준 build PASS. 이어서 기술 백로그 그룹 3(위저드 h1·카드 그리드·spacing
토큰·`/list` prefetch) 4건을 실측·분류 — 카드 그리드 의도된 예외 문서화(SKILL §3-B) + 뱃지
spacing 토큰화(`--s-badge-padding-*-info`/`-status`) PR #103 squash 머지 완료. 상세 → CHANGELOG
2026-07-30. 이어서 Capacitor 8.x iOS/Android 네이티브 앱 셸 초기화 + 브랜드 아이콘/스플래시 반영을
`chore/capacitor-init` 브랜치에서 완료, 실기기 확인 후 머지 예정. 상세 → CHANGELOG 2026-08-05.

## 브랜치 상태
- `chore/capacitor-init` — Capacitor 네이티브 셸 초기화·아이콘/스플래시 반영 완료, 실기기 확인 후 PR 예정
- main 기준 build PASS (PR #103 `a89817e` 기준)

## 최근 구현 완료
- 자동화 테스트·CI, dark/hover/focus 정합화, 추천위저드 History/URL 동기화 공통 훅, 폼-API
  입력 검증 공유 → 상세 CHANGELOG 2026-07-29. 전체 누적 기능 목록은 PROJECT_CONTEXT §5 참조
- `/list` 다녀온 곳 정렬을 방문일·최종수정일 기준으로 보정(PR #99), 코드 식별자/노출 라벨 네이밍
  용어 매핑을 SKILL.md에도 pointer로 추가(PR #100), 기술 백로그 그룹 1 진단·종결 — dead
  `dark:` 클래스 완전 제거·SKILL.md 정정(PR #101) → 상세 CHANGELOG 2026-07-30
- 기술 백로그 그룹 3 실측 4건(위저드 h1=stale 종결, `/list` prefetch=SKILL §12 확정 규칙과 충돌해
  보류) + 카드 그리드 의도된 예외 문서화·spacing 토큰화 2건 PR #103 squash 머지(`a89817e`) →
  상세 CHANGELOG 2026-07-30
- Capacitor 8.x iOS/Android 네이티브 앱 셸 초기화, 브랜드 하트 아이콘·스플래시 반영, iOS 아이콘
  배경색 수정(`chore/capacitor-init`, 미머지) → 상세 CHANGELOG 2026-08-05

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #103 기준 `a89817e`)

## 진행 중 / 남은 작업
- **`chore/capacitor-init` 머지 전 실기기 확인**: iPhone 홈 화면 아이콘(라벤더 배경·하트)·스플래시
  실사용 확인, Android 실기기 확인(Galaxy 미확보로 보류 중)
- 다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E — `/places/[id]` 상세는 서버
  컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가, 카드 returnTo·결과 캐시 복원
  검증으로 대체(실제 왕복은 기존 아이폰 실기기 수동 검증으로 확인됨)
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화 정리(PR #95의 `emptyToNull`
  재사용 여지) — PR #95 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류
