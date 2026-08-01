# CURRENT_STATE.md

> **마지막 업데이트: 2026-08-01**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
자동화 테스트·CI 도입(PR #91) + P2 리팩터 배치(PR #93~95: dark/hover/focus 정합화, 추천위저드
히스토리 공통화, 폼-API 검증 정합화) + `/list` 다녀온 곳 정렬 보정(PR #99) + 네이밍 용어 매핑
SKILL.md 반영(PR #100) + 기술 백로그 그룹 1·3 진단·처리(PR #101·#103: dark hover 진단 종결,
카드 그리드 의도된 예외 문서화, 정보 뱃지 spacing 토큰화) 모두 병합 완료. 이어서 `.mealBadge`
텍스트 색 대비 보정(PR #105) + Primary·그 외 액션 버튼 전수조사 2회로 액션 버튼 높이를 Tier
A(40px)/Tier B(36px) 두 단계로 통일(PR #106) 병합 완료. 사용자 스크린샷 관찰로 "가보고 싶은
곳으로 되돌리기" 확인 다이얼로그가 4곳 중 1곳(ActivityDetail)에만 있던 불일치를 발견·진단해
`RevertConfirmDialog` 공유 컴포넌트로 통일(PR #108), 되돌리기 patch도 4곳 모두 필드 보존형으로
정정 병합 완료, main 기준 build PASS. 상세 → CHANGELOG 2026-08-01.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS
- PR #108(`fix/revert-to-wishlist-consistency`) squash 머지 완료(`70b7d09`), 원격 브랜치 정리 완료. PR #106(`design/button-tier-consolidation`)도 squash 머지 완료(`3a05c31`), PR #105(`design/meal-badge-color-ink`)도 squash 머지 완료(`ace0e3c`)

## 최근 구현 완료
- 자동화 테스트·CI, dark/hover/focus 정합화, 추천위저드 History/URL 동기화 공통 훅, 폼-API
  입력 검증 공유 → 상세 CHANGELOG 2026-07-29. 전체 누적 기능 목록은 PROJECT_CONTEXT §5 참조
- `/list` 다녀온 곳 정렬을 방문일·최종수정일 기준으로 보정(PR #99), 코드 식별자/노출 라벨 네이밍
  용어 매핑을 SKILL.md에도 pointer로 추가(PR #100), 기술 백로그 그룹 1 진단·종결 — dead
  `dark:` 클래스 완전 제거·SKILL.md 정정(PR #101) → 상세 CHANGELOG 2026-07-30
- 기술 백로그 그룹 3 실측 4건(위저드 h1=stale 종결, `/list` prefetch=SKILL §12 확정 규칙과 충돌해
  보류) + 카드 그리드 의도된 예외 문서화·spacing 토큰화 2건 PR #103 squash 머지(`a89817e`) →
  상세 CHANGELOG 2026-07-30
- `.mealBadge` 텍스트 색을 `--s-sub`→`--s-ink`로 승격해 같은 화면 `DetailRow` 값과 대비 위계를
  맞춤(PR #105), Primary(보라) 버튼 15곳 + 그 외 액션 버튼 전수조사 2회를 근거로 액션 버튼 높이를
  Tier A(40px, 화면/다이얼로그 풀폭 핵심 액션)/Tier B(36px, 인라인·컨텍스트 보조 액션) 두 단계로
  통일, 48px였던 4개 지점 정렬 + SKILL §4-A 전면 재작성(PR #106) → 상세 CHANGELOG 2026-07-31
- 되돌리기 확인 다이얼로그 4곳 통일(PR #108) — ActivityDetail에만 있던 다이얼로그를
  `RevertConfirmDialog` 공유 컴포넌트로 추출해 ActivityCard/PlaceDetail/PlaceCard ⋮ 메뉴까지 적용,
  patch를 4곳 모두 `{ status: 'wishlist' }`만 전송하도록 정정(별점/후기/방문일 보존, 재전환 시
  `VisitedDialog` 프리필). 다이얼로그 문구 "방문기록(방문일, 별점, 후기)이 모두 삭제됩니다."로
  확정. SKILL.md §4-A·§4-B·§10-H·§12-A 동시 갱신 → 상세 CHANGELOG 2026-08-01

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #108 기준 `70b7d09`)

## 진행 중 / 남은 작업
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
- Android 스플래시 하트 실기기 홈 화면 확인, Galaxy 실기기 QA — 하드웨어 미확보로 보류
- `ActivityDetail.tsx`/`PlaceDetail.tsx`의 `onSaveInfo` 정규화 정리(PR #95의 `emptyToNull`
  재사용 여지) — PR #95 범위(ActivityForm/PlaceForm) 밖이라 의도적으로 보류
