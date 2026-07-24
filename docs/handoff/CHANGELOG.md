# CHANGELOG.md

> **마지막 업데이트: 2026-07-24**

> 260531~260724 핸드오프 전체를 날짜순으로 기록한 변경 이력입니다. 새 AI는 일반적으로 `PROJECT_CONTEXT.md`와 `CURRENT_STATE.md`만 먼저 읽고, 과거 판단 근거가 필요할 때 이 문서를 참고하세요.

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
