# Today Date — CURRENT_STATE
> 마지막 업데이트: 2026-07-06

## 현재 한 줄 요약
지역(area)/실제 위치(location) 분리와 지도 앱 연동을 완료했고, 지도 앱 미설치 UX를 보강했습니다. 이어서 상세 화면과 리스트 카드에 "복사하기"를 추가해 기존 활동/장소 정보를 신규 등록 화면에 prefill하고, 사용자가 확인·수정 후 저장하는 흐름까지 main에 반영했습니다. 현재 작업 브랜치 없음, main 최신·작업트리 clean.

## 브랜치 상태
- `fix/activity-time-of-day-default` → main 머지 완료
- `fix/detail-registered-by-label` → PR #35 squash(`f0349f7`)
- `refactor/rename-location-to-area` → PR #36 squash(`263290a`)
- `feat/add-location-map-link` → PR #37 squash(`e9c6cf2`, 12커밋)
- `fix/tmap-missing-app-fallback` → PR #44 squash(`66e2094`)
- `feat/duplicate-item-prefill` → PR #45 squash(`4b521c5`)
- 현재 작업 브랜치 없음, main 기준 lint/build PASS, 작업트리 clean

## 필드 개념 — area vs location (확정)
| 필드 | 의미 | 화면 라벨 | 대상 | 추천 사용 |
|---|---|---|---|---|
| area | 추천 범위용 지역 태그(성수/홍대) | 지역 | places만 | O(필터) |
| location | 지도 검색용 실제 위치(상호명·관광지·주소) | 위치 | activities·places | X(표시·지도용) |

## 장소 필드 순서 표준 (확정)
제목 → 카테고리 → 식사시간 → 지역(area) → 위치(location) → 메모 → 참고링크
(활동은 제목 → 카테고리 → 소요시간 → 시간대 → 위치 → 메모 → 참고링크, 입력·상세 일치)

## 지도 연동 구조
- config: `lib/map.ts` MAP_APPS 배열(네이버·구글·카카오·티맵). 확장은 항목 추가만
- requiresApp: 앱스킴 전용 앱은 데스크탑 숨김 + 모바일 미설치 안내 대상
- iOS Safari: 앱스킴 실패 전 안내 후 사용자가 [열기] 액션으로 진행
- Chrome iOS/Android: 기존 timeout 기반 미설치 안내 유지
- 미설치 안내 문구: `{앱명} 앱을 설치해 주세요.` 공통 사용
- 기억: `useMapAppPreference`(localStorage, 기본 naver)
- UI: MapLink — 위치 텍스트(비링크) + 우측 지도 아이콘/▾ 앱 선택 시트
- 위치 미입력 시: "아직 위치가 없어요" faint 빈 상태 표시

## 복사하기 기능 구조
- 진입 위치: 상세 화면 상단 ⋮, 리스트 카드 ⋮
- 동작: 복사하기 → 신규 등록 화면으로 이동 → 원본 등록 정보 prefill → 사용자가 확인/수정 후 저장
- 저장 전 DB 생성 없음. `sessionStorage` one-shot stash/take + `?from=copy` 게이트 사용
- 복사 대상:
  - 활동: 제목, 카테고리, 소요시간, 시간대, 위치, 메모, 참고 링크
  - 장소: 제목, 카테고리, 식사시간, 지역(area), 위치(location), 메모, 참고 링크
- 복사 제외: status, visited_at/방문일, rating, review_note/감상, id, created_at/updated_at 등 방문 기록·시스템 필드
- 저장 시 기존 신규 등록 POST 흐름 사용. 원본이 visited여도 새 항목은 wishlist 기본값으로 생성
- 제목은 `{원본 제목} 복사본` 형식이며 최종 100자 이하로 cap
- 카드 ⋮ 메뉴 순서:
  - wishlist: 정보 수정 → 복사하기 → 다녀온 곳으로 → 구분선 → 삭제
  - visited: 정보 수정 → 기록 수정 → 복사하기 → 가보고 싶은 곳으로 → 구분선 → 삭제

## 다음 작업 후보
- 사용자 요청 7번 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — 바로 구현보다 Analysis Mode 설계 권장
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 지도 앱 열림/미설치 안내/지도 4종 검색 확인

## 진행 중 / 남은 작업 · 기술 부채
- 다녀온 날짜 기간 입력 설계: DB 모델, 상세/리스트 표시, 추천 로직 영향, 기존 데이터 마이그레이션 필요성 검토
- 뱃지 크기 통일: mealBadge와 visitedTag 높이·정렬 실측 후 필요 시 mealBadge 기준으로 수렴
- Galaxy 실기기 QA: ①티맵/앱스킴 앱 미설치 안내 ②네이버·구글·카카오 웹/앱 연결 ③지도 4종 검색 ④라이트/다크·모바일 위치 행 정렬
- (이전 세션 잔여) 추가 플로우 returnTo 배선, 검색/필터 URL 동기화, spacing 토큰 표준화 등