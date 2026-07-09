# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-09**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
로딩 인디케이터 일관성 정리 3개 브랜치(PR #55~57) main 반영 완료. 기술 부채 3건 + 전수 진단 발견 부가 버그 2건 + 위중 액션 스피너 보강 3건 + SKILL.md §12·§12-A 동기화까지 마무리. main 최신(`b9bc557`), Vercel production 반영, 작업트리 clean.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) 로딩·액션 피드백 위계**: 화면전환=topLoader / 제자리=버튼상태 / 되돌릴 수 없음·소요시간 김=스피너 병기. 구체 스펙 → SKILL §12·§12-A

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (최신 `b9bc557`)

## 진행 중 / 남은 작업
- 사용자 요청 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — Analysis Mode 설계 권장
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 하드웨어 미확보로 보류 중

## 알려진 이슈 · 기술 부채
- 생성 로직(활동/장소)이 훅으로 추출되지 않고 두 폼(ActivityForm/PlaceForm)에 raw fetch로 인라인 중복 존재 — 리스트 캐시 무효화(`invalidateQueries`) 로직도 두 파일에 복붙돼 향후 drift 위험. update/delete는 훅(useUpdate*/useDelete*)으로 통일돼 있으나 생성만 미추출. useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중). ※ 과거 "활동 vs 장소 비대칭" 서술은 현재 두 폼이 거울 구조로 대칭화되어 outdated — 260709 실측 정정
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용). DeleteConfirmDialog의 스피너는 이 경로에서 dead state이나 무해 — 상세 삭제 경로에서는 정상 작동 (260709 확인, SKILL §12-A 문서화)
- (이전 세션 잔여) 검색/필터 URL 동기화, returnTo 배선, spacing 토큰 표준화 등