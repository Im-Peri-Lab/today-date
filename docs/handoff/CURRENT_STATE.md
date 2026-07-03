# Today Date — CURRENT_STATE
> 마지막 업데이트: 2026-07-02

## 현재 한 줄 요약
P0 버그 2건(시간대 디폴트·added_by 제거)을 잡고, 지역(area)/실제 위치(location) 개념을 분리한 뒤 활동·장소에 위치 필드 + 지도 앱 연동(네이버·구글·카카오·티맵)을 붙였습니다. 마이그레이션 003·004·005 모두 원격 적용 완료. 현재 작업 브랜치 없음, main 최신·배포 완료.

## 브랜치 상태
- `fix/activity-time-of-day-default` → main 머지 완료
- `fix/detail-registered-by-label` → PR #35 squash(`f0349f7`)
- `refactor/rename-location-to-area` → PR #36 squash(`263290a`)
- `feat/add-location-map-link` → PR #37 squash(`e9c6cf2`, 12커밋)
- `dc29e8f`(위치 빈 상태) → main 직접 푸시(브랜치 없이. 다음부터 PR 경유 권장)
- 현재 작업 브랜치 없음, main 기준 build/type/lint PASS

## 필드 개념 — area vs location (확정)
| 필드 | 의미 | 화면 라벨 | 대상 | 추천 사용 |
|---|---|---|---|---|
| area | 추천 범위용 지역 태그(성수/홍대) | 지역 | places만 | O(필터) |
| location | 지도 검색용 실제 위치(상호명·관광지·주소) | 위치 | activities·places | X(표시·지도용) |

## 장소 필드 순서 표준 (확정)
제목 → 카테고리 → 식사시간 → 지역(area) → 위치(location) → 메모 → 참고링크
(활동은 제목 → 카테고리 → 소요시간 → 시간대 → 위치 → 메모 → 참고링크, 입력·상세 이미 일치)

## 지도 연동 구조
- config: `lib/map.ts` MAP_APPS 배열(네이버·구글·카카오·티맵). 확장은 항목 추가만
- requiresApp: 앱스킴 전용 앱(티맵) 데스크탑 숨김 + 모바일 미설치 토스트
- 기억: `useMapAppPreference`(localStorage, 기본 naver)
- UI: MapLink — 위치 텍스트(비링크) + 우측 지도 아이콘/▾ 앱 선택 시트
- 위치 미입력 시: "아직 위치가 없어요" faint 빈 상태 표시

## 다음 작업 후보
- 사용자 요청 5번 복사 생성(기존 항목 복사해 새로 생성, DB 무변경) — 로드맵상 다음
- 사용자 요청 7번 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — DB 변경 그룹, 신중 설계

## 진행 중 / 남은 작업 · 기술 부채
- 뱃지 크기 통일: mealBadge(~25px) vs visitedTag(~22px) 불일치. mealBadge에 앵커해 통일 + 식사시간 아이콘 정렬 함께 정리(별도 브랜치)
- SKILL.md 갱신: mapActionBtn(28px, 3번째 유틸 버튼 크기)·MapLink 정렬 패턴 문서화
- 실기기 QA: ①모바일 티맵 열림/미설치 토스트 ②데스크탑 ▾ 티맵 숨김 ③라이트/다크·모바일/데스크탑 위치 행 정렬 ④지도 4종 검색
- (이전 세션 잔여) 추가 플로우 returnTo 배선, 검색/필터 URL 동기화, spacing 토큰 표준화 등