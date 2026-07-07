# Today Date — CURRENT_STATE
> 마지막 업데이트: 2026-07-07

## 현재 한 줄 요약
지역(area)/실제 위치(location) 분리, 지도 앱 연동, 복사하기 prefill 기능에 이어, 오늘은 UI 버그 정리(삭제 다이얼로그 버튼 높이 표준화)와 React Query 캐시 갱신 관련 버그 5건(상세 저장 깜빡임, 리스트 생성/수정 지연, 삭제 잔상, 버튼 재활성화 깜빡임, 등록 토스트 중복)을 진단·수정해 main에 반영했습니다. 현재 작업 브랜치 없음, main 최신·작업트리 clean.

## 브랜치 상태
- `fix/delete-dialog-button-height` → PR #46 squash(`8d14c22`)
- `fix/detail-save-flash` → PR #47 squash(`a487ad4`)
- `fix/list-stale-cache` → PR #48 squash(`457dd5a`)
- `fix/optimistic-delete` → PR #49 squash(`8f91140`)
- `fix/button-flash-on-navigate` → PR #50 squash(`a2f2487`)
- `fix/registration-toast-flow` → PR #51 squash(`a9205cd`)
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

## React Query 캐시 갱신 원칙 (오늘 확정)
- **상세 단일 레코드(PATCH)**: onSuccess에서 `setQueryData(['activity'|'place', id], data)`로 즉시 반영. 별도 invalidateQueries 불필요(#47)
- **리스트(생성/수정 후)**: invalidateQueries에 `{ refetchType: 'all' }` 필수. 기본값 `'active'`는 리스트가 미마운트 상태면 재조회를 안 걸어 신규 항목 누락·깜빡임 발생(#48)
- **리스트(삭제 후)**: 낙관적 제거(`onMutate` → `setQueriesData` 복수형으로 필터 변형 전체에서 제거) + `onError` 롤백 + `onSettled` invalidate. 삭제 시점엔 리스트가 이미 마운트돼 있어 refetchType으로는 해결 안 됨, 별도 처방 필요(#49)
- **언마운트 유발 낙관적 업데이트**: 롤백·토스트는 반드시 훅 레벨(`onMutate`/`onError`/`onSettled`)에 둘 것. `.mutate(id, { onSuccess })`처럼 호출부 콜백은 컴포넌트 언마운트 시 유실됨(#49)
- **router.push 타이밍**: 비동기이며 즉시 반환 → 로딩 상태(`isSubmitting`/`isPending`) 해제가 실제 화면 전환보다 먼저 일어나 버튼이 잠깐 재활성화되어 보임. 별도 `navigating` 상태로 push 이후~전환 완료까지 비활성 유지 필요(#50)
- **토스트 표시 기준**: "화면 전환 여부"가 아니라 "목적지 화면이 결과를 자기확인해주는가"로 판단. 신규 등록→상세는 자기확인되므로 토스트 생략(#51). 삭제→목록, 패스코드 변경→lock/홈은 목적지가 결과를 확인시켜주지 못하므로 토스트 유지

## 다음 작업 후보
- 사용자 요청 7번 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — 바로 구현보다 Analysis Mode 설계 권장
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 지도 앱 열림/미설치 안내/지도 4종 검색 확인

## 진행 중 / 남은 작업 · 기술 부채
- 다녀온 날짜 기간 입력 설계: DB 모델, 상세/리스트 표시, 추천 로직 영향, 기존 데이터 마이그레이션 필요성 검토
- 뱃지 크기 통일: mealBadge와 visitedTag 높이·정렬 실측 후 필요 시 mealBadge 기준으로 수렴
- Galaxy 실기기 QA: ①티맵/앱스킴 앱 미설치 안내 ②네이버·구글·카카오 웹/앱 연결 ③지도 4종 검색 ④라이트/다크·모바일 위치 행 정렬
- 활동 생성은 raw fetch, 장소 생성은 폼 인라인 로직으로 구조 비대칭. 리스트 캐시 무효화 로직이 두 파일에 각각 존재해 향후 drift 위험. useCreateActivity/useCreatePlace 훅 통일 검토(이번엔 최소 diff로 보류)
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용, 별도 리팩토링 없이는 복원 어려움)
- 장소 "되돌리기"에 로딩 상태/피드백 없음(활동은 확인 다이얼로그 + disabled 있음, 장소는 즉시 실행이라 더블클릭 여지 있음)
- 복사·카드 메뉴 이동 시 topLoader 미적용 — 등록/삭제 경로만 topLoader.start() 호출
- ActivityForm/PlaceForm의 isEdit 분기는 현재 `/new`에서만 렌더되어 사문화된 코드(실제 수정은 상세 인플레이스가 담당)
- (이전 세션 잔여) 검색/필터 URL 동기화, returnTo 배선, spacing 토큰 표준화 등