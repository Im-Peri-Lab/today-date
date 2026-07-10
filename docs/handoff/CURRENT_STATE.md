# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-10**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
activity 방문 기간(시작~종료) 입력 기능 반영 완료(PR #58 squash `a618107`). 신규 스위치 토글(VisitPeriodToggle) + 카드 날짜 포맷 activity/place 통일(YY.MM.DD, 요일 생략) + SKILL.md §4-B·§8-A 동기화까지 마무리. main 최신(`a618107`), 마이그레이션 006 Supabase 원격 적용 완료, 작업트리 clean.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) activity 방문 기간 입력**: `visited_end_at` 컬럼(activities만) 추가, 신규 스위치 컴포넌트(`VisitPeriodToggle`)로 시작일/종료일 토글 입력. 종료일 없으면 단일 날짜와 100% 동일 동작. 구체 스펙 → SKILL §4-B
- **(신규) 카드 날짜 포맷 통일**: activity·place 리스트 카드 모두 `YY.MM.DD`(요일 생략) 문법으로 통일, 상세화면은 기존 요일 포함 풀포맷 유지. 3열 데스크탑에서 기간 표시 2줄 감김은 실측 근거로 의도적 수용 확정. 구체 스펙 → SKILL §8-A

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (최신 `a618107`)

## 진행 중 / 남은 작업
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 하드웨어 미확보로 보류 중
- useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중)

## 알려진 이슈 · 기술 부채
- 생성 로직(활동/장소)이 훅으로 추출되지 않고 두 폼(ActivityForm/PlaceForm)에 raw fetch로 인라인 중복 존재. update/delete는 훅으로 통일돼 있으나 생성만 미추출.
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용). DeleteConfirmDialog의 스피너는 이 경로에서 dead state이나 무해.
- (이전 세션 잔여) 검색/필터 URL 동기화, returnTo 배선, spacing 토큰 표준화 등