# CURRENT_STATE.md
> 마지막 업데이트: 2026-07-08

## 현재 단계
유지보수 / 점진적 UX 개선 단계. MVP 기능은 완료 상태이며, 디자인 일관성·캐시 안정성·엣지 케이스 정리가 중심.

## 현재 한 줄 요약
리스트 카드(ActivityCard/PlaceCard) 정보 줄 통일(PR #52)에 이어, 정보 줄과 배지 줄의 스타일 위계(폰트 크기·색)까지 통일 완료(PR #54, squash `6f4cb46`). 기존 "카드 흐린 미리보기" 의도된 예외를 철회하고 배지 줄과 동일 톤(12px+`--s-sub`)으로 수렴. main 최신(`6f4cb46`), Vercel production 반영 완료, 작업트리 clean.

## 브랜치 상태
- `design/unify-card-info-row-tone` → PR #54 squash(`6f4cb46`) — main 반영 완료, 원격/로컬 브랜치 삭제됨
- 현재 작업 브랜치 없음, main 기준 build PASS, Vercel production 배포 success

## 구현 완료 (누적, 기존 유지)
- 인증(이메일 인증 + 6자리 패스코드, `/setup`·`/lock`·`/forgot`·`/reset`)
- CRUD/리스트(`/list`, 활동·장소 탭, 위시리스트/다녀온 곳 토글, 검색, 필터, 카드, FAB, 카드 ⋮ 메뉴 복사하기)
- 복사하기 흐름(prefill 후 저장 방식)
- 추천(활동/장소 분리 API, `pickTopWithShuffle` 동등 추천 묶음)
- 지도 앱 연동(`MAP_APPS` config, `MapLink`, 미설치 안내)
- 홈 통계 카드(행 리스트형, 자연어 빈 상태)
- 타이포 7토큰 표준화
- 리스트 카드 정보 줄 우선순위 통일(memo→location fallback, PR #52)
- **(신규) 리스트 카드 정보 줄 스타일 위계 통일**: 아래 표 참조

## 리스트 카드 정보 줄 규칙 (갱신, 260708)
| 카드 타입 | 정보 줄 우선순위 | 아이콘 | 스타일 |
|---|---|---|---|
| ActivityCard | memo 있으면 memo, 없고 location 있으면 location, 둘 다 없으면 빈 슬롯 | memo=StickyNote / location=MapPin | text-xs(12px) + `--s-sub` — 배지 줄과 동일 |
| PlaceCard | memo 고정(location fallback 없음) | memo=StickyNote | text-xs(12px) + `--s-sub` — 배지 줄과 동일 |

- 정보 줄은 항상 렌더되는 고정 높이(`min-h-5`, 20px) 컨테이너 유지 (변경 없음)
- **(변경)** 기존에는 정보 줄이 배지 줄과 다른 위계(14px+`--s-faint`, "흐린 미리보기" 의도된 예외)였으나, 카드 정보 밀도가 낮아 위계 구분이 이질감만 준다는 판단으로 배지 줄과 동일 스타일로 통일
- SKILL.md §8-A/§2-B에서 해당 "의도된 예외" 항목 제거, 스펙 갱신 완료
- 판단 근거·논의 경과 → CHANGELOG 2026-07-08 참조

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
- 현재 브랜치: `main` (최신 `6f4cb46`)

## 진행 중 / 남은 작업
- 사용자 요청 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대, 추천 로직 영향) — Analysis Mode 설계 권장
- 뱃지 크기 통일: mealBadge vs visitedTag 불일치 가능성 실측 후 별도 브랜치
- Galaxy 실기기 QA: 하드웨어 미확보로 보류 중

## 알려진 이슈 · 기술 부채
- 활동 생성은 raw fetch, 장소 생성은 폼 인라인 로직으로 구조 비대칭. 리스트 캐시 무효화 로직이 두 파일에 각각 존재해 향후 drift 위험. useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중)
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용)
- 장소 "되돌리기"에 로딩 상태/피드백 없음(활동은 확인 다이얼로그 + disabled 있음)
- 복사·카드 메뉴 이동 시 topLoader 미적용(등록/삭제 경로만 적용됨)
- ActivityForm/PlaceForm의 isEdit 분기는 현재 `/new`에서만 렌더되어 사문화된 코드
- (이전 세션 잔여) 검색/필터 URL 동기화, returnTo 배선, spacing 토큰 표준화 등