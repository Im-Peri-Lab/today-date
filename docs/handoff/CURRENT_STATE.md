# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-13**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
홈 검색 바로가기(PR #64) + 필터 토글 셰브런·로딩 버튼 스피너 통일(PR #65) 반영 완료. main 최신(`ea9df08`), 작업트리 clean.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) 홈 검색 바로가기**: 홈 상단바에 검색 아이콘 추가, 오버레이에서 검색어 입력 → 활동/장소 매치 존재 여부로 탭 자동 판정 → `/list`로 이동(검색어 prefill). 판정 규칙: 한쪽만 매치→그 탭, 둘 다·둘 다 없음→activity 기본. 기존 `/list` 검색 API·EmptyState 재사용, 신규 엔드포인트 없음 (PR #64 squash `1f70691`)
- **(신규) 필터 토글 셰브런**: `/list` 필터 버튼에 ChevronDown 고정 표시, 기존 드롭다운 관례 준수 (main 직접 `1339f3e`). 구체 스펙 → SKILL §7
- **(신규) 로딩 버튼 스피너 통일**: 로딩 중인 모든 버튼에 텍스트 앞 스피너 병기 원칙으로 전환, §12-A "아이콘 숨김" 예외 폐지 (PR #65 squash `ea9df08`). 대상 목록·배치 규칙 → SKILL §12-A

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (최신 `ea9df08`)

## 진행 중 / 남은 작업
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 하드웨어 미확보로 보류 중
- useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중)
- 카드 그리드 구현 방식 통합 검토(list=Grid vs 추천=flex 중복, 렌더 동일해 우선순위 낮음)
- 검색/필터 URL 동기화(`/list` 내부 타이핑 중 URL 동기화는 여전히 미구현, 홈→list 진입 시 `q` 초기값 읽기만 반영됨)
- returnTo 플로우 배선(리스트→추가→등록→상세→목록 왕복) 미완
- 헤더 아이콘(홈/검색/햄버거) 간격 축소 검토 — 진단 완료(탭타깃 44px 구조상 padding 축소 불가, gap 4px→0px만 안전하게 가능·그 이상은 탭타깃 자체 축소 필요), 방향 결정 대기 중

## 알려진 이슈 · 기술 부채
- 생성 로직(활동/장소)이 훅으로 추출되지 않고 두 폼(ActivityForm/PlaceForm)에 raw fetch로 인라인 중복 존재. update/delete는 훅으로 통일돼 있으나 생성만 미추출.
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용). DeleteConfirmDialog의 스피너는 이 경로에서 dead state이나 무해.
- 카드 그리드가 `/list`(CSS Grid)와 추천결과 2종(flex-wrap 하드코딩 중복)으로 비공유 구현 — 렌더 결과는 동일해 시급하진 않음
- (이전 세션 잔여) returnTo 배선, spacing 토큰 표준화 등