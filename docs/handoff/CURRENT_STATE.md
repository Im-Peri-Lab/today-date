# CURRENT_STATE.md

> **마지막 업데이트: 2026-07-24**

## 현재 단계
유지보수 / 점진적 UX 개선 단계.

## 현재 한 줄 요약
Supabase Security Advisor 보안 이슈 2건 해소(RLS 미설정 7건 → PR #76, 함수 search_path
미고정 → PR #77) 반영 완료. Security Advisor Errors/Warnings 모두 0건. 기능 기준 커밋
`83f3fe2`.

## 브랜치 상태
- 현재 작업 브랜치 없음, main 기준 build PASS

## 구현 완료 (누적, 기존 유지)
(기존 항목 전체 유지)
- **(신규) Supabase RLS 미설정 해소**: public 스키마 7개 테이블(email_tokens, activities,
  places, activity_categories, place_categories, recommendations_log, app_config)에
  RLS 활성화, 정책은 추가하지 않음. service_role은 RLS 자동 우회하므로 서버 코드 무변경,
  anon/authenticated는 정책 부재로 완전 차단. 진단 결과 email_tokens INSERT를 통한 패스코드
  탈취 경로가 코드상 성립했었음을 확인 후 조치(Critical). 스모크 테스트 4/4 PASS,
  Security Advisor Errors 7→0건 (PR #76 squash `a2bb098`)
- **(신규) 함수 search_path 고정**: `touch_updated_at` 트리거 함수의 search_path를
  `public, pg_temp`로 고정(hijacking 방지). 트리거 로직 무변경, 스모크 테스트 PASS,
  Security Advisor Warnings 1→0건 (PR #77 squash `83f3fe2`)
- **mealBadge/visitedTag 역할별 배지 변형 문서화**: 실측 결과 두 요소 색상 토큰(`--s-card-border-strong`/`--s-sub`) 동일, padding·font-weight만 차이(mealBadge 12px/400/4px 10px, visitedTag 12px/500/2px 8px) 확인 → "복수 정보값 나열 vs 단일 상태 강조" 역할 차이에 따른 의도된 변형으로 확정. 코드 변경 없음, SKILL.md §1·§8·§10-E만 정정 (PR #71 squash `af87e82`). 260722 후속 점검에서 `--s-accent-soft-bg` 다크 실측값(`#573f7f`)과 현존 활성 클래스 사용처를 기준으로 남은 옛 문구를 정합화함.
- **`/list` 검색·필터 URL 동기화**: 검색어(`q`, 탭 간 공유 유지)·세부 필터(활동: 카테고리·소요시간·시간대 / 장소: 카테고리·식사시간, 현재 보고 있는 탭만)를 URL에 실시간 반영. `returnTo` 생성 기준을 최초 진입 URL이 아닌 현재 라이브 상태로 변경 (PR #72 squash `83db5c1`)
- **신규 등록 흐름 목록 returnTo 연결**: FAB·빈 목록 CTA·저장 후 이동(상세 이동·연속 등록 최종 이동 모두)에 원래 목록 URL을 `returnTo`로 전달, `activities/new`/`places/new`가 이를 읽고 검증해 상단 복귀 링크·저장 후 이동에 사용. 복사하기 흐름은 이번 범위 제외, 기존 동작 유지 (PR #73 squash `5d83504`)
- **`.headerNavBtn` 모바일 sticky hover 잔상 수정**: hover 규칙을 `@media (hover: hover)`로 제한(카드·칩·통계 행에 이미 있던 기존 패턴과 통일). 검색·홈·메뉴 공용 버그로, iOS WebKit sticky hover + 홈/검색 아이콘 좌표 공유 조합이 원인. 에뮬레이션(hover:none 시뮬레이션)으로만 검증, iOS 실기기 미검증 (PR #74 squash `c17b4e0`)
- **검색 다이얼로그 인풋 폰트 수정**: `.searchInput`(홈 검색·`/list` 검색바 공유) font-size 14px→16px, iOS 포커스 자동 줌인 방지 (PR #66 squash `0e0e74d`). 다이얼로그 폭(92% vs 320px) 실험 후 베이스(92%) 유지로 결론 — 판단 근거 → PROJECT_CONTEXT §20
- **다이얼로그 오버레이 라이트 모드 대비 강화**: 모든 중앙 모달(검색·다녀왔어요·삭제 확인·되돌리기 확인) 공통 적용, 라이트 rgba(0,0,0,0.10)→0.35 (PR #67 squash `85aae3a`). 기존 §11-B 값이 실측 검증된 적 없었음을 확인 후 진행. 구체 값 → SKILL §11-B
- **헤더 내비게이션 아이콘 전용 티어 신설**: 홈 화면(검색+메뉴)/그 외 화면(홈+메뉴) 대상, 기존 `.iconBtn`(카드 ⋮ 메뉴·로그아웃)과 분리된 신규 `.headerNavBtn`. 탭타깃 44px 유지, glyph 20px→22px 확대, 그룹 gap 4px→0px (PR #68 squash `d734e0d`). 로그아웃·케밥은 렌더링 컨텍스트가 분리돼 있어 무영향 확인 후 진행. 구체 값 → SKILL §7
- **iOS Safari TMAP 실행 버그 수정**: 설치 안내 토스트 무조건 노출 제거, 공식 HTTPS 브릿지 플로우로 교체. Android·기타/네이버·카카오·구글지도는 변경 없음 (PR #69 squash `8841759`)
- **"저장하고 계속 등록하기" 기능**: 즉시 저장 후 폼 리셋, 성공 토스트 표시(PR #51 예외). 연속 등록 미사용 시에는 상세로 이동하며 유효한 `returnTo`를 상세 URL에 전달하고, 한 번 이상 사용한 뒤 최종 저장 시에는 `returnTo` 목록으로 바로 복귀(없으면 해당 목록 탭으로 폴백) (PR #70 squash `855886e`, returnTo 배선 PR #73)
- **신규 등록 폼 카드 레이아웃 통일**: `/activities/new`, `/places/new`를 상세 화면(DetailBlock)과 동일한 `.card`/`.detailCard` 표면으로 통일 (PR #70, 같은 커밋)

## 배포 상태
- 플랫폼: Vercel
- URL: `https://today-date-seven.vercel.app`
- 현재 브랜치: `main` (PR #77 기능 기준 `83f3fe2`)

## 진행 중 / 남은 작업
- "저장하고 계속 등록하기" 후속 — 복사하기 흐름 `returnTo` 배선 통합 검토(다음 작업 후보)
- Galaxy 실기기 QA: 하드웨어 미확보로 보류 중
- useCreateActivity/useCreatePlace 훅 통일 검토(최소 diff로 보류 중)
- 카드 그리드 구현 방식 통합 검토(list=Grid vs 추천=flex 중복, 렌더 동일해 우선순위 낮음)

## 알려진 이슈 · 기술 부채
- 생성 로직(활동/장소)이 훅으로 추출되지 않고 두 폼(ActivityForm/PlaceForm)에 raw fetch로 인라인 중복 존재. update/delete는 훅으로 통일돼 있으나 생성만 미추출(연속 등록·returnTo 배선 기능도 이 구조 위에 분기만 추가, 부채 자체는 그대로 유지됨).
- 삭제 시 다이얼로그 닫힘 애니메이션이 낙관적 제거로 인해 즉시 사라짐(트레이드오프로 수용). DeleteConfirmDialog의 스피너는 이 경로에서 dead state이나 무해.
- 카드 그리드가 `/list`(CSS Grid)와 추천결과 2종(flex-wrap 하드코딩 중복)으로 비공유 구현 — 렌더 결과는 동일해 시급하진 않음
- `.headerNavBtn` sticky hover 수정은 브라우저 에뮬레이션만 검증됨, iOS 실기기 미확인 (Galaxy 실기기 QA와 같은 보류 성격)
- 복사하기 흐름은 목록 returnTo 배선에 포함되지 않음(기존 자체 prefill 경로 유지) — 필요시 별도 확인 후 통합 검토
- (이전 세션 잔여) spacing 토큰 표준화 등
