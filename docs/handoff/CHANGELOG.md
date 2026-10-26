# CHANGELOG.md

> **마지막 업데이트: 2026-10-26 (PR #134~#155 반영)**

> 260531~261022 핸드오프 전체를 날짜순으로 기록한 변경 이력입니다. 새 AI는 일반적으로 `PROJECT_CONTEXT.md`와 `CURRENT_STATE.md`만 먼저 읽고, 과거 판단 근거가 필요할 때 이 문서를 참고하세요.

---

## 2026-05-31 — 초기 프로젝트 컨텍스트

- Today Date 프로젝트 개요 정리
- 커플 2인용 데이트 위시리스트 + 추천 PWA 정의
- 계정 없는 단일 공유 워크스페이스 구조 정리
- 초기 인증, CRUD, 리스트, 추천 기능 완료 상태 기록
- 초기 디자인 컨셉 정리
  - 미니멀 럭셔리 + 로맨틱 한 스푼
  - 인증 화면 디자인
  - 홈 화면 디자인
- 당시 기준 `/list` 디자인 진행 중
- 초기 문서에는 패스코드가 4~6자리로 적혀 있었으나, 이후 260617 작업에서 6자리 고정으로 정정됨

---

## 2026-06-02 — 리스트 디자인 정리

- `/list` 디자인 작업 main + production 반영
- 라이트/다크 카드 원칙 확정
- 리스트 카드, 필터, 검색, 토글, FAB 정리
- 하단 여백/FAB 출렁임 디버깅
- 일반 화면은 항상 위 정렬 수용
- 라이트 배경 토큰을 다른 화면으로 확산할 필요 확인

---

## 2026-06-05 — 상세 화면 디자인·스킬 도입

- `.claude/skills/today-date-design/SKILL.md`가 디자인 단일 출처로 자리잡음
- 상세 화면 `/activities/[id]`, `/places/[id]` 디자인 규칙 확정
- 등록 정보 / 방문 기록 2블록 구조 확정
- 인라인 편집 패턴 확정
- 상태 라벨 문구 단일 출처 `src/lib/labels.ts` 사용
- 시스템 이모지 대신 lucide-react 단색 아이콘 원칙 강화
- 새 규칙은 코드로 먼저 확정 후 SKILL.md 문서화해야 한다는 원칙 형성

---

## 2026-06-06 — 폼·날짜·페이지 높이 1차 정리

- 추가 화면과 인라인 편집 폼 정리
- react-day-picker 커스텀 date picker 도입
- 버튼 높이와 입력 폼 위계 정리
- 페이지 높이 정책을 깊게 디버깅
- 이후 260609 v2에서 react-day-picker는 제거되고 네이티브 date input으로 전환됨

---

## 2026-06-07 — 카드 리듬·페이지 높이 정책 확정

- 카드 내부 수직 간격 2/12/4 원칙 확정
- ActivityCard / PlaceCard 리듬 통일
- 페이지 헤더 상단 여백과 서브카피 간격 정리
- 일반 화면 `100svh`, 인증 화면 `100dvh` 분리 정책 확정
- 인증 화면에 svh를 적용하면 상단이 잘리는 회귀 발생 확인
- 높이 문제는 요소를 깎지 말고 정렬 + 자연 스크롤로 해결한다는 교훈 확보

---

## 2026-06-08 — 추천 위저드/추천 로직 정리

- `feat/recommend-logic`에서 추천 위저드·결과·0개 상태 디자인과 로직 정리
- 추천 결과는 랭킹이 아니라 동등 추천 묶음으로 표현해야 함
- `pickTopWithShuffle(scored, 5, 3)` 구조 정리
- 후보 풀이 3개보다 많을 때만 “다른 추천 보기” 버튼 노출하는 방향 정리
- 시간대 매칭 로직 확인
  - 주간=day+any
  - 야간=night+any
  - 아무때나=전부
- 장소 location 부분포함 필터 방향 정리

---

## 2026-06-09 v1 — 추천 마무리·PC 레이아웃·상태 토큰

- `feat/recommend-logic` main 머지
- 추천 0박스 비주얼 세련화
- “다른 추천 보기” 노출 조건에 `poolSize` 필드 추가
- `feat/desktop-layout` main 머지
  - 결과 카드 1~2개 좌측 쏠림 해결
  - 결과 하단 버튼과 0박스 폭 분리
- `feat/state-tokens` main 머지
  - 상태 표현 위계 정리
  - 선택 상태는 단색 채움이 아니라 틴트 + 보더 + 글자
  - 단색 채움은 CTA에만 사용
- `fix/dialog-dark` main 머지
  - 다이얼로그 OS 다크 대응
- `feat/visited-dialog-form-align` main 머지
  - 등록폼과 다녀왔어요 폼 정렬 통일

---

## 2026-06-09 v2 — 다이얼로그 닫기 표준화·날짜 네이티브 전환

- `feat/dialog-close-standard` main 머지
  - 입력 폼 다이얼로그는 X만 유지
  - 결정 다이얼로그는 취소 버튼만 유지
  - 다이얼로그 제목은 페이지 h1과 분리된 전용 20px
- `refactor/native-date-input` main 머지
  - react-day-picker 제거
  - 네이티브 `<input type="date">` 전환
  - 날짜 표시 `YYYY.MM.DD (요일)` 확정
  - 저장값은 ISO 유지
  - 커스텀 date picker 재도입 금지

---

## 2026-06-09 v3 — 버튼/컨트롤 시스템 리팩토링 착수

- `refactor/button-system` 브랜치에서 버튼/컨트롤 상태 시스템 리팩토링 진행
- 진단 결과:
  - Button size prop 전면 미사용
  - `detailPrimaryBtn`과 공용 Button primary 이중 관리
  - 상태 표현/hover/focus가 요소마다 제각각
- 커밋1과 커밋1 보강 완료·push
- 이후 260611에서 전체 완료 후 main 병합

---

## 2026-06-11 — button-system 리팩토링 완료

- `refactor/button-system` main squash 병합
- 컨트롤 줄 높이 40px 통일
- 토글 선택 패턴 iOS식으로 정리
- 앱 전역 선택/활성 공통 언어를 보라 테두리로 통일
- 칩 선택 패턴 정리
- 그라데이션은 단독 진입 버튼일 때만 사용
- 유틸 아이콘 탭타깃/글리프 크기 정리
- 인라인 액션 버튼 위계 정리
- SKILL.md 문서화 완료
- 다음 과제로 전역 토큰 정리 제안

---

## 2026-06-12 — 전역 토큰 정리·destructive 토큰화

- `chore/token-cleanup` main squash 병합
- 라이트 `--s-*` 정식 정의 보완
- `--s-placeholder` 분리
- 다크 destructive 가시성 개선
- `--s-destructive-soft-bg`, `--s-destructive-soft-bg-strong` 도입
- 삭제 hover와 destructive 버튼 톤 정리
- `.detailDeleteBtn`은 표면이 달라 공통 토큰과 분리

---

## 2026-06-16 v1 — 잔여 브랜치 정리·드롭다운 portal 토큰화

- 잔여 브랜치 정리
- `fix/auth-fab-focus` 정리
- `refactor/button-system` 잔여 변경 진단 후 삭제
- `refactor/dropdown-portal-tokens` main 반영
- 드롭다운 portal 리터럴 토큰화
- portal은 `.page` 토큰 상속이 안 되므로 `:root` 전역 토큰 승격 필요 확인
- 닫기 버튼 hover 버그 수정

---

## 2026-06-16 v2 — 포커스 글로우 4-tier 확정

- §5 상호작용 표준 확산
- 포커스 글로우를 단일 3px에서 면적 기반 4-tier로 개정
- 확정 토큰:
  - `--s-focus-ring`: 2px, 소형 컨트롤
  - `--s-focus-ring-card`: 3px, 넓은 박스
  - `--s-active-glow`: 입력 필드 전용
  - `.textLink`: 인라인 링크 패턴
- 앱 전수 조사로 글로우 누락 요소 보강
- 죽은 코드 129줄 정리

---

## 2026-06-17 v1 — 화면 전환 로딩 P0

- `feat/loading-states` main squash 병합
- 전역 프로그레스 바 `nextjs-toploader` 도입
- 상세 페이지 진입 시 스켈레톤 점프 문제 확인
- 상세 페이지는 서버 prefetch + `initialData` 방식으로 정리
- 공용 쿼리 함수 신설
  - `src/lib/data/activities.ts`
  - `src/lib/data/places.ts`
- 추천 페이지는 진입 화면이 하드코딩 단계라 별도 작업 불필요 확인
- 로딩 교훈:
  - 예측 어려운 화면 = 프로그레스 바/prefetch
  - 레이아웃 고정 화면 = 스켈레톤

---

## 2026-06-17 v2 — 로딩 P1·패스코드 정합성·홈 통계 prefetch

- setup/reset Suspense fallback을 `null`에서 AuthLayout fallback으로 교체
- 패스코드 정합성 수정
  - 실제 UI는 6자리 고정
  - reset 문구의 4~6자리 표현을 6자리로 수정
  - API 검증도 `min(6).max(6)`으로 좁힘
- 프로그래매틱 전환 top loader 수동 start 적용
  - unlock
  - setup passcode
  - reset
  - logout
- 성공 경로에서는 `done()`을 수동 호출하지 않고 pushState 자동 done에 맡기는 것으로 싱크 해결
- 홈 통계 prefetch 적용
  - `src/lib/data/dashboard.ts` 신설
  - 홈 진입 시 통계 숫자 공백 제거
- 로딩 패턴 거버넌스 SKILL.md 문서화

---

## 2026-06-23 — 홈 통계 카드 리디자인·타이포 표준 착수

- `refactor/stat-card-tokens` main 머지 `f77914e`
- 홈 통계 카드 전면 리디자인
  - 행 리스트형
  - 우측 큰 숫자 제거
  - 미리보기 문장에 개수 흡수
  - 빈 상태 자연어 표시
  - 다녀온 곳 count>0에만 초록 체크 배지
- 전용 토큰 23개 제거 후 전역 시맨틱 토큰으로 수렴
- 신규 토큰 도입
  - `--s-success`
  - `--s-success-on`
  - `--s-accent-pink`
  - `--s-accent-pink-soft-bg`
  - `--s-accent-chip-tint`
  - `--s-hint`
  - `--s-card-shadow-xs`
- 그림자 위계 시스템화
- 라이트 배경 painting-order 문제 해결
- `/lock`과 홈 공유 라이트 그라데이션 토큰 도입
- 섹션 라벨 색 위계 정리
- 앱 전체 타이포 스케일 표준 착수
  - `feat/typography-scale` 브랜치 생성·push
  - 전수 조사 완료
  - 7개 역할 토큰 구조 확정
  - 실제 마이그레이션은 미실행

---

## 2026-06-25 — 타이포 스케일 표준화 완료·main 반영

- `feat/typography-scale` → `main` PR 머지 완료 (PR #26, 10개 파일)
- 7개 역할 토큰으로 앱 전체 텍스트 점진 수렴(0단계 정의 → 1~4순위 적용)
  - 0단계: 토큰 정의만, 라이트/다크 값 검증, 픽셀 0
  - 1순위 section-label: `.sectionLabel` 신설, FilterGroup 라벨 faint/400→sub/600 위계 회복, StatSection 수렴
  - 2순위 caption/preview/body: `.captionText`·`.previewMetaText`·`.bodyText` 신설, 상세 라벨·값·한줄평 수렴, 통계 미리보기 모바일 11→12px
  - 3순위 card-title: `.cardTitle` 신설, 카드 h3 수렴
  - 4순위 page-title: `.pageTitle` 토큰화, 모바일 1.7rem→1.6875rem(27px) 표준화, PC 하드코딩 블록 제거
- 색 토큰 `:root` 승격
  - `--s-sub`·`--s-faint`를 globals.css `:root`로 승격(3순위 선행 커밋)
  - `.page`·`.dialogPopup` 중복 정의 제거
  - 전 경로 픽셀 0 검증(fallback 값과 승격값 일치 — 숨은 버그 없음 확인)
  - 이후 portal·인증 화면도 두 토큰 상속 가능
- 통계 행 제목 card-title-sm 수렴(보정)
  - 3순위에서 "현재값(13/500)이 토큰 정의(15/600)와 달라 후보 없음"으로 누락 → 토큰 의도(13→15 수렴)를 거꾸로 읽은 케이스로 판정
  - `.cardTitleSm` 신설, `.statRowTitle` 13→15px / 500→600 수렴
- 라벨 위계 분리(sectionLabel / fieldLabel)
  - 같은 "라벨"이라도 정보 구조상 계위가 다름 → 두 역할로 분리
  - `.sectionLabel`(600): 섹션 헤더(독립 구획 제목, 홈/리스트)
  - `.fieldLabel`(500, 신설): 필드명(값에 종속, 상세 DetailRow). size·color 공유, weight만 분리
  - 상세 값 위계 확립: 실제값(--s-ink) > 필드명(--s-sub) > 빈값(--s-faint)
  - 빈값·등록일 메타 캡션은 --s-faint 유지
- 홈 레이아웃 정리(시행착오 후 확정)
  - 통계 제목 15px 수렴 후 빡빡함 → 추천 카드 padding 축소·PC 폭 896px 확장 시도했으나 역효과(추천 2열 과벌어짐, 통계 횡늘어짐, 추천 존재감 약화) → 원복
  - 확정값: 추천 padding 20px·아이콘↔텍스트 16px, 통계 행 상하 12px·아이콘↔텍스트 12px, 홈 PC 폭 max-w-3xl(768px)
  - 정렬은 추천·통계 모두 좌측(가운데 정렬 검토 후 기각)
- SKILL.md 문서화(7토큰·유틸 매핑·라벨 위계·홈 확정값·의도된 예외 4종)
- 머지 운영 규칙 확인: CLI 직접 머지 금지, PR 경유(Vercel 배포 목록 정리 목적)
- 후속 백로그 확정
  - 식사시간 칩(.mealBadge 11px) 크기 개선 → 별도 브랜치
  - docs/design-brief-for-redesign.md 아카이브(일회성 의뢰 브리프, 목적 소비)

---

## 2026-06-30 — 식사시간 칩 크기·다크 대비·docs 아카이브·백로그 stale 2건 닫힘

- docs 브리프 아카이브: `docs/design-brief-for-redesign.md` → `docs/archive/` (`git mv`, main 직접)
- 식사시간 칩 크기 개선 + 다크 대비 수정 (PR #27 squash) — `.mealBadge` font-size 토큰화(12px)·padding 조정, 배경 `--s-track`→`--s-card-border-strong`(다크 묻힘 해소, 라이트 픽셀 불변). SKILL.md 반영
- 백로그 stale 2건 진단 후 닫힘(수정 대상 없음): 입력 step 위계 롤아웃, 버튼 max-width(1차 오독 정정)
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-06-30 v2 — 배경 그라데이션 전역 확장·hint 토큰 통합·백로그 stale 3건 닫힘

- 배경 그라데이션 전역 확장 (PR #28 squash) — 인증·홈 라벤더 그라데이션을 일반 화면(`.page`) 전체로 확장, 다크는 기존 `::before` 유지. 짧은 콘텐츠 흰 배경 노출 버그(`.pageStatic min-height: auto`) 함께 수정
- `--s-hint` → `--s-faint` 토큰 통합 (PR #29) — 홈 전용 죽은 토큰 제거, 참조 0건
- 백로그 stale 3건 진단 후 닫힘(수정 대상 없음): PC 홈 상단 여백, 상세 빈값/`--s-sub` 대비(실측 4.83:1 AA 통과), `--s-sub`/`--s-faint` 통합(성격 갈려 분리 유지)
- ⚠ PR #29는 fast-forward 머지됨(표준은 squash) — 이후 "Squash and merge" 확인
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-01 — 앱 UX 개선 4건·핸드오프 문서 저장소화

- 패스코드 키패드 눌림 상태 버그 fix (main 머지)
- 리스트 복귀 시 탭/상태 유지 (PR #31 squash `fa2a003`)
- 신규 등록 후 상세 화면으로 이동 (PR #32 squash `907ff16`)
- 상태 전환 문구 통일 + 참고 링크 표시/스킴 보정 (PR #33 squash `b8a2c09`, 신규 `src/lib/url.ts`)
- 핸드오프 문서 `docs/handoff/` 저장소 이관, 머지 운영 CLI squash 풀 플로우로 변경
- 모두 lint/build PASS + Vercel preview 실측
- 신규 백로그 3건 → PROJECT_CONTEXT §19 / 진단 근거·교훈 → §20

---

## 2026-07-02 — P0 버그 2건·added_by 제거·location/area 재정의·위치 지도 연동

- P0 ① 신규 활동 시간대 디폴트 제거 (main 머지) — ActivityForm `time_of_day:'any'` 하드코딩 제거 + required
- P0 ② added_by 필드 제거 (PR #35 squash `f0349f7`) — 미구현 유령 필드 제거. 마이그레이션 003(DROP added_by) 원격 적용
- location → area rename (PR #36 squash `263290a`) — places.location(지역 태그)→area, 라벨 "지역". 마이그레이션 004 원격 적용
- 위치 필드 + 지도 앱 연동 (PR #37 squash `e9c6cf2`, 12커밋) — location을 "지도 검색용 실제 위치"로 재도입(activities·places optional), `lib/map.ts`·`useMapAppPreference`·`MapLink`·`mapActionBtn`(28px) 신설. 마이그레이션 005 원격 적용
- 위치 미입력 시 빈 상태 표시(`dc29e8f`, main 직접)
- 모두 lint/build PASS + preview 실측
- location/area 재정의 배경 → PROJECT_CONTEXT §11 / 진단 근거·교훈 → §20
- 후속 고려사항: mapActionBtn 28px SKILL.md 문서화, 뱃지 크기 통일(mealBadge vs visitedTag), 실기기 QA(티맵 앱 열림/미설치 토스트·데스크탑 티맵 숨김·지도 4종 검색)

---

## 2026-07-06 — 지도 앱 미설치 UX 보강·복사하기 prefill 기능

- 지도 앱 미설치 UX 보강 (PR #44 squash `66e2094`) — iOS Safari 앱스킴 실패 전 안내, `requiresApp` 공통 설치 안내 문구, `useIsIosSafari.ts` 추가, SKILL.md 문서화. lint/build PASS
- 복사하기 prefill 기능 추가 (PR #45 squash `4b521c5`) — 상세 상단 ⋮와 리스트 카드 ⋮에 복사하기 추가, `sessionStorage` one-shot prefill, 신규 등록 화면에서 확인·수정 후 저장, 제목 100자 cap, 카드 메뉴 순서 정리, SKILL.md 문서화. lint/build PASS

---

## 2026-07-07 — UI 버그 정리·React Query 캐시 갱신 버그 5건 수정

- 삭제 확인 다이얼로그 버튼 height 표준 정합 (PR #46 squash `8d14c22`) — h-8(32px)→h-9(36px), §4-A 표준 미준수 진단 후 수정. 색상·토큰·아이콘은 §5-A·§5-B 의도된 차이로 유지
- 상세 저장 후 화면 깜빡임 제거 (PR #47 squash `a487ad4`) — useUpdateActivity/useUpdatePlace onSuccess를 invalidateQueries→setQueryData로 전환, PATCH 응답 즉시 캐시 반영
- `/list` 복귀 시 생성·수정 항목 반영 지연/깜빡임 제거 (PR #48 squash `457dd5a`) — 생성 경로 리스트 무효화 추가, 생성·수정 무효화에 refetchType:'all' 적용
- 삭제 시 낙관적 제거로 카드 잔상 제거 (PR #49 squash `8f91140`) — useDeleteActivity/useDeletePlace를 onMutate/onError/onSuccess/onSettled 패턴으로 전환, 실패 시 스냅샷 롤백
- 등록·삭제 후 페이지 전환 대기 중 버튼 재활성화 깜빡임 제거 (PR #50 squash `a2f2487`) — 등록 폼 2개·삭제 다이얼로그 2개에 navigating 로컬 상태 도입, 삭제 다이얼로그는 open 상태에도 적용
- 신규 등록 성공 토스트 제거 (PR #51 squash `a9205cd`) — 토스트 사용처 전수조사 후 "목적지 자기확인" 원칙 확정, 등록만 원칙 위반으로 제거·나머지는 유지
- git 커밋 author 정보 전역 설정(user.name/email) — 코드 변경 아님
- 모두 lint/build PASS
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-07 v2 — 리스트 카드 정보 줄 통일·SKILL.md 동기화 프로세스 이슈 발견·수정

- **디자인 방향 세션**: ActivityCard/PlaceCard 정보 줄 비일관성(메모 유무에 따라 카드 높이·별점 줄 위치 출렁임) 진단
  - 논의 경과: 위치+메모 병행 → 우선순위 fallback → 타입별 분리(activity/place) → "activity=memo 우선·location 보조, place=memo 고정"으로 확정
  - 확정 근거: place는 제목에 장소명이 들어가 위치가 중복 정보인 반면, activity는 제목이 "무엇을 할지"라 위치·조건 메모가 둘 다 실사용 가치 있음. 배지 줄은 area처럼 짧은 고정 텍스트 전용이라 location(가변 길이)은 정보 줄에 배치
- **진단(Claude Code)**: 정보 줄이 `{memo && (...)}` 조건부 렌더 + 고정 높이 부재가 원인. location은 쿼리에 이미 select됨. activities.location 채움률 45%(10/22), 신규 fallback으로 노출될 케이스 7건. 아이콘: 위치=MapPin(관례), 메모=StickyNote(신규)
- **구현 (PR #52 squash `58b07d1`)** — `design/list-card-consistency`
  - ActivityCard: `infoText = memo || location`, `InfoIcon = memo ? StickyNote : location ? MapPin : null`
  - ActivityCard/PlaceCard 정보 줄: 조건부 렌더 → 항상 렌더되는 고정 높이(`flex min-h-5 items-center gap-1 text-sm`) 컨테이너로 전환
  - PlaceCard는 로직 변경 없이 memo 고정 표시, 컨테이너만 통일
  - 검증: `npm run build` PASS, 정적 레이아웃 픽셀 실측(헤드리스 Chrome)으로 확인. 라이브 프리뷰(세션 인증 뒤)는 확인 못함 — 인증 우회 없이 한계 명시
- **SKILL.md 동기화 누락 발견 및 사후 수정 (PR #53 squash `5f791c9`)** — `docs/skill-card-info-row-sync`
  - PR #52 머지 커밋(`58b07d1`)에 SKILL.md 변경이 포함되지 않은 것을 `git show --stat` 진단으로 확인
  - §8-A를 실제 코드(ActivityCard.tsx/PlaceCard.tsx) 재확인 기준으로 갱신, 코드-문서 1:1 대조 완료
  - main 반영 완료(`.claude/skills/today-date-design/SKILL.md` 1개 파일, +31/-4, 문서 전용). 원격/로컬 브랜치 정리 완료
- **프로세스 교훈**: "코드+SKILL.md 동시 갱신" 지시는 완료 보고만으로 검증 끝난 게 아님. 머지 전 `git show --stat`으로 SKILL.md 포함 여부 재확인이 표준 체크리스트에 추가됨
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-08 — 리스트 카드 정보 줄 스타일 위계 통일

- **논의 배경**: 실기기 확인 중 정보 줄(memo/location, 14px+`--s-faint`)과 배지 줄(지역/시간대/소요시간, 12px+`--s-sub`)의 스타일 차이가 눈에 띔. 진단 결과 두 줄은 SKILL.md §8-A·§2-B에 명시된 "의도된 예외"로 코드-문서 정합에는 문제 없었음
- **판단**: 위계 분리는 정보 밀도가 높을 때 스캔 효율을 위한 설계인데, 현재 카드(배지 1~2개+정보 줄 1줄)는 밀도가 낮아 위계 구분이 이질감만 준다고 결론. 사전에 `text-sm`+`--s-faint` 조합 전수 조사 → 상세 빈값·방문기록 빈 상태·위저드에도 쓰이지만 전부 독립 인라인이라 카드만 수정해도 안전함을 확인 후 착수
- **구현 (PR #54 squash `6f4cb46`)** — `design/unify-card-info-row-tone`
  - ActivityCard.tsx/PlaceCard.tsx 정보 줄: `text-sm`→`text-xs`, `styles.faint`→`styles.sub`로 변경 (배지 줄과 완전 동일 스타일)
  - 레이아웃(`min-h-5`)·fallback 로직(memo→location) 변경 없음, `--s-faint` 토큰/`.faint` 클래스 자체는 미수정(다른 화면 영향 차단)
  - SKILL.md §8-A(정보 줄 스펙 갱신)·§2-B(의도된 예외 목록에서 카드 항목 제거) 동시 반영
  - 검증: `npm run build` PASS, 두 카드 클래스 바이트 동일 확인(§8-A "항상 같은 값" 규칙 충족), diff 3파일로 범위 확인해 다른 화면 픽셀 불변 증명, 브랜치 프리뷰 라이트/다크 라이브 확인(사용자 직접 검토)
  - 머지 전 `git show --stat`으로 SKILL.md 포함 여부 재확인 완료(§20 체크리스트 준수)
- Vercel production 배포 확인 (`6f4cb46`, 2026-07-08 08:15 UTC)
- 판단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-09 — 로딩 인디케이터 일관성 정리 (3개 브랜치)

- 기술 부채 3건 정리 (PR #55 squash `55a7845`) — `chore/tech-debt-round1`
  - place 되돌리기 로딩 피드백 추가(disabled+"처리 중...", 이후 처리 중 아이콘 숨김으로 보정)
  - 복사하기·카드메뉴 이동 topLoader 확장 (카드 ⋮ / 상세 ⋮ 양쪽)
  - ActivityForm/PlaceForm dead `isEdit` 분기 제거 (grep 0건 확인 후 제거)
  - 부가 발견·수정: 상세 ⋮ 복사하기 topLoader 미노출 버그(nextjs-toploader가 warm route에서 pushState 즉시 커밋 → start()→done() 페인트 전 붕괴) — `requestAnimationFrame` 지연으로 해결. 동일 패턴을 상세 삭제 확인에도 적용
  - 카드 ⋮ 되돌리기 메뉴(인디케이터 전무, 연타 시 중복 요청 여지) 수정
- 앱 전체 로딩 인디케이터 전수 진단 (19개 지점) — "화면 전환=topLoader / 제자리=버튼 상태" 가설 검증, 17/19 부합. 위중도 축(되돌릴 수 없음/소요시간 김 → 스피너 병기) 추가해 기준 재정의
- 스피너 아이콘 보강 (PR #56 squash `3892eb0`) — `design/loading-spinner-emphasis`
  - 카드 삭제 확인·setup/forgot 메일 발송 3곳에 기존 `Loader2`(lucide) 재사용
  - 발견: 카드 삭제 경로는 낙관적 언마운트+명시적 다이얼로그 닫기가 동일 프레임에 커밋돼 스피너가 dead state — 버그 아님, 상세 삭제 경로는 정상 노출
- SKILL.md 동기화 (PR #57 squash `b9bc557`) — `docs/skill-loading-feedback-sync`
  - §12를 "로딩·액션 피드백"으로 확장, 프로그래매틱 이동 "막대 생략 무방" 서술 정정 + rAF 트릭·navigating 상태 문서화
  - 신규 §12-A "액션 피드백 위계" — 일반 규칙 표 + 사례(되돌리기 아이콘 숨김/삭제·발송 스피너 병기 + 카드삭제 dead state 주석) + "아이콘 숨김 vs 스피너 병기" 축 차이 설명
  - §10-F에 §12-A 크로스레퍼런스 1줄 추가(중복 방지)
  - 문서 전용, 코드 변경 0건
- 모두 lint/build PASS
- 기술 부채 재검증: "활동/장소 생성 구조 비대칭" 항목이 outdated임을 확인(코드 실측 결과 두 생성 경로 이미 대칭, 실제 부채는 훅 미추출·중복만) → CURRENT_STATE 서술 정정
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-10 — activity 방문 기간(시작~종료) 입력 지원

- 사용자 요청 기능 설계 논의: 방문 기간 필요 이유 확인(재방문 이력 아님, 여행처럼 여러 날 걸친 단일 방문) → 단순 기간 확장으로 결정, place는 식음료 단일 방문 컨셉이라 범위 제외
- 진단(Claude Code): `visited_at`이 필터·정렬·통계 어디에도 미사용, 순수 표시/입력용 확인 → 스키마 확장 리스크 낮음 판정
- 마이그레이션 006 (`visited_end_at` date nullable, activities만 + CHECK 제약) Supabase 원격 적용
- Claude(어드바이저)와 목업(Visualizer)으로 토글 UI 3안 비교 후 신규 스위치 컴포넌트(VisitPeriodToggle)로 확정 — 구체 스펙은 SKILL §4-B
- PR #58 squash 머지 (`a618107`), 3커밋 순차 반영 — `feature/activity-visited-date-range`
  - 커밋1(`8f75d91`): 스키마·API·기본 UI, 실 API 레벨 3단 방어(클라/서버/DB) 검증
  - 커밋2(`34ac5c7`): 토글 UI 재설계(신규 스위치 컴포넌트), 카드 기간 표시 축약 포맷 1차
  - 커밋3(`00ea247`): 카드 단일 날짜도 축약 포맷 통일(activity·place 공통, `formatDotDateCompact`)
- 실렌더 실측: 카드 날짜 줄 2줄 감김이 3열 데스크탑(≥1024px)에서만 발생, 모바일·2열은 한 줄 확인 → 현행 유지로 확정. 구체 근거는 SKILL §8-A
- 모두 lint/build PASS, DB 마이그레이션 원격 적용 검증 완료
- 진단 근거·설계 비교 과정 → PROJECT_CONTEXT §11 및 §20

---

## 2026-07-10 v2 — PC 카드 그리드 폭 진단·방문 기간 range 감김 해소

- PC 화면 폭 고민(리스트/추천결과 컨테이너·카드 폭 불일치 의심) 진단 — 세 화면(list/recommend-activity/recommend-place) 컨테이너 896px, 카드 267px로 완전 동일 확인. "들쭉날쭉해 보임"은 정렬·메뉴버튼 유무 등 시각 요인, 폭 정책 문제 아님으로 판정. 그리드 구현(list=CSS Grid, 추천 2종=flex 중복)은 비공유이나 렌더 결과 동일 → 백로그로만 등록
- 방문 기간 range 2줄 감김 원인 진단 — 열 개수 아닌 "메뉴 거터(44px)+별점(88px)" 조합에서만 발생하는 1.55px 경계 초과로 확인
- 별점 sm 크기 축소로 해소 (PR #63 squash `31b243b`) — `design/fix-visited-date-wrap-star-size`
  - `RatingStars.tsx` size=sm: 16px→14px (88px→78px, 별점 md/lg/gap/카드 거터 불변)
  - 사용처 3곳(ActivityCard/PlaceCard/VisitRecordBlock) 전수 확인, 리스트 외 화면 픽셀 영향 없음 확인
  - SKILL.md §10-H(별점 크기)·§8-A(기간 줄바꿈 서술을 "의도적 수용 2줄"→"1줄 해소"로) 갱신, git show --stat으로 반영 확인
  - 실제 토큰·Geist 폰트로 카드 재현 측정(라이브 인증 우회 대신)으로 검증
- lint/build PASS

---

## 2026-07-13 — 홈 검색 바로가기 + 매치 탭 자동 선택

- 홈 상단바(햄버거 왼쪽)에 검색 아이콘 추가, 클릭 시 검색 오버레이(§11 입력 폼 다이얼로그 패턴) 노출 (PR #64 squash `1f70691`) — `feature/home-search-shortcut`
- 제출 시 `/api/activities`·`/api/places` 병렬 조회로 매치 탭 판정 → `/list?tab=X&q=검색어`로 이동
  - 한쪽만 매치 → 그 탭 / 둘 다 있음·둘 다 없음 → activity 기본(크로스세션 마지막 탭 저장소 부재 확인 후 fallback으로 결정)
- `ListView.tsx`에 `q` URL 파라미터 초기값 읽기 추가(SearchBox prefill), 탭 전환 시 검색어 유지는 기존 구조가 이미 지원(수정 불필요 확인)
- 문구 정정 2건: 검색 인풋 플레이스홀더("제목·메모·지역 검색"→"제목·메모 검색", 장소 전용 문구 오적용 수정) / 검색·필터 공용 EmptyState 부제("다른 필터로 시도해보세요"→"다른 검색어나 필터로 시도해보세요")
- SKILL.md 반영 — §6(헤더 아이콘 그룹 구성)·§7(아이콘 글리프 패밀리)·§11(입력 다이얼로그 단일 주행동 CTA 패턴 명문화)
- 모두 lint/build PASS, 4개 시나리오(활동만 매치/장소만 매치/둘 다/둘 다 없음) 실측 검증

---

## 2026-07-13 v2 — 필터 토글 셰브런·로딩 버튼 스피너 통일

- `/list` 필터 토글 버튼에 ChevronDown 고정 표시 추가, 기존 드롭다운 관례(MapLink·Select) 준수 (main 직접 커밋 `1339f3e` — ⚠ 프롬프트에 브랜치 지시 누락으로 PR 미경유, 변경 자체는 저위험). SKILL §7 셰브런 관례 신규 반영
- 로딩 버튼 스피너 전면 통일 (PR #65 squash `ea9df08`) — `design/button-loading-spinner-consistency`
  - SKILL §12-A "제자리 액션은 아이콘 숨김" 예외 폐지 → 로딩 중인 모든 버튼 텍스트 앞 스피너 병기로 단순화. 적용 대상·프리펜드/스왑 배치 구분·사례 → SKILL §12-A 참조
  - 전수 재점검으로 화면 스켈레톤(대상 아님)과 버튼 로딩(대상) 구분 확인, 누락 없음 확정
- 모두 lint/build PASS

---

## 2026-07-21 — 검색 다이얼로그 버그 · 오버레이 대비 · 헤더 아이콘 티어 · TMAP 버그 · 연속 등록 기능

- 검색 다이얼로그 인풋 font-size 14px→16px 수정 (PR #66 squash `0e0e74d`) — `.searchInput`(홈 검색·`/list` 검색바 공유) §4-A·금지 규칙 13 위반 진단 후 수정, iOS 포커스 자동 줌인 해소. 다이얼로그 폭(92% vs 320px) 실험 후 베이스 유지로 결론
- 다이얼로그 오버레이(스크림) 라이트 모드 대비 강화 (PR #67 squash `85aae3a`) — 모든 중앙 모달 공통 적용. "배경-다이얼로그 분리 약함" 관찰 → 기존 §11-B 라이트값 미검증 상태였음 확인 → 실기기 검증 후 확정
- 헤더 내비게이션 아이콘(홈: 검색+메뉴 / 그 외: 홈+메뉴) 전용 탭타깃 티어 `.headerNavBtn` 신설 (PR #68 squash `d734e0d`) — 탭타깃 유지, glyph 22px 확대, gap 축소. 기존 `.iconBtn`(카드 ⋮·로그아웃)은 렌더링 컨텍스트 분리 확인 후 무영향으로 진행
- iOS Safari TMAP 실행 버그 수정 (PR #69 squash `8841759`) — 무조건 뜨던 설치 안내 토스트 제거, 공식 HTTPS 브리지 경유로 올바른 iOS 스킴 실행. Android·기타/네이버·카카오·구글지도는 변경 없음
- 활동/장소 신규 등록에 "저장하고 계속 등록하기" 기능 추가 + 등록 폼 카드 레이아웃 통일 (PR #70 squash `855886e`) — `feat/continuous-registration`
  - 기존 raw fetch 생성 로직 재사용(훅 추출 없이 성공 후 분기만 추가), 계속 등록 시 폼 완전 초기화+토스트, 최종 등록 시 연속 사용 여부로 상세/리스트 라우팅 분기
  - 발단이었던 outline 버튼 가시성 문제는 버튼 스타일 변경이 아니라, 신규 등록 폼을 상세 화면과 동일한 카드(`.card`/`.detailCard`)로 통일하는 근본 해결로 처리 — 상세 편집과 신규 등록이 동일 필드 컴포넌트를 쓰면서도 표면만 달랐던 비대칭 해소
- git 머지 검증 방식 정정 — "Fast-forward" 로그 한 줄만으로 표준 위반 단정 금지, `git show -s --format='%cn %s' <main-tip>`로 committer/`(#숫자)` 접미사 확인이 확정 기준
- 모두 lint/build PASS

---

## 2026-07-22 — 뱃지 역할 문서화·리스트 URL 동기화·신규 등록 returnTo·헤더 아이콘 sticky hover 수정

- `.mealBadge`/`.visitedTag` 역할별 배지 변형 SKILL.md 명시 (PR #71 squash `af87e82`) — 코드 변경 없음, 문서 전용. 실측 결과 두 요소는 색상 토큰(`--s-card-border-strong`/`--s-sub`) 동일, padding·font-weight만 다름을 확인. "복수 정보값 vs 단일 상태 강조"라는 역할 차이에 따른 의도된 변형으로 확정. §1·§8·§10-E 정합화
- SKILL.md 후속 점검에서 `--s-accent-soft-bg` 다크값의 옛 표기(`#2d2540`)를 실제 토큰값 `#573f7f`로 정정하고, 삭제된 `statCardAccent/visitBox` 사용처를 현존하는 `chipActive/optionActive/optionCardActive`로 교체
- `editGhostBtn` 다크 hover와 `visitedTagWishlist` 표의 같은 토큰값도 함께 정정하고, 완료 백로그에서 §10-E 역할별 변형으로 교차참조 추가
- `/list` 검색·필터 URL 동기화 (PR #72 squash `83db5c1`) — 검색어(`q`, 탭 간 공유 유지)·세부 필터(현재 보고 있는 탭만)를 URL에 실시간 반영, `returnTo` 생성 기준을 최초 진입 URL이 아닌 라이브 상태로 변경
- 신규 등록 흐름에 목록 `returnTo` 연결 (PR #73 squash `5d83504`) — FAB·빈 목록 CTA·저장 후 이동(상세 이동·연속 등록 최종 이동 모두 포함) 경로에 원래 목록 URL 전달. 복사하기 흐름은 이번 범위 제외, 기존 동작 유지
- `.headerNavBtn` 모바일 sticky hover 잔상 수정 (PR #74 squash `c17b4e0`) — `hover` 규칙을 `@media (hover: hover)`로 제한(카드·칩·통계 행에 이미 적용된 기존 패턴과 동일하게 맞춤). 검색·홈·메뉴 공용 버그. iOS WebKit sticky hover + 홈/검색 아이콘 좌표 공유 조합이 원인으로 진단됨
- 모두 lint/build PASS. `.headerNavBtn` 건은 브라우저 에뮬레이션(hover:none 시뮬레이션)으로만 검증, iOS 실기기 미검증(Galaxy 실기기 QA와 같은 보류 성격)

---

## 2026-07-24 — Supabase 보안 이슈 2건 해소 (RLS 미설정·함수 search_path 고정)

- Supabase Security Advisor에서 public 앱 테이블 7개의 RLS 미설정 Critical 에러 확인. 프로젝트 생성 당시 레거시 기본 권한이 남아있을 가능성과 `email_tokens` 쓰기 권한을 악용한 패스코드 재설정 위험을 진단
- RLS 활성화, 정책 미추가 (PR #76 squash `a2bb098`)
  - `007_enable_rls.sql`: public 앱 테이블 7개에 RLS 활성화. 정책은 만들지 않아 anon/authenticated 접근을 차단하고 기존 service-role-only 서버 동작 유지
  - 원격 `rls_enabled=true` 7건, 로그인·목록 조회·신규 등록·추천 스모크 테스트 4/4 PASS, Security Advisor Errors 7→0건 확인
- 후속 점검에서 `public.touch_updated_at` 트리거 함수의 search_path 미고정 Warning 확인
- search_path 고정 (PR #77 squash `83f3fe2`)
  - `008_pin_function_search_path.sql`: `search_path = public, pg_temp` 고정, 함수 본문과 트리거 로직 무변경
  - `updated_at` 갱신 스모크 테스트 PASS, Security Advisor CLI·Dashboard 최종 Errors 0 / Warnings 0 확인
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-24 v2 — 카테고리 체계 개편·최상위 타입 표시 라벨 rename

- 활동 카테고리 개편 (PR #78 squash `266c30d`) — `feature/activity-category-rework`: 카테고리를 레저·체험·문화·축제·자연·여행·미분류 7종으로 재편, 등록/편집 폼·`/list` 필터·카드 아이콘에 반영. `npm run build`/`npm run lint` PASS, Supabase 원격 적용·재분류 검증 완료
- 장소 카테고리 개편 (PR #79 squash `167338e`) — `feature/place-category-rework`: 카테고리에 고기를 추가하고 한식 일부를 재분류, 최종 9종 확정. 카테고리 API의 stale 캐시 버그도 함께 수정. `npm run build`/`npm run lint` PASS, Supabase 원격 적용·검증 완료
- 최상위 타입 표시 라벨 rename (PR #80 squash `fd5963f`) — `feature/type-name-rework`: 활동→액티비티, 장소→다이닝으로 앱 전체 표시 텍스트 변경(DB·라우트·변수명은 무변경). `npm run build`/`npm run lint` PASS, 전수 grep 감사로 잔존 문자열 없음 확인
- 배경·설계 근거 → PROJECT_CONTEXT §5·§20

---

## 2026-07-25 — 활동 실내/실외 속성 추가·다이닝 카드 정보 줄 위치 폴백

- 활동 실내/실외 속성 추가 (PR #81 squash `706c917`) — `feature/activity-indoor-outdoor`: `location_type` 필드를 활동 전용 필수값으로 신규 도입, 등록/수정 폼·상세 화면·`/list` 필터·카드 배지에 반영. `npm run build`/`npm run lint` PASS, 기존 데이터 재분류·제약 적용까지 Supabase 원격 검증 완료
- 다이닝 카드 정보 줄 위치 폴백 (PR #82 squash `bdbdc47`) — `claude/dining-card-memo-location-2zjso7`: 다이닝 카드 정보 줄이 메모 없을 때 위치를 대신 보여주도록 액티비티 카드와 동일하게 맞춤. 빌드·린트·타입체크 PASS
- 배경·설계 근거 → PROJECT_CONTEXT §5·§11·§12·§20

---

## 2026-07-27 — 활동 추천 위저드에 실내/실외 단계 추가

- 활동 추천 위저드 실내/실외 스텝 추가 (PR #83 squash `202797d`, 2커밋) — `feature/activity-indoor-outdoor-recommend`: 위저드에 실내/실외 선택 단계 신규 추가, 추천 API 필터·문구에도 반영. `npm run build`/`npm run lint` PASS. 실제 Supabase 환경 브라우저 클릭 테스트는 미실행(세션 환경 제약)
- 배경·설계 근거 → PROJECT_CONTEXT §13·§20

---

## 2026-07-27 v2 — Android PWA 스플래시 아이콘에 브랜드 하트 추가

- Android 홈 화면 실행 시 뜨는 manifest 기반 자동 스플래시에 패스코드 화면과 동일한 브랜드 하트 반영, `manifest.json`이 참조하던 `icon-192.png`/`icon-512.png` 실물 파일 누락 이슈도 함께 해소 (PR #87 squash `e382af2`) — `fix/android-splash-icon-heart`. 정적 이미지, 배경색·앱 이름 표시 로직 변경 없음. iOS는 manifest 기반 자동 스플래시 미지원으로 범위 제외
- `npm run build` PASS, 생성 PNG 사용자 직접 확인(스크린샷). 실기기 Android 홈 화면 스플래시 확인은 세션 환경 제약으로 미실행(다음 세션 권장)
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-07-28 — 추천위저드 뒤로가기 정합성 확보(PR #88~90) + 기술 백로그 그룹 4 종결

- 위저드 단계별 URL 히스토리 도입 (PR #88 squash `e60ec50`, 2커밋) — `feature/recommend-wizard-step-history`: pushState/popstate 기반 단계 전환으로 브라우저 뒤로가기 시 직전 단계로 정확히 복귀, 후속 커밋(`86dc7d2`)에서 이전 버튼·뒤로가기 선택값 표시 불일치 해소. `npm run build`/`npm run lint` PASS, Playwright 30개 어서션 PASS
- returnTo 확장 + 네비게이션 라벨 통일 (PR #89 squash `8a30198`, 2커밋) — `feature/recommend-returnto-and-label-unify`: returnTo 화이트리스트에 위저드 결과 경로 추가해 상세 복귀 라벨 "목록으로"/"추천 결과로" 분기, 위저드 상단 버튼 "처음부터" 통일, 다이얼로그 sr-only "닫기" 통일. 후속 커밋(`920fbee`)에서 결과 재조회를 `resultCache` 기반 복원으로 교체. SKILL §13 신규(git show --stat 확인), `npm run build`/`npm run lint` PASS, Playwright 70개 어서션 PASS
- 위저드 1단계 상단 버튼 라벨 분기 (PR #90 squash `6024119`) — `fix/wizard-first-step-button-label`: 1단계="홈으로", 2단계 이상="처음부터"로 조건 분기. SKILL §13 반영(git show --stat 확인 완료), `npm run build`/`npm run lint` PASS
- 기술 백로그 그룹 4(네비게이션 라벨 잔여: "이전"·"취소"·신규등록 조건부 라벨) 진단 후 종결 — 3건 모두 SKILL §13에 이미 부합해 코드 수정 없음
- 배경·설계 근거·교훈 → PROJECT_CONTEXT §13·§20

---

## 2026-07-29 — 자동화 테스트·CI 도입 + P2 리팩터 배치(dark/hover/focus·추천위저드 히스토리·폼-API 검증)

- 자동화 테스트·GitHub Actions 도입 (PR #91 squash `ce99df4`) — 프로젝트 최초 Vitest 단위 테스트 42건 + Playwright E2E 2건, `.github/workflows/ci.yml` 신규(verify+e2e job). lint/test/build/test:e2e 전부 PASS
- dark/hover/focus 상태 정합화 (PR #93 squash `4c58323`) — 기술 백로그 그룹 1·2 착수: 죽은 Tailwind `dark:` 클래스 제거, shadcn Button 전 variant의 focus-visible 링을 다크 대응 토큰으로 통일, `.detailDeleteBtn` 라이트 hover 정합(사용자 사인오프 확인). SKILL.md §5 갱신. lint/test(42)/build/E2E PASS
- 추천위저드 History/URL 동기화 공통화 (PR #94 squash `b91b056`) — 활동·다이닝 위저드에 중복돼 있던 URL↔state 동기화·History API·결과 캐시 복원 로직을 공통 훅/유틸로 추출. URL 파라미터·캐시 정책·사용자 동작 무변경. test(45)/build/E2E PASS
- 폼-API 입력 검증 정합화 (PR #95 squash `f2055eb`) — activities·places API 입력 검증 스키마를 공유 모듈로 통합, GET 쿼리 검증 추가, 잘못된 입력을 500 대신 400으로 통일. 폼 submit 에러 처리도 안전화. tsc/lint/test(81)/build/E2E PASS
- 핸드오프 문서(CURRENT_STATE·CHANGELOG·PROJECT_CONTEXT) 오늘자 반영 (PR #96·#97, 문서 전용)
- 현재 상태 → PROJECT_CONTEXT §2·§5

---

## 2026-07-30 — 다녀온 곳 정렬 보정 + 네이밍 용어 매핑 + 다크 hover 진단·기술 백로그 그룹 1 종결 + 기술 백로그 그룹 3 실측·처리

- `/list` 다녀온 곳 정렬 보정 (PR #99 squash `1718710`) — `status=visited` 목록을 방문일(`visited_at`) 최신순, 동일하면 마지막 수정(`updated_at`) 최신순으로 정렬. 위시리스트는 기존대로 등록(`created_at`) 최신순 유지. PROJECT_CONTEXT §12 갱신
- 네이밍 용어 매핑 pointer 추가 (PR #100 squash `256ed7f`) — 코드 식별자(`place`/`activity`) ↔ 노출 라벨("다이닝"/"액티비티") 매핑(PR #80에서 이미 확정)을 SKILL.md 상단과 `src/types/index.ts`에도 짧은 주석으로 추가해 어느 문서를 먼저 봐도 찾을 수 있게 함
- 다크 hover 진단 + 기술 백로그 그룹 1 종결 (PR #101 squash `b197944`) — 전수 진단 결과 "다크 hover 2계열 분리 검토" 항목은 실제 통일 대상이 없었음을 확인: `.iconBtn`/`.headerNavBtn`/`.dialogCloseBtn`/`.editGhostBtn`/`.mapActionBtn`의 다크 hover가 라이트와 다른 토큰(중성→accent)을 쓰는 건 SKILL §5-A가 이미 확정한 의도된 구분, `.detailDeleteBtn` 텍스트색이 다크에서도 고정인 것도 §5-B가 이미 명시한 설계. Playwright 실제 렌더 픽셀 샘플링으로 실측한 결과(라이트 CR≈3.18/다크 CR≈4.37)도 다크 쪽 접근성 문제를 뒷받침하지 않음. 코드 동작 변경 없이 각 규칙에 SKILL §5-A 참조 주석만 보강. 유일한 실제 조치는 코드베이스에 마지막까지 남아있던 dead Tailwind `dark:` 클래스 — 미사용 컴포넌트 `select.tsx`/`tabs.tsx`를 삭제해 완전히 제거. SKILL §5-B의 stale 수치(`.detailDeleteBtn` 라이트 hover 표 `/0.15`로 남아있던 것 — PR #93에서 실제로는 `/0.1`로 바뀐 뒤 표 갱신 누락)도 함께 정정. lint/tsc/test(81)/build PASS
- 기술 백로그 그룹 3 실측·처리 (PR #103 squash `a89817e`) — `chore/card-grid-decision-and-badge-spacing-token`: PROJECT_CONTEXT §19 그룹 3의 위저드 h1 수렴·카드 그리드 통합·spacing 토큰 표준화·`/list` 서버 prefetch 4건을 Playwright 렌더 측정으로 실측·분류. 위저드 h1은 stale로 종결, `/list` prefetch는 SKILL §12 확정 규칙과 충돌해 보류. 카드 그리드는 사용자 확인 후 의도된 예외로 SKILL §3-B 신규 문서화(코드 변경 없음), spacing 토큰은 `.mealBadge`/`.visitedTag`의 padding만 `--s-badge-padding-*-info`/`-status` 토큰으로 승격(값 무변경, light/dark computed style로 픽셀 불변 확인, PR #71 역할 분리 유지·병합 없음). lint/test(81)/build PASS
- 핸드오프 문서(PROJECT_CONTEXT·CURRENT_STATE·CHANGELOG) + SKILL.md 오늘자 반영
- 배경·진단 근거 → PROJECT_CONTEXT §5·§12·§19·§20

---

## 2026-07-31 — `.mealBadge` 텍스트 색 대비 보정 + 액션 버튼 Tier A/B 통일

- `.mealBadge` 텍스트 색 승격 (PR #105 squash `ace0e3c`) — `design/meal-badge-color-ink`: 같은 화면 `DetailRow`(지역·위치, `PlaceDetail.tsx`)가 `--s-ink`인데 `.mealBadge`만 `--s-sub`라 상대적으로 흐려 보이던 것을 `--s-ink`로 승격(`font-size` 12px·`font-weight` 400 상속은 무변경). SKILL §8(`.mealBadge` 의도된 예외)·§10-E(역할별 배지 변형 표에 텍스트 색 컬럼 분리) 갱신. `npm run lint`/`build` PASS, Playwright `getComputedStyle`로 라이트/다크 `--s-ink` 값 실측 일치 확인
- Primary(보라) 버튼·그 외 액션 버튼 전수조사 2회 + Tier A/B 통일 (PR #106 squash `3a05c31`) — `design/button-tier-consolidation`: 보라 버튼 15곳, 그 외 outline/ghost/destructive/아이콘/인증 버튼 전부를 두 차례 전수조사해 텍스트·풀폭 액션 버튼의 높이 위계를 **Tier A(화면/다이얼로그 풀폭 핵심 액션, 40px)/Tier B(인라인·컨텍스트 보조 액션, 36px)** 두 단계로 확정. 기존 48px였던 4개 지점(`FormLayout.tsx` 등록 버튼, `HomeSearchButton.tsx` 검색, `VisitedDialog.tsx` 저장하기)과, 높이 미지정으로 기본 32px 렌더 중이던 `ActivityDetail.tsx` 되돌리기 다이얼로그의 취소/확정 페어를 Tier A/B 값으로 정렬. 색(단색 채움/outline/ghost)은 위계 표현용일 뿐 높이와 독립임을 확정. 아이콘 버튼 5종(44/36/28/56/24px)과 위저드 "처음부터"/"홈으로" 구현 방식 불일치는 범위 밖으로 분리해 PROJECT_CONTEXT §19 백로그에 신규 등록. SKILL §4-A 전면 재작성(Tier A/B 표 + 판단 기준, 입력 컨트롤 표 분리). `npm run build` PASS. Vercel 프리뷰 4개 화면 실기기 확인은 세션 환경 제약으로 미실행
- 배경·진단 근거 → PROJECT_CONTEXT §19·§20

---

## 2026-08-01 — 되돌리기 확인 다이얼로그 4곳 통일

- 되돌리기 확인 다이얼로그 통일 (PR #108 squash `70b7d09`) — `fix/revert-to-wishlist-consistency`: "가보고 싶은 곳으로 되돌리기"가 `ActivityDetail.tsx`에만 확인 다이얼로그를 갖고 `ActivityCard`/`PlaceDetail`/`PlaceCard` ⋮ 메뉴 3곳은 곧장 실행되던 불일치를 사용자 스크린샷 관찰로 진단(삭제 확인엔 있는 공유 컴포넌트가 되돌리기엔 없어 개별 구현마다 갈려 있었음). `RevertConfirmDialog` 공유 컴포넌트로 4곳 통일하고, patch도 4곳 모두 `{ status: 'wishlist' }`만 전송해 별점/후기/방문일을 보존(재전환 시 `VisitedDialog`가 프리필)하도록 정정. 다이얼로그 문구는 사용자 확인을 거쳐 "방문기록(방문일, 별점, 후기)이 모두 삭제됩니다."로 확정
- SKILL.md §4-A(다이얼로그 출처)·§4-B(필드 보존 정정)·§10-H(문구)·§12-A(스피너 위치: 트리거 아닌 다이얼로그 확정 버튼) 갱신
- `tsc`/`eslint`/`next build` PASS. 브라우저 실행 검증은 `.env.local`(Supabase) 부재로 세션 환경에서 미실행, 코드 리뷰로 대체 확인
- 배경 → PROJECT_CONTEXT §5

---

## 2026-08-05 — Capacitor 네이티브 앱 초기화 + 브랜드 아이콘/스플래시 반영

브랜치: `chore/capacitor-init` (미머지, 실기기 확인 후 머지 예정)

- Capacitor 8.x iOS + Android 네이티브 셸 초기화, App ID `com.perilab.todaydate` 확정 (`e159d31`)
- `@capacitor/assets` v3.0.5 Custom Mode로 브랜드 하트(라벤더 `#f5f3ff` 배경) 아이콘·스플래시 일괄 생성 (`013e3db`); SVG viewBox `-7.23 -7.23 38.46 38.46`으로 조정해 PWA 아이콘 여백 비율 일치(좌우 ~24%) (`d63d564`)
- iOS 아이콘 배경 흰색→라벤더 수정: `--iconBackgroundColor '#f5f3ff'` 플래그 명시 재생성 (`09f2183`); `cap sync` PASS, iOS/Android 아이콘 네 귀퉁이 픽셀 샘플링 검증 완료
- `.gitignore` Xcode SPM 캐시 경로 추가 (`7e576be`)
- 진단 근거·교훈 → PROJECT_CONTEXT §20

---

## 2026-08-07 — iOS safe-area 토스트/로더 수정 + Android 릴리즈 서명 (PR #111, #112)

- PR #111(`main`): `nextjs-toploader` 진행바 + `sonner` 토스트가 iOS 노치/다이나믹 아일랜드 카메라 하우징에 가려 안 보이던 문제 수정. `#nprogress .bar/.spinner`에 `env(safe-area-inset-top)` 오버라이드(라이브러리가 동일 specificity 인라인 스타일을 더 늦게 주입해 `!important` 필요), `<Toaster>` `offset`/`mobileOffset`에 `calc(env(safe-area-inset-top) + 16px)` 적용. `viewportFit:'cover'`가 이미 main에 있어 PWA(홈 화면 추가) 사용자도 동일 영향. 실기기(iPhone 17 Pro) 확인.
- PR #112(`chore/capacitor-init`): Android 릴리즈 서명 설정 — `keystore.properties` 기반 `signingConfig`을 `build.gradle`에 추가, keystore 파일·properties는 git 제외. `assembleRelease` 서명 빌드·`apksigner verify`(v2 서명)·Pixel 10/API 36 에뮬레이터 설치·실행까지 확인.
- PR #110(`docs/capacitor-handoff-260805`) 백필 문서가 `main`에 반영됨.

---

## 2026-08-09 — 네이티브 부팅 스플래시 오버레이 도입 (PR #113, #114)

- `NativeBootOverlay`(기존 `BrandHeader` 재사용, `Capacitor.isNativePlatform()` 가드로 웹/PWA에는 렌더 안 함) 신규 — 네이티브 스플래시 화면과 첫 페인트 사이를 웹 오버레이로 이어주고, 마운트 완료 시 `@capacitor/splash-screen`의 `SplashScreen.hide()`로 네이티브 스플래시를 닫는다.
- PR #114(`main`): 웹 전용 부분만 먼저 분리 병합 — `capacitor.config.ts`, Android/Ios 네이티브 스플래시 리소스는 의도적으로 제외(당시 `chore/capacitor-init` 쪽 네이티브 작업이 아직 미병합이었기 때문).
- PR #113(`chore/capacitor-init`): `@capacitor/splash-screen` 네이티브 플러그인 등록, Android 12+ SplashScreen 테마가 원형 런처 아이콘 배지로 폴백되던 버그 수정, 하트+타이틀 전용 스플래시 아이콘(Android)·`Splash.imageset` 교체(iOS, `scaleAspectFill` 크롭 대응 사이즈)로 네이티브 스플래시와 웹 오버레이의 시각적 이음매를 맞춤. Android 에뮬레이터(Pixel 10)·iOS 시뮬레이터(iPhone 17 Pro) 콜드 스타트로 색·위치 점프 없음 확인.

---

## 2026-08-09 v2 — 스플래시 콘텐츠 비율 실측 보정 + 다크모드 지원 (PR #115)

- iOS 스플래시 콘텐츠 폭을 처음엔 임의 목표치(13~15%)로 설정했다가, 실제 `/setup` 페이지(`NativeBootOverlay`와 동일 `BrandHeader`)의 타이틀 폭을 직접 재측정하니 35.28%였던 것을 발견 — 이 실측값을 `scaleAspectFill` 크롭 비율(46.1%)로 역산해 콘텐츠 폭 16.39%로 재보정(`8a660fe`). Android는 56.4%로 별도 보정.
- `NativeBootOverlay`의 다크모드 하트 그라데이션 버그 수정(`d3f6be9`) — `--heart-from`/`--heart-to`가 `auth.module.css`의 `.page` 클래스 스코프에서만 정의돼 있어, `.page` 조상 없이 렌더되는 오버레이에는 상속되지 않던 문제.
- Android `drawable-night` + `values-night` 스타일, iOS `Splash.imageset` dark appearance variant 추가(`e741d0d`) — 라이트 스플래시 PNG를 "그라데이션 위치 보존 픽셀 리컬러"로 다크 팔레트로 변환(재크롭 없음, 콘텐츠 비율 byte-identical).
- PR #115 fast-forward 머지 (`chore/capacitor-init`).

---

## 2026-08-10 — 다크모드 CSS 프로덕션 미배포 발견·수정 (PR #117)

- 실기기 다크모드 콜드 스타트에서 `NativeBootOverlay` fade-out 구간(~0.6초)에 라이트 톤이 짧게 노출되는 현상을 발견해 진단. 단계적으로 CSS 특이성 충돌·`z-index:-1` 페인팅 순서·WKWebView 네이티브 배경색 미설정을 후보로 조사했으나, 최종 원인은 훨씬 단순했다: 다크 CSS 수정(`d3f6be9`, PR #115)이 `chore/capacitor-init`에만 머지돼 있었고 **프로덕션(`main`, Vercel)에는 배포된 적이 없었음**. `capacitor.config.ts`의 `server.url`이 프로덕션 URL을 가리키므로, 실기기 테스트는 로컬 소스 수정과 무관하게 항상 구버전 CSS로 실행되고 있었다.
- `d3f6be9` 한 커밋만 cherry-pick해 `main` 기준 새 브랜치(`feature/native-boot-overlay-dark-web`)로 분리(네이티브 전용 변경은 의도적으로 제외), PR #117 squash 머지 → Vercel 프로덕션 재배포(`success` 확인).
- 재검증: 방어적으로 준비해뒀던 네이티브 WKWebView 배경색 수정(`BootBridgeViewController`, `UITraitCollection` 기반 다크/라이트 동적 배경)을 **적용하지 않은 상태**로 실기기 150프레임 고속 연속 캡처(~27.5초, 네이티브 스플래시→오버레이→fade-out→대시보드 전 구간) 결과 라이트 톤 미검출 — 배포 갭이 근본 원인이었고 네이티브 수정은 불필요하다는 결론. 관련 미커밋 변경사항(`BootBridgeViewController.swift`·`Main.storyboard`·`project.pbxproj` 수정분)은 최종 폐기(260811).

---

## 2026-08-11 — iOS AppIcon 다크모드 variant 병합 (PR #116)

- `AppIcon.appiconset/Contents.json`에 dark luminosity appearance 항목 추가(`26681cd`) + `ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS` 빌드 세팅 추가(`9f8f443`) — 이 세팅이 없으면 `Contents.json`에 dark variant를 선언해도 Xcode가 컴파일된 `Assets.car`에서 제거해버림(`xcrun assetutil --info`로 dark rendition 존재 확인).
- Home Screen 아이콘이 다크모드에서도 라이트로 보이는 잔여 증상은 앱 코드 문제가 아니라, iOS 18+ "홈 화면 아이콘 모양"이 시스템 다크모드와 **별개의 사용자 Settings 토글**이라는 것으로 확인 — 앱이 강제할 수 없는 영역.
- 별개로 관찰된 앱 실행 아이콘-줌 전환(SpringBoard 런치 애니메이션) 중 "하트만 있고 타이틀 없는" 라이트 톤 짧은 노출은, `Splash.imageset`과는 다른 시스템 전환 단계에서 AppIcon 어피어런스 variant를 반영하지 못하는 iOS 플랫폼 제약으로 추정되나 코드 레벨로 확정·수정하지 못함 — 오픈 이슈로 남김.
- PR #116 fast-forward 머지(`chore/capacitor-init`, `9f8f443`), `feature/dark-app-icon` 브랜치 정리.

---

## 2026-09-04 — 커플 앱 전환용 couples/users 스키마 추가 + 단일 워크스페이스 백필 (012, 013)

- `012_couples_users_schema.sql`(PR #118 squash `897b9ce`) — 순수 additive 스키마: `couples`(`passcode_hash`/`failed_attempts`/`locked_until`/`session_version`)·`users`(`couple_id` FK NOT NULL cascade·`email` unique·`email_verified`) 신규, `email_token_purpose` enum에 `invite_partner` 추가, `activities`/`places`/`recommendations_log`에 `couple_id` nullable FK(**on delete restrict**) + 인덱스. `app_config`와 그에 의존하는 인증 로직(`middleware.ts`, `/api/auth/*`)은 한 줄도 안 건드림 — `src/` 변경 0줄, 신규 테이블·컬럼은 아직 어떤 앱 코드도 참조하지 않는 이중 보관 상태.
- `013_couples_backfill.sql` — `app_config` 단일 row를 `couples` 1행·`users` 1행(`recovery_email` 승계)으로 복제, 세 도메인 테이블의 `couple_id` NULL 행을 백필. 백필 UPDATE가 `touch_updated_at` 트리거를 발동시켜 `updated_at`(목록 정렬 기준)을 덮어쓰는 걸 막기 위해 트리거를 일시 비활성화 후 원복.
- `activity_categories`/`place_categories`는 대상에서 의도적으로 제외 — 마이그레이션 시드 전역 참조 데이터라 지금 백필하면 카테고리가 1번 커플 소유가 되어 두 번째 커플이 카테고리 0개로 시작한다. `email_tokens`도 제외 — 이메일로만 대상을 식별하는 인증 보조 테이블.
- 첫 적용에서 검증 블록 SQL 구문 오류(`VALUES`+`string_agg` 조합을 SQL Editor가 릴레이션으로 오해) 발견 → 개별 `if not exists` 검사로 교체, 단일 트랜잭션 전량 롤백 실측 확인. 이어서 민감값(패스코드 해시·복구 이메일) 비교를 `null` 하드코딩이 아니라 DB 안에서 boolean 비교해 `::text`로 내보내는 방식으로 정정. **라이브 DB 적용 완료.**
- 진단 근거·couple_id 대상 판단 기준 → PROJECT_CONTEXT §20

---

## 2026-09-07 — 인증 단일 출처를 app_config에서 couples/users로 전환

- PR #119 squash `c9845e7` — 앱 코드가 읽고 쓰는 인증 상태를 `app_config`(단일 row)에서 `couples`/`users`(다중 row)로 전환. `app_config`는 삭제하지 않고 동결 백업으로 DB에 남김 — 이후 앱 코드는 읽지도 쓰지도 않는다.
- `src/lib/auth/couple.ts`(신규) — couples/users 조회·갱신 계층. 커플 특정 경로는 세션 `couple_id`/이메일/"유일한 커플" 셋뿐이고 `id=1` 같은 고정 키는 쓰지 않는다. `getSoleCouple()`은 커플이 정확히 1개일 때만 값을 반환, 여러 개면 임의로 고르지 않고 403.
- `SessionData`에 `user_id`/`couple_id` 추가. `middleware.ts`는 설정 완료 게이트를 NONE/SOLO/PAIRED 상태 판별로 확장(PAIRED는 판별만, 처리는 SOLO와 동일 — TODO). `session_version` 검증은 세션의 `couple_id`로 해당 커플을 찾아 비교, 조회 실패(일시적 DB 장애)는 전환 이전처럼 통과시켜 전 기기 로그아웃을 방지. `couple_id` 없는 구쿠키(전환 이전 세션)는 만료 처리 → 기존 기기는 재로그인 1회 필요(회귀 아님, 의도된 1회 비용).
- `/api/auth/{setup/send-verify,setup/verify,setup/passcode,unlock,forgot,reset}` couples/users 기준 전환. `logout`은 DB를 안 봐서 무변경.
- 검증: lint/유닛(92, 상태 판별 11개 신규)/build/E2E 통과 + 실 프로덕션 데이터(SOLO)에 새 미들웨어를 읽기 전용으로 붙여 쿠키 없음/구세션/불일치/신규 세션 4가지 경로 확인.

---

## 2026-09-07 v2 — activities/places/recommendations_log 커플 데이터 격리

- PR #120 squash `4ad7397` — 013 백필로 `couple_id`는 전 행에 채워져 있었지만 CRUD 라우트가 그 값을 필터로 안 써서, 인증만 통과한 요청이 다른 커플의 행을 읽고 쓸 수 있던 취약점 해소.
- 조회(SELECT): 목록·상세·대시보드 집계·추천 후보 풀·추천 로그 전부 `.eq('couple_id', session.couple_id)`. 생성(INSERT): `couple_id`를 세션값으로 명시 대입(Zod 스키마에 없어 클라이언트 값은 이미 떨어지지만 라우트에서 한 번 더 못박음). 수정/삭제(UPDATE/DELETE): 신규 `isRowOwnedByCouple`로 소유권 사전 확인 후 아니면 **404**(403이 아님 — id 열거로 남의 데이터 존재를 알려주지 않기 위해), 실행 쿼리에도 `couple_id` 조건을 함께 걸어 확인-실행 사이 경합 차단(PostgREST의 UPDATE/DELETE는 0건 매칭도 오류가 아니므로 조건만 걸면 "0건 변경+200 성공"이 됨).
- 세션의 커플 확정은 `requireCoupleScope()` 한 곳으로 모음 — `.eq('couple_id', undefined)`가 조건 없는 전체 조회가 되는 사고를 막기 위한 이중 방어. 데이터 계층(`getActivityById`/`getPlaceById`/`getDashboardStats`/`recommend*`)은 `coupleId`를 필수 인자로 받아 호출부 누락을 타입 검사에서 잡음.
- 검증: 인메모리 PostgREST 대역(`src/test/fakeSupabase.ts`)에 가상 커플 B 행을 심고 커플 A 세션으로 실제 핸들러를 실행하는 30개 테스트, 응답 코드뿐 아니라 DB 최종 상태까지 확인. 격리 로직을 하나씩 되돌리는 변이 10종 전부 실패로 잡힘.
- `couple_id` NOT NULL 승격은 범위 밖으로 분리 → CHANGELOG 2026-09-08

---

## 2026-09-08 — couple_id NOT NULL 승격(014) + 대시보드 장애 처리 + 실 라우트 E2E 하네스

3개 독립 커밋(PR #121 squash `e67ea24`).

- **`couple_id` NOT NULL 승격(014)** — PR #120에서 "앱의 모든 쓰기 경로가 couple_id를 채운다" 조건이 충족돼 보류가 풀림. 승격 전 세 테이블 NULL 행을 각각 세어 0건 아니면 중단(부분 승격 방지, 실패 시 전체 롤백), 선행 조건도 컬럼별 개별 확인, 이미 NOT NULL인 컬럼은 멱등하게 스킵. 로컬 Postgres 부재로 SQL 사전 실행 불가 — 멱등성·롤백 경계·검증 블록으로 안전성 확보 후 Supabase SQL Editor에서 적용(**라이브 DB 적용 완료**).
- **대시보드 DB 오류 처리** — `getDashboardStats`가 8개 집계 쿼리의 error를 검사 안 하고 `count ?? 0`으로만 읽어, DB가 완전히 죽어도 200+전부 0이 나가던 버그 수정(빈 워크스페이스와 장애를 구별 못 하는 응답). 8개 결과 error를 모두 검사해 하나라도 있으면 던지고, 실패한 집계 이름을 메시지에 담음. 단위 테스트 4개 추가.
- **PostgREST 스텁 기반 실 라우트 E2E 하네스(신규)** — 기존 e2e는 `page.route()`로 `/api/*`를 브라우저에서 가로채 라우트 핸들러·미들웨어·데이터 계층에 요청이 도달하지 않았다. `e2e/stub/server.mjs`(PostgREST HTTP 스텁, `.single()`의 406 PGRST116·UPDATE/DELETE 0행 무오류·컬럼 DEFAULT/NOT NULL 등 와이어 규약 재현)를 세우고 Next의 `SUPABASE_URL`을 그쪽으로 돌려 브라우저→Next 서버→미들웨어→라우트→supabase-js→스텁까지 전 구간을 실제 HTTP로 흐르게 함. 실 Supabase 접속이 없어 CI에서 시크릿 없이 상시 실행. `e2e/db/isolation.spec.ts` 신규 19개(커플 A/B 교차 침범: 목록·상세·404·PATCH/DELETE·couple_id 무시·초대 없는 신규가입 SOLO 회귀 등), 격리 로직 되돌리기 변이 7종 전부 실패로 잡힘. 기존 mocking 기반 E2E(비인증 UI 흐름)는 `chromium` 프로젝트로, DB 스펙은 상태 공유 때문에 `chromium-db`(`fullyParallel: false`)로 분리.
- 이 세 번째 커밋으로 `src/test/*` 유닛 테스트와 병행해 두 계층(유닛=로직, e2e-db=실 HTTP 경로) 검증이 갖춰짐 → PROJECT_CONTEXT §2 기술 스택 갱신 필요

---

## 2026-09-08 v2 — 홈 화면에 error.tsx 오류 경계 추가

- PR #122 squash `2f7c3d1` — 직전 PR에서 `getDashboardStats`가 DB 오류를 throw하게 바뀌었지만 홈 서버 컴포넌트엔 받을 경계가 없어 Next 기본 오류 화면이 뜨던 문제 수정. `/`를 `src/app/(home)/page.tsx`로 옮기고 같은 라우트 그룹에 `error.tsx` 추가 — 라우트 그룹은 URL에 흔적을 안 남기므로 경로는 그대로 `/`, 경계는 홈에만 스코프(`src/app/error.tsx`에 두면 `/list` 등 무관한 화면까지 묶임).
- 디자인은 기존 시스템 재사용: `PageHeader` 공용 헤더, `pageTitle`/`pageSubtitle` 타이포 토큰, `CloudOff` 아이콘을 `styles.faint`(경고성 빨강 대신 EmptyState 어휘), 재시도 버튼은 `styles.detailPrimaryBtn`.
- **재시도는 `reset()`만으로 동작하지 않음을 실측 확인**: Next 14.2.35 프로덕션 빌드에서 이 라우트가 한 번 던진 뒤 `router.refresh()`의 RSC 전용 재요청(`?_rsc=`)이 DB 복구 여부와 무관하게 항상 이전 오류 페이로드를 반환(curl로 재현). RSC 헤더 없는 일반 최상위 GET(주소창 새로고침과 동일 경로)만 매번 새로 실행됨을 확인 → 재시도는 `reset()`으로 경계 상태를 지운 뒤 `window.location.reload()`로 최상위 GET을 강제.
- 검증: 프로덕션 빌드를 `SUPABASE_URL` 죽은 상태로 띄워 오류 화면 렌더 확인, PostgREST 스텁을 그 사이 올려 재시도가 실제로 정상 대시보드 복구하는 것까지 Playwright로 확인. `npm run ci`, e2e 21건 통과.

---

## 2026-09-08 v3 — 파트너 초대로 SOLO → PAIRED 전환 (015)

- PR #123 squash `4d1d221` — 커플에 두 번째 사용자를 붙이는 경로. SOLO(멤버 1명)에서 PAIRED로 넘어가는 세 갈래(초대 발송·초대 수락·자가가입 시 대기 초대 확인)를 모두 구현.
- **스키마(015)** — `email_tokens.couple_id` 추가(nullable, on delete cascade) + 인덱스 2종. 012는 `email_tokens`를 couple_id 대상에서 의도적으로 제외했었다("이메일로만 대상을 식별하는 인증 보조 테이블") — `verify_email`/`reset_passcode`/`change_email`은 그 판단이 지금도 맞지만(`target_email → users → couple`로 유도 가능), `invite_partner`만 다르다: 발송 시점에 `target_email`이 아직 `users`에 없어(있으면 초대를 막음) 토큰에서 커플을 유도할 방법이 없으므로 ①수락 시 붙일 커플 ②재초대 시 폐기 대상을 이 컬럼으로만 특정한다. **라이브 DB 적용 완료**(SQL Editor 직접 실행 + 검증 8개 전부 pass).
- **발송**(`POST /api/auth/invite`, SOLO 전용) — 커플은 세션에서만 온다(`requireCoupleScope`, 본문의 `couple_id`는 안 읽음). PAIRED면 토큰조차 안 만들고 409. 이미 어느 `users` 행에 있는 이메일이면 발송 자체를 막음(409, 남의 계정 이메일로 초대 메일이 날아가는 것 방지). 재초대 전 그 커플의 대기 초대를 폐기(`createToken`의 정리가 `(purpose, target_email)` 기준이라 대상 이메일을 바꿔 재초대하면 옛 초대장이 살아남음). 24시간 토큰 + 기존 Resend 인프라.
- **수락**(`/invite?token=...`, 인증 전 개방 — 미들웨어 `OPEN_PREFIXES`의 TODO를 실제로 열었다) — 토큰 검증 후 PAIRED·이메일 중복을 다시 확인(24시간 사이 상태 변화 대응). `users` 행을 `email_verified=true`로(링크 클릭이 메일함 소유 증명), 패스코드는 새로 안 만들고 커플의 기존 `passcode_hash`를 그대로 씀. 서명된 pending-user 쿠키를 남기고 `/lock`으로 리다이렉트(패스코드가 커플 단위 하나라 `unlock`이 "누가 입력했는지" 알 수 없어, 쪽지가 없으면 방금 합류한 사람이 파트너의 `user_id`로 세션을 받는 문제 방지). 리다이렉트 Location은 상대 경로(`req.url`이 Next 내부 주소를 가리켜 절대 URL로 만들면 오리진이 갈라져 방금 심은 쿠키가 유실 — e2e가 세션 쿠키의 user_id로 이 회귀를 잡음).
- **자가가입 시 대기 초대 확인**(`send-verify`) — 커플 생성 전에 `findPendingInvite`를 먼저 확인(여기서 새 커플이 생기면 `users.email` 전역 unique 때문에 초대 링크를 눌러도 합류가 영구히 막힘). 대기 초대가 있으면 같은 커플로 재발급하고 화면은 "초대 수락" 안내로 분기.
- **화면** — SOLO 홈에 "파트너 초대" 진입 행(PAIRED에서는 렌더 안 함), `/partner` 이메일 입력, `/lock`이 초대 결과 배너(성공/만료/중복/이미 PAIRED) 표시.
- 검증: `e2e/db/isolation.spec.ts`에 19개 시나리오 추가(새 파일 안 만듦 — 스텁 상태가 프로세스 하나에 공유되므로 파일이 갈리면 워커가 나뉘어 상태가 섞임), solo/paired 시드 추가(실제 bcrypt 해시 포함). 변이 검증 11건 중 10건이 스펙에 잡히고, 남은 1건(수락 시 이메일 재확인 무력화)은 `users.email` 전역 unique가 같은 결과를 만들어 통과 — 의도된 이중 방어로 스펙 주석에 기록. `npm run ci` 통과(단위 126건), e2e 40건 통과.
- 배경·설계 근거 → PROJECT_CONTEXT §1·§2·§20

---

## 2026-09-09 — 파트너 정보 화면 + 초대 진입점 계위 분리

- PR #124 squash `f058ee9` — 홈의 "파트너 초대"가 통계 리스트 안 한 행에 섞여 있던 것(콘텐츠를 반복 열어보는 통계 행과, 계정을 한 번 세팅하는 온보딩 액션은 성격이 다름)을 분리. 삼선 메뉴는 "선언 배열 → 단일 렌더"로 재구성(이동/실행 두 종류로 못박고 표면은 공통 클래스가 맞춤 — 항목이 늘어도 모양이 안 갈림). 이동 항목은 base-ui `Menu.LinkItem`을 감싼 `DropdownMenuLinkItem`으로 실제 `<a>` 렌더.
- PAIRED일 때만 삼선 메뉴에 "파트너" 항목이 보이고 `/partner/info`가 "세션 user_id가 아닌 나머지 한 명"의 이메일·가입일을 보여준다. 상대를 고르는 판정(`pickPartnerUser`)은 화면과 `/api/partner`가 공유하는 한 곳에 둠 — 후보가 정확히 1명이 아니면(SOLO·데이터 이상·비멤버 세션) null로 닫아 남의 이메일을 고르지 않는다. 초대 화면(`/partner`)이 PAIRED를 홈으로 되돌리는 것과 대칭으로, 이 화면은 상대가 없으면 홈으로 되돌림.
- **초대 진입점 → 상태 안내 배너로 표면 분리(후속 커밋)** — 카드 표면(흰 면+그림자+hover 부상)을 쓰는 동안은 추천 CTA·통계 행과 대등한 "기능 버튼"으로 읽혔다. accent 틴트 면 + 틴트 보더, 그림자·부상 없는 `styles.notice`로 분리하고 자리도 CTA **위**(제목 바로 아래)로 올림. 문구도 상태를 먼저 말함: "아직 혼자 쓰고 있어요" / "파트너를 초대해 함께 위시리스트를 쌓아보세요". 새 색은 만들지 않고 인증 화면 초대 안내 배너(`auth.module.css .inviteNotice`)의 값을 `--s-notice-bg`/`--s-notice-line` 토큰으로 `.page` 스코프에 들여옴(`--s-accent-soft-bg`를 그대로 못 쓰는 이유는 다크값 `#573f7f`가 칩 크기 기준이라 배너 면적에서 과하게 뜨기 때문). 패스코드 공유 안내도 배너 언어로 통일: 초대 발송 전 폼과, 발송 직후("이제 패스코드를 알려주세요")·초대 메일 양쪽에서 같은 사실을 말함(초대 메일에는 패스코드가 안 담기므로 초대자가 직접 알려주지 않으면 파트너가 링크를 수락해도 로그인 못 함).
- SKILL.md §5-C(신규, 상태 안내 배너) 반영. 검증: `isolation.spec.ts`에 PAIRED 두 세션 교차 확인(A→B/B→A, 화면+API 양쪽)과 SOLO 미노출·401 시나리오, 메뉴 로그아웃 회귀.
- 배경·설계 근거 → PROJECT_CONTEXT §5·§19, SKILL §5-C

---

## 2026-09-11 — SOLO 상태 계정 삭제 + 같은 이메일 재가입 경로

- PR #125 squash `b26ecd7` — "상대가 먼저 혼자 가입해버린" 상황을 사용자가 스스로 풀 방법이 없었다(`users.email` 전역 unique + 초대 발송이 기가입 이메일을 거부(`already_registered`)라, 먼저 가입한 쪽이 안 빠지면 영구히 못 합침). SOLO 계정을 지우고 같은 이메일로 다시 시작하는 경로를 만든다. **PAIRED 삭제는 범위 밖**(한 사람 탈퇴가 상대 위시리스트까지 지우는 문제라 상대 동의·데이터 승계를 먼저 정해야 함) — 차단만 하고 별도로 다룸.
- **삭제 순서는 외래키가 정한다** — 012가 도메인 3종에 `on delete restrict`를 걸어둔 이유("커플 삭제 기능을 만들 때 명시적으로 데이터를 먼저 처리하도록 강제")의 수취인이 이 PR. 순서: ① `activities`/`places`/`recommendations_log`(restrict라 반드시 먼저) → ② `email_tokens`(couple_id=이 커플, cascade지만 명시적으로) → ③ `email_tokens`(target_email=이 커플 사용자, **invite_partner 제외** — cascade가 손대지 않는 행) → ④ `users`(cascade지만 명시적으로) → ⑤ `couples`(마지막).
- `src/app/account/delete/page.tsx` + `AccountDeleteForm.tsx` + `POST /api/account`(신규) + `src/lib/auth/accountDeletion.ts`(신규). 검증: 단위 테스트 2파일(`accountDeletion.test.ts` 316줄, `accountDeleteRoute.test.ts` 167줄) + `isolation.spec.ts` 확장.
- 배경 → PROJECT_CONTEXT §19(PAIRED 삭제 백로그로 등록)

---

## 2026-09-11 v2 — 다크모드 파트너 초대 배너 대비 개선

- PR #126 squash `3c2fb1d` — 다크모드에서 "아직 혼자 쓰고 있어요" 배너(`.notice`, 260909 PR #124 신규)가 카드와 거의 구분되지 않던 문제. 원인은 배너 배경/테두리 채도(S28%/22%)가 카드 배경(S35%)보다 오히려 낮게 설정돼 있어, 라이트모드(카드=무채색, 배너=채도100%)와 반대로 다크모드에서는 채도 대비가 역전됐던 것.
- `--s-notice-bg`/`--s-notice-line` 다크값을 `#2c2440`/`#4a3f63` → `#37265e`/`#57389f`로 명도·채도 모두 또렷이 높임(라이트값 무변경). `npx tsc --noEmit` 통과.
- SKILL §5-C 다크값 갱신 필요(이 핸드오프 반영 시점에 §5-C를 처음 작성하며 최신값으로 기재).

---

## 2026-09-22 — 세션 주체를 기기별로 기억 (초대받은 사람이 자기 세션을 유지)

- PR #127 squash `de61303` — 초대받은 사람이 재로그인하면 파트너 화면에서 자기 이메일이 "파트너"로 보이는 버그. 원인은 표시 계층이 아니라 **세션 주체 판정**: 패스코드가 커플 단위 하나뿐이라 `/api/auth/unlock`이 누가 입력했는지 알 수 없어 `pickSessionUser`가 먼저 만들어진 사용자(초대자)로 수렴했다. 예외는 초대 수락 직후 pending-user 쪽지 하나뿐인데 1회용·30분이라, 로그아웃·30분 경과·기기 변경 후엔 다시 초대자로 수렴 — PR #123(PAIRED 지원) 때부터 있던 한계였고 주석에도 기록돼 있었으나, PR #124(파트너 화면)가 그 한계를 처음 사용자에게 노출시켰다.
- 단서를 하나 더 만든다 — "이 기기는 두 파트너 중 이 사람"을 서명된 1년 쿠키로 기억(`src/lib/auth/deviceUser.ts`). 심는 시점 셋: 최초 설정, 초대 수락 후 첫 로그인(쪽지를 이어받음), 이메일로 확인한 로그인. 매 로그인마다 갱신해 세션(30일) 만료와 무관하게 기억이 남아 평소 재로그인은 패스코드 6자리뿐.
- 단서가 없고 PAIRED면 세션을 발급하지 않고 이메일을 물음(`needsEmail`) — 예전처럼 아무나 골라 발급하던 경로 제거. 이 응답은 패스코드를 통과한 요청에만 나가 멤버가 둘이라는 사실이 밖으로 새지 않는다.
- 우선순위 판정은 순수 함수 `resolveSessionUser` 한 곳에 모음: **쪽지 > 이메일 > 기기 기억 > 후보 하나 > 묻기**. 쪽지가 가리키는 행이 사라지면 다른 단서로 되돌리지 않고 닫는 기존 불변식은 유지(초대받은 사람이 조용히 파트너의 세션을 받는 일 방지).
- 로그아웃은 기기 기억까지 지운다(세션 만료="시간이 지났다"와 달리 로그아웃="이 기기에서 나는 로그인 상태가 아니다"라는 선언) — 한 기기를 둘이 번갈아 쓰는 전환 수단이 되고, 잠금 화면에 "다른 사람으로 로그인"을 상시 노출하지 않아도 됨. 계정 삭제(PR #125)도 같은 이유로 지움(사라진 커플을 1년간 가리키면 재가입 첫 로그인이 낡은 커플을 봄).
- 검증: `resolveSessionUser` 우선순위 표 단위 테스트 13개 + e2e(교차 로그인·기기 기억 유지·로그아웃 후 재확인·잘못된 이메일·SOLO 무질문 회귀·수락 직후 로그인 기기의 재로그인 유지). 이메일 확인 단계가 재가입/재초대를 유발하지 않음(users 행 미증가, 토큰 미생성)도 DB 최종 상태로 못박음.
- 배경 → PROJECT_CONTEXT §20(세션 주체 판정 vs 표시 계층 교훈)

---

## 2026-10-12 — 파트너 표시용 닉네임 설정 (PR #128)

- PR #128(머지 커밋 `238d3de` — 예외적으로 squash 아닌 일반 머지) — `users.nickname` 컬럼(016) 추가, `PATCH /api/account` 신규, `/account`("내 정보")·`/partner/info`("파트너 정보") 신규/통일.
- 검증: `npm run ci`(lint/vitest/build) 통과, 실 계정 대상 Playwright 스크린샷 확인(라이트/다크/모바일/데스크탑).
- 배경·설계 근거·교훈 → PROJECT_CONTEXT §5(인증 F-01)·§20

---

## 2026-10-12 v2 — 인라인 편집 저장/취소 버튼 정리 (PR #129~#131)

- PR #129(`62b8ccb`) — 상세 인라인 편집(`/activities/[id]`·`/places/[id]`) 저장 중 취소 버튼 잔상 제거, 버튼 우측 정렬(취소 → 저장), 회귀 스펙 `e2e/inline-edit-actions.spec.ts` 신규.
- PR #130(`8a20d6a`) — 저장 로딩 라벨을 앱 공통 규칙("저장 중..." + 스피너)으로 복원, #129의 "저장" 라벨 유지 예외 제거. iOS 실기기 확인 완료.
- PR #131(`6b3f962`) — 닉네임 편집(`/account`) 버튼을 상세 편집과 같은 규칙으로 통일, 삭제 다이얼로그 스피너 크기 명시.
- 검증: #129·#130은 lint/tsc/단위/build/e2e 통과. #131은 tsc·eslint 통과. iOS 실기기 확인은 #130·#131 모두 사용자가 완료.
- 배경·교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §4-A·§12-A

---

## 2026-10-13 — 신규 등록·상세 상단 복귀 버튼 returnTo 누락 수정 (PR #132)

- PR #132(squash `7bcd64e`) — 복사하기(리스트 카드 ⋮·상세 ⋮)·추천 결과 0건 "추가하기"·홈 FAB 진입 시 신규 등록 화면 상단 버튼이 실제 출발 화면이 아니라 "홈으로"/`/list`로 뜨던 문제 수정. 각 진입 지점이 `returnTo`를 넘기고, 라벨은 목적지별("목록으로"/"추천 결과로"/"상세로"/"홈으로")로 분기.
- 영향 화면: `/activities/new`·`/places/new`·`/activities/[id]`·`/places/[id]` 상단 복귀 버튼, 홈 FAB.
- 검증: lint/tsc/vitest 176개/e2e/Vercel 프리뷰 빌드 통과. 화면 클릭 검증은 사용자가 완료(4개 경로).
- 배경·교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §13

---

## 2026-10-13 v2 — 상세 복사하기 단독 버튼·모서리 아이콘 정렬 (PR #133)

- PR #133(squash `9c6dd19`) — 상세(`/activities/[id]`·`/places/[id]`) 우상단 ⋮ 메뉴를 제거하고 복사하기를 등록 정보 블록 안 연필 왼쪽 단독 버튼으로 이동. 복사 동작·`returnTo` 전달은 그대로.
- 연필·복사하기·위치 행 지도·▾를 같은 28px 박스/16px 글리프 규격으로 맞추고, 카드 모서리 간격(위·오른쪽 동일)과 오른쪽 끝 열을 정렬. 영향 화면: 상세 두 화면의 등록 정보·방문 기록 블록 연필, 위치 행.
- 검증: build/lint/vitest 176개/e2e/Vercel 통과. 라이트·다크·모바일·데스크탑 화면 확인은 사용자가 완료.
- 배경·교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §7·§10-B·§10-I

---

## 2026-10-13 v3 — 전 화면 우측 상단 홈 아이콘 통일 · 유틸 아이콘 색·두께 통일 (PR #134~#136)

- PR #134(squash `a277068`) — 홈(`/`)·`/list`를 뺀 모든 화면 우측 상단에 `.headerNavBtn` 규격 홈 아이콘을 공용 `TopBar`로 추가. 추천 위저드 2단계 이후·결과 화면에는 홈으로 가는 길이 처음 생김. 이때 목적지가 `/`인 좌측 "홈으로" 링크는 제거했으나 PR #136에서 번복. 후속 커밋: 위저드 1단계에서 홈 아이콘이 좌측으로 쏠리던 문제 수정.
- PR #136(`b3e25c9`) — 제거했던 좌측 "홈으로" 링크 8곳(+`returnTo=/`로 들어온 상세·신규 등록)을 복원해 우측 홈 아이콘과 공존. 원칙을 "좌측 = 이전 화면, 우측 = 홈"의 위치 일관성 우선으로 변경.
- PR #135(`84c8fc6`) — 유틸 아이콘 버튼 4계열(`.headerNavBtn`·`.mapActionBtn`·`.iconBtn`·`.dialogCloseBtn`)의 기본 색·두께 통일. 라이트 ink 50%+sub 50%, 다크 ink 30%+sub 70%, stroke 1.25(공통 블록 한 곳).
- 영향 화면: 상세·신규 등록·추천 위저드·내 정보·계정 삭제·파트너 초대·파트너 정보(홈 아이콘), 홈·목록·상세·계정·검색 다이얼로그(아이콘 색·두께).
- 검증: 각 PR lint/vitest 176개/build/e2e/Vercel 통과. e2e 회귀 `topbar-home.spec.ts`·`isolation.spec.ts` 추가. 라이트/다크·390px/1280px는 Playwright 렌더로 확인했고 실기기 확인은 기록 없음.
- 배경·교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §6·§7·§10-B·§13

---

## 2026-10-13 v4 — 아이콘 버튼 정합성 잔여 정리 · 티어 박스 여백 비율 재정의 (PR #137~#139)

- PR #137(`0661c24`) — `.iconBtn`·`.dialogCloseBtn` 모바일 sticky hover 가드(`@media (hover: hover)`) 추가.
- PR #138(`963a7de`) — 미사용 `.editGhostBtn` CSS·문서 삭제. `MapLink` 지도·▾ 쌍 gap 2→0px. 카드 ⋮ 글리프는 22px로 올려 비교한 결과 카드 안에서 과해 20px 유지, SKILL §7에 의도된 예외로 명시.
- PR #139(`625b923`) — 박스 크기를 글리프 대비 여백 비율로 재정의: 헤더 `.headerNavBtn` 44→40px(글리프 22px), 카드 ⋮ `.iconBtn` 44→36px(글리프 20px), `.mapActionBtn` 28/16 유지. 카드 ⋮ 래퍼 오프셋 6→10px로 글리프 중심 유지. 28/16 인접 쌍(연필·복사하기, 지도·▾)은 박스 gap 2px로 통일.
- 영향 화면: 모든 화면 헤더 아이콘(제목 이하 4px 위로), 리스트 카드 ⋮, 상세 연필·복사하기, 위치 행 지도·▾.
- 검증: 빌드 통과, Playwright 렌더(라이트/다크·390/1280)로 박스·글리프 computed와 글리프 잉크 간 거리 실측 확인. 실기기 확인은 사용자가 프리뷰로 일부 진행(복사하기·연필 간격 피드백 반영), 최종 기록 없음.
- 배경·교훈 → PROJECT_CONTEXT §20, 스펙 → SKILL §7·§10-B·§10-I

---

## 2026-10-13 v5 — 장소 카테고리 개편: 아시안·뷔페·브런치 추가, 디저트 제거 (PR #141)

- 마이그레이션 017·018(라이브 DB 적용 완료, 적용 전 `~/today-date-backups/20261013-211146` 백업). 017: "아시안" 추가·"미분류" 맨 뒤 유지. 018: "디저트" 삭제(사용 0건 확인 가드 포함), "뷔페"·"브런치" 추가, 정렬 재정리.
- 최종 순서(11종): 한식·고기·일식·중식·양식·아시안·뷔페·브런치·카페·바·미분류(`sort_order` 1~11). 기존 장소 재분류 없음.
- 아이콘(`src/lib/categoryIcons.ts` 단일 출처): 아시안 `Wheat`, 뷔페 `ChefHat`, 브런치 `EggFried`. `디저트: Cake` 매핑 제거.
- 폼·`/list` 필터·카드 배지는 DB 목록과 아이콘 맵을 그대로 읽어 코드 수정 없이 반영됨.
- 검증: build/lint 통과, DB 11종·순서 조회 대조, 화면 노출(라이트/다크·모바일/데스크탑)은 사용자가 확인.
- 다음 마이그레이션 번호는 019. 스펙 → SKILL §아이콘 서술(카테고리 아이콘 맵)

---

## 2026-10-15 — 액티비티 카테고리 개편: 운동·쇼핑 추가, 순서 재배치 (PR #144)

- 마이그레이션 019(라이브 DB 적용 완료). "운동"·"쇼핑" 추가(`where not exists`로 멱등), `sort_order` 재배치, 끝에 총 9건 검증 가드. 기존 activities의 `category_id`는 변경 없음(재분류 없음).
- 최종 순서(9종): 레저·운동·쇼핑·체험·문화·축제·자연·여행·미분류(`sort_order` 1~9).
- 아이콘(`src/lib/categoryIcons.ts` 단일 출처): 운동 `Dumbbell`, 쇼핑 `ShoppingBag` — lucide 단색 선, 기존 카테고리 아이콘과 겹치지 않음.
- 필터 칩·등록/수정 폼·추천 위저드는 DB 목록(`sort_order`)과 아이콘 맵을 그대로 읽어 코드 수정 없이 반영됨. 카테고리 이름·순서를 하드코딩한 곳은 없음.
- 검증: lint/tsc/build 통과, 화면 노출(순서·아이콘)은 사용자가 확인.
- 다음 마이그레이션 번호는 020. 스펙 → SKILL §7 아이콘 서술

## 2026-10-15 — Context Change Record: PROJECT_CONTEXT 카테고리 서술 정정

- 변경 범위: `PROJECT_CONTEXT.md` 카테고리 체계 개편 항목(260724)의 활동 카테고리 목록을 현재 9종으로 보강. 기존 7종 서술은 역사 기록으로 남기고, 마이그레이션 019(운동·쇼핑 추가 + 재배치)를 덧붙였다.
- 나머지 카테고리 서술(추천 필터·위저드 단계·장소 카테고리)은 목록이나 개수를 고정해 적지 않아 변경 없음.

---

## 2026-10-15 v2 — 홈·리스트 상단 서브텍스트 삭제 + 타이틀 아래 간격 확정 (PR #145)

- 홈 "위시리스트에서 골라드릴게요 💜", `/list` "함께 쌓아온 곳들" 서브카피 삭제. 홈은 바로 아래 카드 레이블(액티비티/다이닝 추천 받기)과, 리스트는 타이틀 "우리의"와 의미가 중복. 스타일만 변경, 기능·데이터·라우트 무변경.
- `PageHeader`의 `subtitle`을 선택 prop으로 변경(값이 있을 때만 렌더). 공용 컴포넌트는 유지.
- 타이틀 아래 간격 확정: 홈 CTA 그리드 `mt-5`→`mt-6`(24px), `/list` 탭 `mt-3`→`mt-4`(16px). 이전 값(`mt-5`/`mt-3`)은 서브카피가 있던 시절 커밋 0856e38·4d85e7e("상단 여백 압축", PR 없이 `design/top-spacing` 브랜치 병합)에서 정해졌고 근거는 SKILL §6에만 있었다.
- 근거: `mt-6`/`mt-4`를 스크린샷 비교(홈 mt-6 확정, 리스트 mt-3 vs mt-4)로 선택. 리스트는 탭 자체 상하 패딩(~10px)이 더해져 타이틀 박스 하단→탭 글자 박스 상단이 16+10=26px로 홈 카드 상단 24px과 같은 리듬. margin 숫자는 홈보다 작게 둔다. SKILL §6 갱신.
- 실측(타이틀→콘텐츠, 전→후): 홈 45/53→24px, 리스트 37/45→16px(모바일 390/데스크탑 1280). 라이트/다크·두 폭 모두 레이아웃 깨짐 없음.
- 홈 SOLO 상태의 파트너 초대 배너(`PartnerInviteNotice`)는 자체 `mt-5`를 유지(이번 변경 대상 아님).

---

## 2026-10-15 v3 — 홈 바로가기 2열 그리드 + 라벨 간소화 + 다크 칩 대비 + 다이닝 아이콘 교체 (PR #146)

스타일·표시 변경 위주. 스키마·API 응답 형태 변경 없음(정렬 규칙 공유 함수 추출만 코드 구조 변경).

- **2열 그리드 타일**: 홈 "가보고 싶은 곳"/"다녀온 곳" 섹션을 풀폭 행 2개(한 카드) → 개별 카드 2개 가로 배치로 변경. 높이 모바일 ~69px / PC ~70px(CTA 136px의 절반), `>` 항상 표시. 구현: `HomeDashboard.tsx` `StatTile`, `screens.module.css` `.statGrid`.
- **라벨 간소화**: 타일 제목 "가보고 싶은 액티비티" → "액티비티"(다이닝 동일). 상태는 섹션 제목이 전담.
- **반응형 둘째 줄**(lg 1024px, `/list` 탭과 같은 앱 공통 기준): 모바일 "N개/N곳", lg 이상 "최근 항목명 외 N개/N곳". 모바일 169px 타일에서 항목명을 넣으면 "뮤지… 외 2개"처럼 과도하게 잘려(그리고 `>`를 켜면 개수까지 밀려 사라져) 모바일은 개수만 남김. 진행 중 시도했던 구조(첫 줄에 칩+제목+`>`, 둘째 줄을 칩 아래로 내리는 안)는 제목↔둘째 줄 간격이 벌어져 기각 → 칩 | (제목/둘째 줄) | `>` 가로 한 줄로 확정.
- **0개 상태**: "0개"로 쓰지 않고 기존 빈 상태 문구 유지. 모바일은 한 줄로는 잘려서 최대 2줄 + `word-break: keep-all`, 줄바꿈 위치를 "아직 담은 / 곳이 없어요"·"아직 다녀온 / 곳이 없어요"로 통일(둘째 줄이 "곳이 없어요"로 정렬). 이때 해당 행 높이 ~82px.
- **섹션 제목 강조**: `.statSectionHeader` 12px/`--s-sub` → 14px/`--s-ink`(독립 클래스라 `.sectionLabel`·`.fieldLabel`·`--type-section-label` 무영향). 타일 제목(15/16px, 같은 색·굵기)과 크기 차가 1~2px라 구분은 위치(카드 밖/안)·7px 간격에 의존 — 이 점을 SKILL §2-A에 명시.
- **다크모드 칩 대비 2건**
  - 다녀온 곳 중성 칩: `--s-chip-neutral-bg`가 다크에서 `--s-card-bg`와 같은 값(대비 1.0:1)이라 면이 안 보이던 기존 버그 → 라이트와 같은 매핑(`--s-card-border-strong`, 1.33:1).
  - 위시리스트 칩: 활동 `--s-accent-chip-tint` `#2c2440`→`#402d5a`(1.12→1.36:1), 다이닝 `--s-accent-pink-soft-bg` `#3a2433`→`#492f4d`(1.16→1.41:1). 규칙: 전경색(`--s-accent`/`--s-accent-pink`)을 카드 면 위에 알파 18%로 얹음(§5-B 삭제 소프트 배경과 같은 규칙). 활성 선택 면(`#573f7f`, 1.9:1)보다 어두워 "선택됨"과 혼동되지 않게 상한을 둠. 칩 3종은 카드 대비 1.33:1 이상 유지가 규칙.
- **다이닝 타입 아이콘 교체**: `MapPin` → `UtensilsCrossed`, 대상 5곳(`HomeFab` "다이닝 추가", 홈 타일 칩, 홈 CTA, `PlaceRecommendWizard` 질문·결과 화면 상단). `MapPin`은 위치·지역 필드(`ActivityCard`·`PlaceCard`·`PlaceDetail`·`MapLink`), `Utensils`는 식사시간·"양식" 카테고리 전용으로 유지 — 같은 글리프가 타입과 위치 필드 두 의미로 겹치던 문제 해소. `UtensilsCrossed`는 이전에 코드베이스 어디에도 쓰이지 않던 아이콘(grep 확인). 타입 아이콘 매핑의 단일 출처 파일은 없어 인라인 5곳을 직접 수정.
- **정렬 기준 통일(동반 변경)**: 홈 "다녀온 곳" 미리보기 제목이 등록(`created_at`) 최신순이던 것을 `/list`와 같은 규칙(방문일 최신 → 같으면 마지막 수정 최신, 방문일 없으면 뒤로)으로. 규칙을 `src/lib/data/listOrder.ts` `orderByListRule`로 추출해 `/api/activities`·`/api/places`·`getDashboardStats`가 공유(라우트 동작 동일). 위시리스트는 등록 최신순 유지. 단위 테스트 3개 추가(`listOrder.test.ts`, `dashboard.order.test.ts`).
- **정리**: 사용되지 않게 된 `.statRow + .statRow` 구분선 규칙 삭제, `buildPreview` 제거.
- 검증: lint/build/test(179개) 통과, E2E·Vercel CI 통과. 라이트/다크 × 모바일 390px/데스크탑 1280px 스크린샷(e2e 스텁 DB 시드, 긴 제목·0개·같은 방문일 정렬 포함) 확인.
- 스펙 → SKILL §2-A·§3-C·§7·칩 토큰 표(§1 전역 시맨틱 토큰).

## 2026-10-15 v3 — Context Change Record: PROJECT_CONTEXT 홈 통계 카드·정렬 규칙 서술 정정

- 변경 범위: `PROJECT_CONTEXT.md` §16 "채택한 레이아웃"을 2열 타일·반응형 둘째 줄·빈 상태·타입 아이콘 서술로 교체(종전 "행 리스트형" 서술은 이 CHANGELOG에 이력으로만 남김), SKILL 참조 링크에 §3-C·§7 추가. "목록 정렬 규칙" 절에 단일 출처 함수(`orderByListRule`)와 홈 미리보기 공유 사실을 덧붙임. 문서 상단 마지막 업데이트 2026-10-15로 갱신.

---

## 2026-10-16 — 홈 추천 CTA 이미지 배너 + 바로가기 타일 세로 2단 + 홈 서브타이틀 + 간격·FAB 정리 (PR #147)

스타일·표시 변경 위주. 스키마·API 변경 없음. 신규 정적 자산 `public/images/cta-banner-{activity,dining}.{webp,png}`(WebP 약 40KB, PNG 폴백 약 1.2~1.5MB).

- **추천 CTA → 이미지 배너**: "오늘 뭐할까?"(ACTIVITY)/"오늘 뭐먹을까?"(DINING). 모바일 1열, lg 2열, 높이 ≥104px, radius 20px. 정사각 카드 + 그라데이션 뱃지 아이콘 구조를 폐기(`CtaCard`는 아이콘 prop 제거, 오른쪽 아래 흰 원형 `ArrowRight`(strokeWidth 2.25)).
  - 배경: 제공 이미지 + `image-set(webp, png)`. `background-size: auto <높이%>`(비율 유지, 늘리지 않음), `right <x오프셋> top <y%>`. 폭 구간(기본 / 491–1023px / ≤22.5em / ≤16.5em)별로 `--cta-size-*`/`--cta-pos-*`/`--cta-x-*` 변수만 덮어쓴다. 오른쪽 음수 오프셋 한계 = 화살표 버튼과 겹치기 직전.
  - 설명 카피 "딱 맞는 데이트 활동 추천 받기"/"딱 좋은 데이트 맛집 추천 받기"(`keep-all`), 글자는 불투명 흰색 + 글자 후광.
  - **스크림 시행착오**: 검정 스크림은 명도와 함께 채도까지 깎아 색이 탁했다(글자 뒤 채도 31–34%). → 배경 가장 진한 지점과 같은 색상각의 어두운 색(액티비티 `19,8,125` H246°, 다이닝 `125,7,66` H330°)으로 교체해 55–59%로 회복. 대신 글자 대비는 0.2~1.0 하락(w768 다이닝 제목 4.8→3.8이 최대).
  - **라이트 밝기 라운드**: 라이트는 스크림 액티비티 0.15 / 다이닝 0.18 + 흰 베일 0.12(`::before`) + 글자 후광(스크림 색, `0 1px 2px .7` + `0 0 12px .55`)로 밝게. 스크림만 낮추면 오른쪽 그래픽이 그대로라 평균 밝기가 거의 안 올라가(0.51→0.53) 베일을 함께 씀(→0.57). **다크는 변경 없음**(스크림 0.40/0.43, 검정 그림자 — `prefers-color-scheme: dark`에서 복원, 정리 전과 픽셀 동일 확인).
  - 키보드 포커스 링: 배너의 box-shadow 가 `.cardInteractive` 포커스 링을 덮던 문제(프로토타입에서 발생)를 `.ctaCard.ctaCard:focus-visible`로 복원.
  - **알려진 한계**: 설명 글자(13px) 대비는 대부분 폭에서 AA(4.5:1) 미달. 그래픽-글자 겹침은 실제 렌더에서 읽기에 문제없어 허용.
- **바로가기 타일 세로 2단**(PR #146의 가로 한 줄 구조를 대체): 1단 = 작은 칩(28/30px)+제목, 2단 = 텍스트(전체 폭). 쉐브론은 타일 세로 중앙(absolute). 모바일 둘째 줄이 "개수만"에서 **항목명(말줄임) + "외 N개/N곳"** 2줄로 변경(2단 구조로 폭이 확보돼 항목명이 읽힘), lg 는 "항목명 외 N개" 한 줄 그대로. 클래스 `.statTile`/`.statTileHead`/`.statTileBody`, `.statRowItem`/`.statRowMore`/`.statRowRecent`. (PR #146 항목의 "모바일 개수만"·"칩 | 텍스트 | >" 서술은 이 변경으로 대체됨.)
- **홈 서브타이틀 재도입**: "우리 둘의 데이트를 채워가는 공간"(PR #145가 지운 "위시리스트에서 골라드릴게요 💜"와 목적이 다름 — 기능 설명이 아니라 서비스 성격). `/list`는 계속 없음. 홈 CTA 그리드 `mt-5`(서브타이틀 줄이 호흡을 만들어 24px에서 감소). 규칙은 SKILL §6.
- **배너↔섹션 간격(모바일/lg 차등)**: `.statSections` margin-top 24→30px(lg 40), gap 11→15px(lg 13→28), `.statSectionHeader` margin-bottom 7→8px(lg 8→10). 모바일을 lg 값 그대로 넓히면 화면이 늘어져 완만하게 둠. 솔로의 안내 카드↔배너 간격(`mt-5`)은 유지.
- **솔로 모바일 FAB 겹침 수정**: 홈 하단 `pb-16`→`pb-20`. 맨 아래까지 스크롤했을 때 마지막 타일 하단이 FAB 상단과 8px 겹치던 문제(타일 772px / FAB 764px)를 8px 여유(756px)로 해소. 커플·데스크톱은 영향 없음. 스크롤 전 첫 화면에서 FAB 가 타일 위에 걸쳐 보이는 것은 고정 요소라 정상.
- 검증: tsc·lint·vitest 179·Playwright e2e 79·build 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과. 솔로/커플 × 라이트/다크 × 모바일 390px/데스크톱 1280px 스크린샷(e2e 스텁 DB). 프로토타입 정리(A/B안·`data-proto-*` 토글 제거) 전후 6종 픽셀 diff 0.
- 스펙 → SKILL §3-A(간격·하단 padding)·§3-C(타일)·§3-D(CTA 배너, 신규)·§6(홈 서브타이틀)·§7(아이콘, 배너에서 타입 아이콘 제거).

---

## 2026-10-19 — 위시리스트/다이닝/다녀온 곳 카드 UX 다듬기 (PR #148)

- **위시리스트 빈 정보 줄**: 메모·위치가 모두 없으면 정보 줄 슬롯(`min-h-5`)에 "위치 또는 메모가 없습니다" 안내(`styles.emptyHint`). 카드 높이 불변. ActivityCard·PlaceCard 공통, 다녀온 카드는 기존대로 빈 슬롯.
- **다이닝 지역 아이콘 분리**: 지역(`area`)과 위치(`location`)가 모두 `MapPin`이던 것을 지역 → `Compass`로 교체(PlaceCard 배지 줄, PlaceDetail 지역 행). 위치는 `MapPin` 유지. `Compass`는 다른 곳에서 쓰이지 않음.
- **다녀온 카드 후기 한 줄 미리보기**: 별점·날짜 줄 아래 `<p className="mt-1.5 min-h-4 line-clamp-1">`. `min-h-4`(16px) 슬롯을 항상 유지하고 후기가 없으면 "후기가 없습니다"(`emptyHint`). 처음엔 후기 없으면 렌더하지 않았으나, 별점만 있는 카드가 후기 있는 카드보다 짧아져 같은 줄/줄 간 높이가 들쭉날쭉해져(데스크톱 3열) 슬롯으로 변경. 별점·날짜 줄은 불변. ActivityCard·PlaceCard 공통.
- **다크 가시성 수정(스크린샷 피드백)**: (1) 다크에서 `faint`(`#8c84a0`)가 `sub`(`#a8a0b8`)와 너무 가까워 안내 문구가 구분되지 않음 → `.emptyHint` 신설(라이트는 faint 그대로, 다크는 faint를 카드 면과 72% 혼합 ≈`#6f6682`, 카드 대비 3:1). (2) 다크 `--s-divider`(`#2c2442`)가 카드 대비 ≈1.1:1이라 푸터 구분선이 안 보임 → `.divider`를 다크에서 `--s-card-border-strong`(`#3a2f4e`, 1.33:1)로. `.divider`는 ActivityCard·PlaceCard 전용이라 영향 범위 한정.
- SKILL.md: §7 아이콘 혼동 금지(`MapPin`=위치, `Compass`=지역), §8-A 위시리스트 빈 상태·후기 슬롯·`emptyHint`·다크 구분선 추가, 오래된 "PlaceCard는 메모만 표시" 설명을 실제 동작(메모 → 위치 → 플레이스홀더)으로 정정.
- 검증: tsc·lint·build 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과. 다크 구분선·플레이스홀더 대비는 사용자 스크린샷 피드백 기반 수정이며 수정 후 시각 재확인은 프리뷰에서 사용자가 진행.

---

## 2026-10-19 v2 — 카드 ⋮ 메뉴 여백을 제목 줄에만 적용 (PR #149)

- **문제(사용자 실기기 관찰)**: 다녀온 곳 카드에서 ⋮ 메뉴가 카드 오른쪽 세로 전체를 차지하는 것처럼 보임 — 별점/후기 구분선이 오른쪽 끝까지 이어지지 않고, 위치/메모 줄·후기 미리보기도 앞쪽에서 말줄임.
- **원인**: ⋮(`absolute top-2.5 right-2.5`, 36px)를 피하려고 카드 `Link` 전체에 `pr-11`(44px)을 줘서 메뉴와 무관한 아래 줄까지 오른쪽 30px가 비어 있었음.
- **수정**: `Link`는 `p-3.5`로 통일하고, ⋮와 실제로 겹치는 카테고리 줄·제목 줄에만 `!hideMenu && 'pr-8'`(14+32=46px = ⋮ 박스 끝). 메타·정보 줄·별점/후기 푸터는 오른쪽 패딩까지 전체 폭. ActivityCard·PlaceCard 공통. PR #139 잔여 이슈(`pr-11`이 ⋮ 박스와 약 2px 겹침)도 함께 해소.
- 부수 효과: 데스크톱 3열 푸터 행 폭 206.66→236.66px, 기간 날짜 자리 120.66→150.66px.
- SKILL.md §8-A: ⋮ 자리 비우기 규칙(헤더 덩어리에만 `pr-8`, `pr-11` 회귀 금지) 추가, 기간 한 줄 표시 실측값 갱신.
- 검증: tsc·lint 통과, Vercel 프리뷰에서 사용자 실기기 확인 후 squash 머지(`00c8288`).

---

## 2026-10-20 — 홈 배너 아래 여백을 "남는 높이"로 결정 + 사파리 하단 띠 조사 (PR #150)

- **배경**: 낮은 화면(사파리 상단 주소창 + 하단 메뉴바)에서 다녀온 곳 타일까지 스크롤 없이 보이게 하려고 배너 아래 여백 4곳(배너↔첫 섹션 16~30 / 섹션 사이 12~15 / 제목 아래 4~8 / 타일 상하 10~12)을 `svh` 기반 `clamp()`로 줄이고 홈·`/list`·홈 error 상단 `pt-6`→`pt-4`로 줄였다(`c95b6fc`).
- **문제(실기기)**: 같은 코드가 사파리는 의도대로, iOS 크롬은 헤더 위 여백만 줄고 카드 아래 연보라 배경이 늘어남. 원인 = 여백 구간(680~874svh)을 사파리 한 대(≈684) 기준으로 맞췄는데 브라우저마다 `svh` 값이 달라 구간이 어긋나고, `min-height:100svh` 바닥값과 줄어든 내용 높이의 차이가 카드 아래 배경 꼬리로 남음.
- **수정(`646052d`)**: 배너↔첫 섹션·섹션 사이 두 여백만 `svh` 대신 **flex 스페이서**(`.statSlack`, `.statGapSlack`)로 교체. 기본값(16 / 12)에서 시작해 `.page` 의 실제 남는 높이만큼만 상한(30 / 15)까지 늘어난다(`flex: <최대-최소> 0 <최소>px` + `max-height`, `.statSections` 는 `flex: 3 0 auto`). 낮은 화면=최솟값, 높은 화면=종전 최댓값, 브라우저가 알려 주는 숫자에 의존하지 않음. lg 는 스페이서를 숨기고 기존 `margin-top:40px`/`gap:28px`. 제목 아래·타일 padding 은 컴포넌트 안쪽이라 `svh clamp` 유지. 근거는 SKILL §9-A 교훈 2(뷰포트에 수동으로 맞추지 않는다).
- **하단 띠 조사 — 결론: CSS 로 칠할 수 없는 웹 영역 밖**. 주소창이 떠 있는 사파리에서 홈 하단의 연보라가 하단 바 중간에서 끊기고 그 아래가 흰색으로 보이는 현상을 쫓았다. 실기기(`?vdebug=1` 임시 오버레이) 측정:
  - 웹 영역 `innerHeight`=`svh`=`dvh` **714pt**, `lvh` **754pt**, 화면 **874pt**. 위쪽 상태바 뒤 약 61pt·아래쪽 하단 바 뒤 약 99pt 는 웹 영역 **밖**.
  - 원색 칠하기(html 빨강·body 초록·main 노랑·`.page::before` 파랑)로 확인: 웹 영역 밖의 위·아래 모두 **body 배경색**으로 칠해짐. 홈 문서 높이 748pt > 714pt(스크롤 있음), 인증 화면은 `dvh`라 main 높이=714pt 로 같은 구조(로그인 화면의 띠가 더 커 보였을 뿐 원인 동일).
  - 위쪽(상태바 뒤)은 그라데이션 시작색(흰색), 아래쪽(하단 바 뒤)은 끝색(`#f4f0fa`)으로 따로 칠하고 싶었으나 `body` 색 하나뿐이라 불가. body 그라데이션·화면 가장자리 고정 띠(2px)·둘 조합 모두 위쪽을 흰색으로 만들지 못함(사용자 실기기 확인).
- **시도했다가 걷어낸 것(재시도 금지)**:
  - `html:has(.page)` 배경을 `#f4f0fa`로(`763a390`) — 효과 없음(웹 영역 밖은 html 이 아니라 body 색).
  - `.page::before`(고정 레이어) 색 토큰 `--s-page-bg-light` `#fafafb`→`#f4f0fa`(`439f1dd`) — 효과 없음, `#fafafb`로 복원.
  - `body:has(.page)`(screens·auth 양쪽) 바탕색 `#f4f0fa`(`8a98f1e`) — 하단 띠는 사라지지만 위쪽 상태바 뒤도 같이 연보라가 돼 헤더(흰색)와 이질감 → 제거.
  - `.page` 아래로 `box-shadow: 0 120px 0 #f4f0fa` 연장 — 하단 바가 **접혀** `lvh` 까지 늘어났을 때의 틈용이라 주소창이 펼쳐진 상태에는 무효 → 제거.
  - 진단 오버레이 `ViewportDebug`(`?vdebug=1`, 모드 순환) — 확인 후 제거(`3c7c965`).
  - 이 브랜치의 `main` 대비 최종 변경은 홈 여백 스페이서 작업뿐(HomeDashboard·screens.module.css·ListView·error.tsx·SKILL.md).
- **알려진 한계(수용)**: ① 하단 바 뒤 흰 띠는 내용이 한 화면에 들어오는 다른 짧은 화면과 같은 기존 현상으로 감수. ② 실기기(웹 영역 714pt)에서 홈 문서가 748pt 라 여백을 최솟값으로 줄여도 약 34pt 스크롤이 남는다 — 원래 목표는 684pt 기준이었고 실제 상태가 714pt 였기 때문. 더 줄이려면 `pb-20`(80px, 솔로 FAB 겹침 방지, §3-A 실측 근거)을 건드려야 해 이번엔 보류.
- 검증: lint·test(179)·build 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과. Vercel 프리뷰에서 사용자 실기기 확인(사파리 스크롤 시 배경 끊김 / 인증 레이아웃 영향 / `.page`↔비`.page` 전환 깜빡임) 후 squash 머지(`d55f411`), 작업 브랜치 삭제.

---

## 2026-10-21 — 홈 추천 배너 이미지 preload (PR #151)

- **문제**: 홈 로딩 중 추천 배너(ACTIVITY·DINING)가 폴백 단색(`background-color`)으로 먼저 뜨다가 이미지가 들어오며 전환됨. 의도한 연출이 아니라, 배너 이미지가 CSS `background-image`(`image-set` WebP/PNG)라 **CSS 가 적용된 뒤에야 다운로드가 시작**되는 구조의 부수 효과. 이미지는 단일 파일(2108×660 / 2156×708)이고 해상도별 분기는 없다(형식만 `image-set` 으로 선택, 크기는 `background-size` 변수로 조절).
- **변경**: `src/app/(home)/page.tsx` 의 `<main>` 안에 `<link rel="preload" as="image" type="image/webp">` 두 개(`cta-banner-activity.webp`, `cta-banner-dining.webp`)를 추가. **홈에서만** 받는다(layout 에 두면 다른 화면도 약 77KB 를 받음).
- **주의**: preload 의 `href`·`type` 이 `screens.module.css` 의 `image-set`(WebP)과 정확히 같아야 한다(다르면 같은 이미지를 두 번 받음). 배너 파일명·형식을 바꾸면 이 링크도 같이 고칠 것. 렌더되는 결과·이미지 선택 로직은 그대로.
- **효과(실측 감각)**: 맥 Chrome Slow 4G 에서 미세하게 빨라진 정도로 체감 개선은 크지 않다. preload 가 줄이는 것은 "CSS 해석 후 요청 시작" 대기뿐이고 이미지 수신·디코딩 시간은 그대로이며, 링크가 `<main>` 안이라 `<head>` 의 CSS 보다 늦게 발견되기 때문. 첫 페인트의 단색 구간은 여전히 남는다.
- **보류한 추가 개선(거슬릴 때 진행)**: ① 폴백 단색을 이미지 톤의 그라데이션으로 바꿔 전환 차이 줄이기(JS 불필요, 체감 개선 가장 큼) ② 배너 이미지 폭 축소(2100px → 1000~1200px, lg 선명도 확인 필요) ③ JS 페이드인은 하이드레이션·캐시·`prefers-reduced-motion` 부작용으로 비추천.
- 검증: tsc·eslint·build 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과, squash 머지(`5f55af4`), 작업 브랜치 삭제.

---

## 2026-10-22 — 전역 로딩 지연 진단 + 함수 리전 고정 + 미들웨어 session_version 캐시 (PR #152, #153)

사용자 피드백("앱 전체가 느리고, 첫 인증코드 화면부터 오래 걸림")에 대해 **코드·설정 읽기와 프로덕션 curl 측정만으로 진단한 뒤**(수정 없음) 두 가지를 반영했다. 로그인 후 화면(홈·`/list`·상세)은 세션 쿠키가 없어 렌더 시간을 실측하지 못했고 Lighthouse 도 쓰지 못했다.

### 진단에서 관찰된 사실 (원인 단정 아님)
- **번들·이미지**: `next.config.mjs` 가 비어 있고 `next/dynamic` 사용 0건. `next/image` 미사용(배너는 CSS `image-set`), 원본 PNG 약 1.4~1.5MB 가 `public/` 에 남아 있으나 WebP 는 약 38~40KB 로 서비스됨. `/lock` 의 JS·CSS gzip 전송 합계 약 186KB.
- **캐싱·렌더링**: 모든 페이지가 `getSession()`(cookies) 때문에 동적 렌더. Supabase 클라이언트는 모든 fetch 에 `cache: 'no-store'` 를 강제(client.ts 주석: 데이터 캐시 오염 사고 대응). 서버 측 데이터 캐시 없음.
- **쿼리 패턴**: N+1 없음. 홈은 서버에서 `couples`·`users`·통계 8개를 `Promise.all` 로 병렬 조회(최소 10쿼리). `/list` 는 서버에서 데이터를 받지 않고 렌더 후 클라이언트가 API 3건(카테고리 2 + 현재 트랙 목록 1)을 요청. `GET /api/activities` 는 `select *`·페이지네이션 없음. 정렬 키·복합 인덱스 없음(단일 컬럼 인덱스만).
- **미들웨어(src/middleware.ts)**: 매처가 `_next/static`·`_next/image`·`favicon.ico` 만 제외해 `/api/*` 도 모두 통과한다. 보호 경로·API 요청마다 `couples` 를 DB 에서 재조회해 `session_version` 을 비교했다. `app-ready` 쿠키가 없으면 설정 완료 확인으로 `couples`(+`users`) 조회가 더 붙는다 — 쿠키 유무에 따른 `/lock` TTFB 가 약 0.95s vs 0.15s(curl, 5회). `app-ready` 는 **패스코드 최초 설정 때만**(`setup/passcode`) 발급되며 `maxAge` 30일, 갱신 없음. 초대 수락 기기 등 최초 설정을 하지 않은 기기에는 발급되지 않는다. 값 검증 없이 `=== '1'` 문자열 비교만 한다.
- **`unlock` API**: bcrypt cost 10(`bcryptjs`, 순수 JS). 정상 경로 DB 호출 3~4회 순차(커플 조회 1~2 → bcrypt → `getCoupleUsers` → `couples` UPDATE).
- **홈 `couples` 중복 조회**: 미들웨어의 `getCoupleById` 와 홈 페이지의 `getCoupleById` 가 같은 호출이다(미들웨어가 조회 결과를 헤더·쿠키로 넘기는 경로 없음). 화면당 `couples`/`users` 조회 합계(미들웨어 포함, `app-ready` 있음): 홈 3~4, `/list` 4, 상세 1~2.
- **`session_version` 의도**: 쿠키(iron-session)에 `sessionVersion` 이 봉인돼 있으나 서버 측 세션 저장소가 없어, 다른 기기의 쿠키를 무효화하려면 DB 의 `couples.session_version` 과 비교해야 한다. 값이 바뀌는 곳은 **패스코드 재설정(`/api/auth/reset`, +1) 한 곳뿐**이다(로그아웃·탈퇴·잠금은 바꾸지 않음). 최초 도입은 `a6ddc37`(2026-05-28, F-01)이며 도입 시점의 성능 논의 기록은 없다. 조회 실패는 통과(fail-open) 설계(CHANGELOG 2026-09-07).
- **함수 리전**: 프로덕션 응답 `X-Vercel-Id: icn1::iad1::…` → 엣지는 서울, 함수는 미지정 기본값 `iad1`(`vercel.json` 없음). Supabase 는 ap-southeast-2(시드니)라는 것이 사용자 쪽 확인 사항이다(코드·저장소에는 기록 없음).

### PR #152 — `vercel.json` 으로 함수 리전 고정 (`ce2476f`)
- `vercel.json` 신규, `regions: ["syd1"]` 만 지정(functions·headers 등 다른 설정 없음). `syd1`(ap-southeast-2)은 Vercel 지원 리전, Hobby 는 단일 리전만 허용.
- 머지 후 프로덕션 확인: 빈 본문 `POST /api/auth/unlock` 응답 `X-Vercel-Id: icn1::syd1::…` — 함수 리전이 `iad1` → `syd1` 로 바뀐 것을 확인(함수가 실행돼야 헤더에 리전이 붙으므로 미들웨어에서 401 로 막히는 요청으로는 확인 불가).
- **알려진 한계**: 미들웨어는 엣지 번들(`middleware-manifest.json` 의 `regions: null`)이고 Vercel 문서상 미들웨어는 리전 설정과 무관하게 전 리전에서 실행 → **미들웨어의 DB 조회 구간은 이 설정으로 줄지 않을 수 있다**. 서울→시드니 함수 구간은 길어져 DB 쿼리가 적은 요청은 오히려 느려질 수 있다.

### PR #153 — 미들웨어 `session_version` 15초 TTL 인메모리 캐시 (`362e38b`)
- 신규 `src/lib/auth/sessionVersionCache.ts`(`couple_id` 키 `Map`, 외부 의존성 없음, 상한 1000개) + `middleware.ts` 의 `getCoupleById` 를 `isSessionVersionCurrent` 로 교체. `app-ready`·인증·`couple_id` 검사 등 다른 검증은 불변. 단위 테스트 8건 추가.
- 동작 변화: ① 캐시 미스·TTL 만료 → 기존과 동일하게 DB 조회 후 비교 ② TTL 안에서 쿠키 버전 = 캐시 버전이면 DB 없이 통과 ③ **패스코드 재설정 후 다른 기기의 옛 세션이 인스턴스당 최대 15초 유효**(허용한 트레이드오프) ④ 계정 삭제로 커플이 없는 경우(null)도 TTL 동안 캐시되어 같은 범위로 무효 판정 ⑤ DB 조회 실패는 기존 fail-open 유지, 실패 결과는 캐시하지 않음.
- **설계 조정(요청안에서 바뀐 부분)**: 캐시 값과 쿠키 값이 **다르면 만료 처리 전에 DB 를 한 번 재조회**한다. 요청안 그대로면 "재설정 → 새 패스코드로 로그인" 직후 `unlock` 이 DB 의 새 버전을 쿠키에 넣는데, 같은 인스턴스 캐시가 옛 값이라 정상 쿠키가 불일치로 튕기는 회귀가 생긴다. 캐시는 "일치" 판정만 단축한다.
- **한계**: 엣지 isolate 마다 캐시가 따로여서 콜드 스타트 시 첫 요청은 DB 조회, 인스턴스가 바뀌면 적중률이 떨어질 수 있다(미확인). #152 와 코드 충돌 없음(독립).

### 효과 — 실측 미완
- 사용자 체감: 캐시 프리뷰에서 로그인 정상, 화면 전환 속도는 "아주 약간 개선, 체감상 크지 않음". 리전 고정 후의 체감·수치는 **아직 기록 없음**.
- 쿼리 1회 비용은 `/lock` 의 `app-ready` 유무 차이(약 0.8s, 순차 2쿼리)로부터 대략 0.4s 안팎으로 **추정**했을 뿐 직접 측정한 값이 아니다.
- 두 변경 모두 줄이지 못하는 구간(홈 서버 렌더의 10쿼리 왕복, `/list` 의 렌더 후 API 3건 왕복, bcrypt·순차 DB 호출)이 남아 있다. 원인 확정은 하지 않았다.
- 검증: lint·tsc·test(187)·build 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과, 두 PR 모두 squash 머지, 작업 브랜치(`perf/vercel-region-pin`, `perf/middleware-session-cache`) 삭제.

---

## 2026-10-22 v2 — topLoader 수동 이동 정합: FAB·카드 ⋮ 메뉴 (PR #154)

"홈/리스트 카드·상단 아이콘을 탭해도 시각 반응이 없다"는 피드백에 대해 **코드 읽기로만 진단한 뒤**(실기기 타이밍 측정 없음) 그중 SKILL §12 패턴과 어긋난 두 곳만 고쳤다.

### 진단에서 관찰된 사실 (원인 단정 아님)
- topLoader 는 `layout.tsx` 의 `<NextTopLoader color="#7c3aed" height={2} showSpinner={false} />` 하나(nextjs-toploader 3.9.17). 자동 트리거는 `document` 클릭 리스너가 가장 가까운 `<a>` 를 찾아 `nprogress.start()` 를 부르는 것뿐이고, 클릭~`start()` 사이 디바운스·스로틀·rAF 는 없다. 종료는 `history.pushState`/`replaceState` 패치와 `popstate`·`pagehide` 에서 `done()`.
- 홈 통계 행·추천 CTA 카드·리스트 카드 본문·헤더 홈 아이콘(`PageHeader`·`TopBar`)·햄버거 메뉴 항목은 전부 `<Link>` 라 자동 경로를 탄다. 검색 아이콘과 카드 ⋮ 트리거는 이동 없이 다이얼로그·메뉴만 연다.
- `src/app` 아래 `loading.tsx` 는 `setup/verify` 하나뿐. nprogress 의 막대 전환은 `speed` 200ms 이고 종료 시 페이드 200ms+200ms 를 둔다.
- `.headerNavBtn`·`.iconBtn` 에는 `:active` 규칙이 없고(`:hover` 는 `@media (hover: hover)` 안), `.cardInteractive:active` 는 `translateY(0)` 인데 기본 상태도 이미 0 이라 변화가 없다. `:active` 반응이 있는 것은 `.statRow`(배경색)와 `.fab`(`scale(0.96)`) 뿐.
- 어긋나 있던 두 곳: ① `HomeFab` 의 메뉴 항목은 `router.push` 만 호출(`useTopLoader` import 도 없음) ② `ActivityCard`/`PlaceCard` 의 `navigate()` 는 `start()` 직후 동기 `router.push`(상세 화면 복사하기·삭제 경로는 이미 rAF 지연 적용).

### PR #154 — start → rAF → push 정합 (`9ece727`)
- `HomeFab`: `useTopLoader()` + `navigate(href)`(`start()` 후 `requestAnimationFrame(() => router.push(href))`) 신설, 두 메뉴 항목이 사용.
- `ActivityCard`·`PlaceCard`: `navigate()` 한 곳에 rAF 지연 적용 — 정보 수정·기록 수정·복사하기 세 경로가 함께 바뀜.
- 이동 목적지·UX 불변. 새 패턴 없이 SKILL §12 의 기존 패턴 재사용. 사용자가 Vercel 프리뷰에서 FAB·카드 ⋮ 메뉴 이동 시 막대가 보임을 확인.

### 범위 밖 (남김)
- `<Link>` 탭 체감: 대상이 prefetch·캐시 warm 이면 `start()`→`pushState`→`done()` 이 거의 붙어 막대가 안 보일 수 있다는 것은 **코드상 추론이며 실측하지 않았다**. 별도 작업(route-level `loading.tsx`)에서 다룰 예정 — `pushState` 시점을 바꿀 수 있어 이번 rAF 지연과의 상호작용을 그때 함께 확인할 것.
- CSS `:active` 탭 피드백(`.headerNavBtn`·`.iconBtn`·`.cardInteractive`)은 로더와 별개의 작업으로 보류.
- 검증: tsc·lint 통과, CI(Lint·Test·Build / E2E / Vercel) 전부 통과, squash 머지, 작업 브랜치(`fix/toploader-triggers`) 삭제.

---

## 2026-10-26 — PWA 상단 로딩바 가시성: standalone 한정 두께 3px + 다크 색 (PR #155)

"알려진 이슈 — PWA 상단 로딩바 흐림"(iOS 27.0.1)을 **위치는 건드리지 않고** 색·두께로 완화했다. 위치(`safe-area-inset-top` 오프셋)는 기존 결정 그대로.

### 실기기 비교에서 얻은 판단 (다크 PWA, 같은 화면 캡처 비교 — 실측값 아님)
- 원래 `#7c3aed`(짙은 남보라): 블러에 거의 묻힘.
- `#c084fc`(명도 소폭↑, 보라 유지): 가장 뚜렷하면서 브랜드 보라 톤 유지 → **채택**.
- `#e040fb`(채도↑): 명도는 오히려 낮아 블러에 눌려 `#c084fc`보다 약해 보임. 블러는 어두운 막처럼 작용해 채도보다 **명도**가 살아남는다.
- `#e9d5ff`(아주 밝음): 회백색으로 보여 보라 정체성이 사라짐.
- 색만으로는 블러 아래 가시성에 한계가 있어 두께를 함께 키움.

### 변경 (`src/app/globals.css` 만, PR #155 `3fdc19f`)
- 두께: `@media (display-mode: standalone)` 에서 `#nprogress .bar { height: 3px !important }` — PWA 라이트·다크 공통. 다크 전용으로 걸면 모드 간 두께가 달라지고, 블러는 PWA 에만 있으므로 조건을 원인(standalone)에 맞춤.
- 색: `@media (display-mode: standalone) and (prefers-color-scheme: dark)` 에서 `.bar` 배경과 `.peg` box-shadow 를 `#c084fc` 로. 브라우저 탭(다크 포함)·라이트 색·`top` 오프셋은 불변.
- 둘 다 라이브러리가 인라인 스타일을 늦게 주입하므로 `!important` 필요(PR #111 safe-area 패턴과 동일).
- PWA 라이트모드의 바도 2px → 3px 로 굵어지는 것은 의도.

### 검증·미확인
- tsc·lint 통과, CI(Lint·Test·Build / E2E / Vercel) 통과, squash 머지, 작업 브랜치(`fix/toploader-dark-contrast`) 삭제.
- **3px 두께의 블러 아래 체감은 아직 실기기로 확인하지 않았다.** 머지 후 운영에서 보고, 부족하면 4px 로 조정(색·위치는 그대로).
