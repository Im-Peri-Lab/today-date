# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-29**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
자동화 테스트·CI 도입(PR #91) + P2 리팩터 배치(PR #93~95: dark/hover/focus 정합화, 추천위저드
히스토리 공통화, 폼-API 검증 정합화) 병합 완료. 상세 → CHANGELOG 2026-07-29.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 최근 구현 완료
- 자동화 테스트·CI, dark/hover/focus 정합화, 추천위저드 History/URL 동기화 공통 훅, 폼-API
  입력 검증 공유 → 상세 CHANGELOG 2026-07-29. 전체 누적 기능 목록은 PROJECT_CONTEXT §5 참조

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #97 기준 `00c0b01`)

## 진행 중 / 남은 작업
- 다이닝 위저드 "상세 화면 → 추천 결과로 복귀" 실제 왕복 E2E — `/places/[id]` 상세는 서버
  컴포넌트가 Supabase를 직접 조회해 DB 없이는 자동화 불가, 카드 returnTo·결과 캐시 복원
  검증으로 대체(실제 왕복은 기존 아이폰 실기기 수동 검증으로 확인됨)
- Android 스플래시 하트 실기기 홈 화면 확인, Galaxy 실기기 QA — 하드웨어 미확보로 보류
- 다음 착수 후보: "다크 hover 2계열 분리 검토" → 기술 백로그는 PROJECT_CONTEXT §19 참조
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화 정리(PR #95의 `emptyToNull`
  재사용 여지) — PR #95 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류
