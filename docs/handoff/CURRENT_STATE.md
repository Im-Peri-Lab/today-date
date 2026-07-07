# CURRENT_STATE_260707_v2.md
> 마지막 업데이트: 2026-07-07 (v2)

## 현재 단계
유지보수 / 점진적 UX 개선 단계. MVP 기능은 완료 상태이며, 디자인 일관성·캐시 안정성·엣지 케이스 정리가 중심.

## 현재 한 줄 요약
UI 버그 정리·React Query 캐시 갱신 버그 5건 수정에 이어, 리스트 카드(ActivityCard/PlaceCard) 정보 줄 비일관성을 디렉팅 논의로 정리하고 구현 완료(PR #52 squash `58b07d1`). 구현 중 발견된 SKILL.md 동기화 누락도 사후 반영 완료(PR #53 squash `5f791c9`). main 최신(`5f791c9`), 작업트리 clean, 코드-문서 SoT 정합 상태.

## 브랜치 상태
- `design/list-card-consistency` → PR #52 squash(`58b07d1`) — main 반영 완료
- `docs/skill-card-info-row-sync` → PR #53 squash(`5f791c9`) — main 반영 완료, SoT 정합 확인됨
- 현재 작업 브랜치 없음, main 기준 lint/build PASS, 작업트리 clean

## 구현 완료 (누적, 기존 유지)
- 인증(이메일 인증 + 6자리 패스코드, `/setup`·`/lock`·`/forgot`·`/reset`)
- CRUD/리스트(`/list`, 활동·장소 탭, 위시리스트/다녀온 곳 토글, 검색, 필터, 카드, FAB, 카드 ⋮ 메뉴 복사하기)
- 복사하기 흐름(prefill 후 저장 방식)
- 추천(활동/장소 분리 API, `pickTopWithShuffle` 동등 추천 묶음)
- 지도 앱 연동(`MAP_APPS` config, `MapLink`, 미설치 안내)
- 홈 통계 카드(행 리스트형, 자연어 빈 상태)
- 타이포 7토큰 표준화
- **(v2 신규) 리스트 카드 정보 줄 통일**: 아래 표 참조

## 리스트 카드 정보 줄 규칙 (신규 확정, 260707 v2)
| 카드 타입 | 정보 줄 우선순위 | 아이콘 | 비고 |
|---|---|---|---|
| ActivityCard | memo 있으면 memo, 없고 location 있으면 location, 둘 다 없으면 빈 슬롯 | memo=StickyNote / location=MapPin | 배지 줄(소요시간·시간대)은 변경 없음 |
| PlaceCard | memo 고정(location fallback 없음) | memo=StickyNote | area는 배지 줄에서 별도 노출(변경 없음), 위치는 제목과 중복이라 리스트에서 생략 |

- 정보 줄은 항상 렌더되는 고정 높이(`min-h-5`, 20px) 컨테이너 → memo/location 유무와 무관하게 카드 높이·별점/날짜 줄 위치 통일
- 별점/날짜 줄은 별도 앵커 없이 정보 줄 뒤에 자연스럽게 따라붙는 구조(진단 확인) — 정보 줄만 고정하면 자동 정렬됨
- 판단 근거(우선순위를 여러 번 뒤집은 논의 경과) → CHANGELOG 2026-07-07 v2 참조, 결론 원칙 → PROJECT_CONTEXT §20
- SKILL.md §8-A와 코드(ActivityCard.tsx/PlaceCard.tsx) 1:1 정합 확인 완료(260707 v2)

## 필드 개념 — area vs location (기존, 변경 없음)
| 필드 | 의미 | 화면 라벨 | 대상 | 추천 사용 |
|---|---|---|---|---|
| area | 추천 범위용 지역 태그(성수/홍대) | 지역 | places만 | O(필터) |
| location | 지도 검색용 실제 위치(상호명·관광지·주소) | 위치 | activities·places | X(표시·지도용) — 단, activity 리스트 카드 정보 줄 fallback에 한해 표시 용도로 사용 |

## 장소 필드 순서 표준 (기존, 변경 없음)
제목 → 카테고리 → 식사시간 → 지역(area) → 위치(location) → 메모 → 참고링크
(활동은 제목 → 카테고리 → 소요시간 → 시간대 → 위치 → 메모 → 참고링크, 입력·상세 일치)

## 지도 연동 구조 (기존, 변경 없음)
- config: `lib/map.ts` MAP_APPS 배열(네이버·구글·카카오·티맵). 확장은 항목 추가만
- requiresApp: 앱스킴 전용 앱은 데스크탑 숨김 + 모바일 미설치 안내 대상
- iOS Safari: 앱스킴 실패 전 안내 후 사용자가 [열기] 액션으로 진행
- Chrome iOS/Android: 기존 timeout 기반 미설치 안내 유지
- 미설치 안내 문구: `{앱명} 앱을 설치해 주세요.` 공통 사용
- 기억: `useMapAppPreference`(localStorage, 기본 naver)
- UI: MapLink — 위치 텍스트(비링크) + 우측 지도 아이콘/▾ 앱 선택 시트
- 위치 미입력 시: "아직 위치가 없어요" faint 빈 상태 표시

## 복사하기 기능 구조 (기존, 변경 없음)
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

## React Query 캐시 갱신 원칙 (기존, 변경 없음)
- **상세 단일 레코드(PATCH)**: onSuccess에서 `setQueryData(['activity'|'place', id], data)`로 즉시 반영. 별도 invalidateQueries 불필요(#47)
- **리스트(생성/수정 후)**: invalidateQueries에 `{ refetchType: 'all' }` 필수(#48)
- **리스트(삭제 후)**: 낙관적 제거(`onMutate` → `setQueriesData` 복수형) + `onError` 롤백 + `onSettled` invalidate(#49)
- **언마운트 유발 낙관적 업데이트**: 롤백·토스트는 반드시 훅 레벨에 둘 것(#49)
- **router.push 타이밍**: 별도 `navigating` 상태로 push 이후~전환 완료까지 비활성 유지 필요(#50)
- **토스트 표시 기준**: "화면 전환 여부"가 아니라 "목적지 화면이 결과를 자기확인해주는가"로 판단(#51)

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (최신 `5f791c9`)

## 진행 중 / 남은 작업
- 리스트 카드 변경분 실기기 라이트/다크 육안 확인 (정적 픽셀 실측만 완료, 라이브 프리뷰 미확인)
- 사용자 요청 7번 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — Analysis Mode 설계 권장
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 지도 앱 열림/미설치 안내/지도 4종 검색 확인

## 알려진 이슈 · 기술 부채
- 활동 생성은 raw fetch, 장소 생성은 폼 인라인 로직으로 구조 비대칭. 리스트 캐시 무효화 로직이 두 파일에 각각 존재해 향후 drift 위험. useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중)
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용)
- 장소 "되돌리기"에 로딩 상태/피드백 없음(활동은 확인 다이얼로그 + disabled 있음)
- 복사·카드 메뉴 이동 시 topLoader 미적용(등록/삭제 경로만 적용됨)
- ActivityForm/PlaceForm의 isEdit 분기는 현재 `/new`에서만 렌더되어 사문화된 코드
- (이전 세션 잔여) 검색/필터 URL 동기화, returnTo 배선, spacing 토큰 표준화 등