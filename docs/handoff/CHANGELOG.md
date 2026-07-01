# Today Date — CHANGELOG UPDATED

> **마지막 업데이트: 2026-07-01**

> 260531~260630 핸드오프 전체를 날짜순으로 기록한 변경 이력입니다. 새 AI는 일반적으로 `PROJECT_CONTEXT_UPDATED.md`와 `CURRENT_STATE_UPDATED.md`만 먼저 읽고, 과거 판단 근거가 필요할 때 이 문서를 참고하세요.

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

## 2026-06-30 — 식사시간 칩 크기·다크 대비 수정·docs 아카이브·백로그 stale 정정

### docs 브리프 아카이브 (main 직접)

- `docs/design-brief-for-redesign.md` → `docs/archive/`로 `git mv` 이동, `[ARCHIVED]` 이력 주석 추가, 본문 보존
- 일회성 외부 의뢰 브리프(목적 소비·내용 stale·권위는 SKILL.md)라 삭제 대신 아카이브
- 커밋: `docs: archive design-brief-for-redesign`

### 식사시간 칩 크기 개선 + 다크 대비 수정 (PR #27 squash merge)

- 브랜치 `design/meal-badge-size` → main PR #27 squash 머지, 원격·로컬 정리 완료
- 크기 개선(`.mealBadge`, screens.module.css, `/places/[id]` 1곳 전용)
  - font-size: 11px → `var(--type-caption)`(12px) 토큰 참조. 유틸 클래스(.captionText) 통째 적용은 피하고 font-size 토큰만 참조(기존 색 유지)
  - padding: 1px·8px → 4px·10px
  - line-height: 1.4 추가
  - border-radius: 9999px 유지
- 다크 대비 수정
  - 진단: `.mealBadge` background가 `--s-track`(#1b1430, 세그먼트 "눌린 홈" 전용)을 참조 → 다크 카드면(#241a36)보다 어두워 묻힘. 라이트에선 둘 다 #eceaf3라 안 보였던 문제가 다크에서 표면화
  - 수정: background를 `--s-card-border-strong`(다크 #3a2f4e) 참조로 교체. 라이트값(#eceaf3) 동일 → 픽셀 불변. 같은 화면 "다녀온 곳" 뱃지(`.visitedTagVisited`)와 동일 토큰이라 면색 일관
  - 커밋: `fix: use card-border-strong for meal badge bg to fix dark mode contrast`
- 진단 우선 원칙 준수: 크기 변경 전 현재값·카테고리 칩 비교 진단 → 다크 묻힘 발견 후 두 뱃지 배경값 비교 진단 → 토큰 교체. 눈대중 없이 토큰 매핑 확인 후 적용
- SKILL.md 문서화: (1) 의도된 예외 — font-size 토큰 참조 + padding 직접 지정, 정보 뱃지(컨트롤 아님). (2) spacing 토큰 표준화 백로그 신호 — spacing 전용 토큰(--s-space-*) 부재, 유사 "정보 뱃지 크기" 케이스 2~3개 누적 시 타이포처럼 수렴 검토

### 백로그 stale 항목 2건 진단 → 닫힘 (수정 대상 없음)

- 입력 step 위계 롤아웃 (`design/input-step-hierarchy`): 진단 결과 추가 화면(`/activities/new`·`/places/new`) 칩·세그먼트가 이미 "선택=틴트+보더+글자, CTA=단색 채움" 위계를 정확히 준수. `.chipActive`·`.optionActive`는 틴트 채움, `.detailPrimaryBtn`은 단색 채움. 위배 없음 → 브랜치 변경 없이 닫음. 이전 어시스턴트가 백로그에 텍스트로만 남겨둔 stale 항목으로 판정
- 데스크탑/태블릿 버튼 max-width (`design/button-max-width`): 1차 진단이 "ActivityRecommendWizard step 1·2 버튼 896px"로 보고했으나, 2차 정밀 진단에서 결과 화면 분기와 마법사 화면 분기를 혼동한 오독으로 정정. 실제로는 마법사 질문 step 전부 max-w-lg(512px), 결과 화면만 max-w-4xl(896px, ActivityCard 3열 그리드 수용용 의도된 설계, 코드 주석 명시), 결과 하단 버튼은 sm:max-w-xs(320px)로 별도 캡됨. 폼 CTA(512px)·다이얼로그 저장(384px)도 의도된 풀폭 → 수정 대상 없음, 브랜치 닫음

### 교훈

- 백로그 stale 경고 실증: 연속 2건이 "코드는 이미 멀쩡, 문서에만 남은 빚"으로 닫힘. PROJECT_CONTEXT §20 "문서에 박힌 게 코드 실측과 어긋날 수 있다" 원칙의 실제 사례. 남은 백로그도 실측 기준 점검 필요
- 진단 오독 주의: 같은 컴포넌트의 렌더 분기(마법사 vs 결과)를 혼동하면 엉뚱한 후보가 잡힌다. 컨테이너 폭 진단 시 어느 분기에서 적용되는 값인지 확인
- `--s-track` 재사용 금지: 세그먼트 "눌린 홈" 전용 색이라 카드 위 뱃지 배경에 쓰면 다크에서 가라앉는다. 카드 위 정보 뱃지 면색은 `--s-card-border-strong`. 라이트값이 같아도 다크는 별도 확인
- 멀쩡한 건 안 건드린다: 화면 성격이 다르면 버튼 폭이 달라도(질문 512px / 결과 320px / 갤러리 896px) 불일치가 아니라 각자 최적화
- 머지 운영 확정: PR 생성 → squash merge → 원격·로컬 브랜치 정리를 한 흐름으로 진행(세희 표준 워크플로우)

---

## 2026-06-30 v2 — 배경 그라데이션 전역 확장·hint 토큰 통합·백로그 stale 3건 닫힘

> 같은 날(260630) 후속 세션. 위 260630 항목 이후 진행된 작업이다.

### 배경 그라데이션 전역 확장 (PR #28 squash merge)

- 브랜치 `design/bg-gradient-audit` → main PR #28 머지, 원격·로컬 정리 완료
- 배경: 인증·홈에만 있던 라벤더 그라데이션을 일반 화면 전체로 확장. 화면 전환 시 배경이 끊기던 위화감 해소
  - 적용 범위: 리스트 `/list`, 상세 `/activities/[id]`·`/places/[id]`, 추가 `/activities/new`·`/places/new`, 추천 `/recommend/*`
  - 방법: `.page` 베이스 라이트에 `background: var(--s-page-gradient-light, ...)` 직접 적용(`.page`를 쓰는 모든 일반 화면에 자동 파급). 다크는 `@media dark .page`에 `background: transparent` 추가 → 기존 `::before` 다크 그라데이션이 담당
  - 홈(`.pageHome`)·인증(`auth.module.css` 별도 스코프)은 무영향
- 진단 우선 준수: 확장 전 ① 토큰 적용 현황 전수 ② 그라데이션 끝색(#f4f0fa) vs 카드 면색(#ffffff) 명도차 + 카드 그림자 분리감 ③ 보이는 배경 면적 ④ 다크 패턴 이식 가능성을 순차 진단 후 적용. 초기 "카드 묻힘" 우려는 진단으로 해소(리스트 카드는 `--s-card-shadow`가 통계 카드 `--s-card-shadow-xs`보다 강해 오히려 분리감 좋음)
- 톤 조정 없이 홈과 동일 토큰 그대로 사용으로 확정(면적 작아 약하게 할 이유 없음 — 논리가 반대)

### 짧은 콘텐츠 배경 높이 버그 수정 (위 PR #28에 포함)

- 진단: `.pageStatic`(리스트·상세)의 `min-height: auto`가 `.page` 베이스 `100svh`를 덮어써, 콘텐츠가 짧은 화면에서 그라데이션 요소가 뷰포트 미만 높이로 렌더 → 콘텐츠 아래로 흰 배경 노출
- 수정: `min-height: auto` 제거 → `100svh` 상속 복귀. 출렁임 방지용 `padding-bottom: 0`은 의도 보존
- 커밋: `fix: ensure gradient bg fills viewport on short content pages`
- 교훈: 요소에 직접 background를 칠하는 패턴은 그 요소가 `min-height: 100svh`를 확보해야 짧은 콘텐츠에서도 배경이 화면을 채운다

### --s-hint → --s-faint 토큰 통합 (PR #29 merge)

- 브랜치 `design/empty-placeholder-audit` → main PR #29 머지, 원격·로컬 정리 완료
- 진단: `--s-hint`("빈 상태 안내" 명목 토큰)는 홈 전용 2곳(`.statChipPlcVis`·`.statRowPreviewEmpty`)에서만 사용. 게다가 값(라이트 #b5b0bf)이 의미와 거꾸로(빈값 가독성에 도움 안 됨) — 사실상 죽은 토큰
- 통합/분리 판단을 진단으로 확정: 빈값과 메타가 갈라야 하는 두 층인지 확인 → `DetailRow` 레이아웃이 라벨(`--s-sub`) 아래 빈값을 자연 배치해 위계를 이미 만들고 있어 색으로 한 층 더 가를 필요 없음 → `--s-faint`로 흡수 통합이 답
- 수정: 두 클래스 토큰 참조를 `var(--s-faint, #9ca3af)`로 교체(클래스명 유지, TSX 무수정), globals.css `--s-hint` 정의(라이트·다크) 제거. 앱 전체 `--s-hint` 참조 0건
- 부수 효과: 홈 통계 빈 preview·"다녀온 장소" 칩이 #b5b0bf→#9ca3af로 약간 또렷해짐
- 커밋: `refactor: merge --s-hint into --s-faint`

### 백로그 stale 3건 진단 → 닫힘 (수정 대상 없음)

- **PC 홈 상단 여백 과다**: PC 홈 실제 스크린샷 실측 결과 상단 여백 정상 수준, 콘텐츠도 세로로 충분히 참. 좌우 여백은 폭 768px(`max-w-3xl`) 의도된 결정(260625에 폭 확장 역효과 기확인, 사용자도 직접 경험). 이전 어시스턴트가 실측 없이 남긴 stale 백로그로 판정 → 닫음
- **상세 빈값 시인성 / --s-sub 라벨 라이트 대비**: 사용자가 "흐리다"고 관찰한 적 없음(이전 어시스턴트 추정 백로그). 객관 기준만으로 점검 → `--s-sub`(라벨) 라이트 대비를 진단했더니 **이전 보고 4.35:1이 채널 역감마 계산 오류였고 실제값은 4.83:1로 WCAG AA(4.5:1) 통과**. 전제 자체가 틀린 수치였음 → `design/sub-label-contrast` 브랜치 변경 없이 닫음
- **--s-sub / --s-faint 통합 가능성**: 진단 결과 분리 유지 필수. `--s-sub`(읽어야 하는 라벨·네비·설명 + 활성 대기 컨트롤)와 `--s-faint`(없어도 되는 메타·빈 상태·placeholder)는 성격이 명확히 갈리고 겹치는 회색 구간 없음. 합치면 상세 화면 라벨↔빈값 위계 소멸 → 통합 불가
- **--s-faint 빈값 대비(2.54:1)**: 사용자 신호 없음 + "안 읽혀도 되는 보조 정보"라 약한 게 의도된 위계 + 진하게 하면 라벨(`--s-sub`)과 안 갈려 위계 붕괴. SKILL.md에 "빈값 `--s-faint` 유지" 의도 이미 기록됨 → 디자인 의도로 수용하고 닫음

### 교훈

- **진단 수치도 재검증 대상**: stale 백로그(`--s-sub` 대비 미달) + 그 백로그를 떠받치던 대비 수치마저 계산 오류였던 케이스. 4.35→4.83 한 번에 결론이 뒤집힘. "백로그는 실측 전까지 진짜 빚으로 단정 말 것"(§20)에 더해, 진단이 내놓은 수치도 결론을 뒤집을 만하면 재계산 확인
- **사용자 관찰과 어시스턴트 추정을 구분**: "약하다/흐리다"가 사용자 신호인지 이전 어시스턴트 추정인지 출처를 확인해야 한다. 추정 백로그는 객관 기준(접근성 수치 등)으로만 평가하고, 의도된 위계면 닫는다. 사용자 신호 없는데 사용자 신호로 잘못 귀속하면 불필요한 전역 작업으로 번진다
- **토큰 통합/분리는 성격으로 판단**: hint는 죽은 토큰(홈 전용·값 역행)이라 통합, sub/faint는 살아있고 성격이 갈려 분리. "통합이 항상 정리"가 아니라 사용처 성격이 겹치는지로 가른다
- **요소 직접 background는 min-height 동반 필수**: `::before` 방식이 아닌 요소 자체 background 패턴은 `min-height: 100svh`가 없으면 짧은 콘텐츠에서 배경이 잘린다
- **fast-forward 머지 주의**: PR #29가 fast-forward로 머지됨. 세희 표준은 squash merge(Vercel 배포 목록 정리). 커밋이 적으면 영향 작으나 다음부터 "Squash and merge" 버튼 확인

---

## 2026-07-01 — 앱 UX 개선 4건(패스코드·리스트 복귀·등록 후 이동·문구/링크)·핸드오프 문서 저장소화

> 새 세션. 사용자 요청 8건 중 1~4번을 순차 처리하고, 핸드오프 문서를 GitHub 저장소로 이관.

### 패스코드 키패드 눌림 상태 버그 fix (main 머지)

- 브랜치 `fix/passcode-keypad-pressed-state` → main 머지 완료
- `/lock` 패스코드 입력에서 숫자 버튼 눌림/활성 상태가 다음 버튼 누르기 전까지 남던 버그 수정
- 6자리 패스코드 고정 정책·인증 플로우 무변경, 최소 수정
- lint/build PASS

### 리스트 복귀 시 탭/상태 유지 (PR #31 squash `fa2a003`)

- 브랜치 `fix/preserve-list-return-state` → main PR #31 squash 머지
- 문제: `/list`에서 탭/상태 선택 후 상세 진입 → "목록으로" 복귀 시 초기 조건(활동/가보고 싶은 곳)으로 리셋
- 진단: 탭/상태는 URL query(`?tab=&status=`)에 반영되나, 복귀 경로(returnTo)에 이 조건이 실려 있어도 카드→상세 경로만 연결돼 있었음. buildListReturnTo가 tab/status를 실어 나르도록 정리
- 구현: 상세 진입 시 현재 리스트 조건을 returnTo로 전달, "목록으로"가 그 경로로 복귀. 없으면 기본 목록 fallback
- 스코프 경계 확인: 검색어/필터는 URL이 아닌 컴포넌트 내부 state(useState)라 이번 스코프에서 제외(별도 백로그로 분리)
- lint/build PASS + Vercel preview 실측(탭/상태 4케이스 유지 확인)

### 신규 등록 후 상세 화면으로 이동 (PR #32 squash `907ff16`)

- 브랜치 `feat/post-create-navigate-detail` → main PR #32 squash 머지
- 등록하기 후 `/list`가 아닌 방금 등록한 항목 상세(`/activities/[id]`·`/places/[id]`)로 이동
- 진단: 등록 API가 이미 생성 항목 id 반환(`.insert().select().single()`) → API 무수정. ActivityForm·PlaceForm의 `router.push('/list')`만 상세 경로로 변경
- top loader 프로그래매틱 전환 규칙 준수(전환 직전 start(), 성공 경로 done() 미호출)
- 등록 로직 무변경, 이동 경로만. lint/build PASS + preview 실측

### 상태 전환 문구 통일 + 참고 링크 표시/스킴 보정 (PR #33 squash `b8a2c09`)

- 브랜치 `design/label-unify-and-link-display` → main PR #33 squash 머지(3커밋 스쿼시)
- **문구 통일**: 상세 하단 역방향 버튼 "가보고 싶은 곳으로 되돌리기" → "가보고 싶은 곳으로"(카드 메뉴 `STATUS_MENU_LABELS.wishlist`와 통일). 정방향 "다녀왔어요"는 유지(상세 하단 큰 보라 버튼은 완료감 있는 카피가 맥락에 맞고, 카드 메뉴 "다녀온 곳으로"와 달라도 각 맥락 최적화로 수용)
- **참고 링크 표시**: "참고 링크 열기" 고정 텍스트 → 실제 URL 표시 + 한 줄 말줄임(`min-w-0 truncate`, 카드 폭 초과 방지). 아이콘 external-link(1번, 새 탭 열림 의미와 일치)
- **링크 스킴 보정**: `naver.com`처럼 스킴 없는 입력 허용. 진단 결과 폼 refine(`/^https?:\/\/.+/`)·API 4개 라우트 `z.string().url()`이 스킴 없는 URL을 저장 차단하고 있어, 검증 완화 + href 보정 유틸 함께 적용
  - 신규 유틸 `src/lib/url.ts`: `resolveHref(url)`(스킴 없으면 https:// 부착, http(s)/ftp/mailto/tel 유지, host:8080 포트 오인 방지), `isValidReferenceUrl(url)`(폼·API 공용 검증)
  - 저장은 원본 유지(마이그레이션 없음), 표시도 입력 원본, href만 보정
- 라이트/다크 textLink 토큰 그대로. lint/build PASS + preview 실측

### 핸드오프 문서 저장소 이관 (운영 방침 변경)

- 기존: 대화 내 프로젝트 지식으로 관리, 세션 끝 수동 다운로드·교체
- 변경: `docs/handoff/`에 3종 문서(CHANGELOG·CURRENT_STATE·PROJECT_CONTEXT) 저장소 보관
- 갱신 방식(절충안): 어드바이저가 원칙대로 문서 전문 작성 → Claude Code는 받아쓰기만(내용 판단·압축 금지). 새 세션 시작 시 사용자가 GitHub 최신본을 받아 대화에 전달
- 파일명은 날짜 스탬프 없이 고정(`CHANGELOG.md` 등), git 이력으로 버전 관리. 문서 상단에 마지막 업데이트 일시 명시

### 머지 운영 방침 변경 (CLI squash 풀 플로우)

- 기존 "CLI 직접 머지 금지 → PR 생성까지만, 브라우저에서 수동 클릭"에서 변경
- 신규: Claude Code가 PR 생성 → `gh pr merge --squash --delete-branch` → 로컬 main pull·브랜치 삭제를 **한 번에** 처리. squash 명시로 배포 목록 통제 의도는 유지
- PR #31·#32·#33 모두 이 방식으로 처리됨

### 신규 백로그 3건

- **추가 플로우 returnTo 배선**: 리스트 → 추가(`/new`) → 등록 → 상세 → "목록으로" 왕복 시 탭/상태 미유지. 뿌리는 리스트→추가 진입 시 조건 미전달(HomeFab·EmptyState addHref). 6파일, 저위험(기존 returnTo/buildDetailHref/getSafeListReturnTo 재사용). 2번의 연장선. 기존 동작이며 3번이 유발한 회귀 아님
- **검색/필터 URL 동기화**: 검색어·6개 필터가 내부 state라 복귀 시 초기화. ListView 중심 중간 규모. 설계 결정 필요(URL 단일 출처 vs state 미러링, 배열 param 직렬화, debounce 타이밍)
- **주소 + 지도 앱 연동**: 주소/장소명 텍스트 저장 → 구글/네이버맵 검색 URL로 열기. 단순안 추천(지오코딩 API 키 불필요), DB 컬럼 추가 동반. 원래 8번 확장

### 사용자 요청 8건 중 남은 작업

- 5번 복사 생성(기존 항목 복사해 새로 생성, DB 무변경) — 다음 우선순위
- 7번 다녀온 날짜 기간 입력(단일→시작~종료, DB 변경 대) — DB 변경 그룹, 신중 설계
- 8번 주소+지도 → 위 백로그로 편입

### 교훈

- **스코프 경계는 진단으로 긋는다**: 2번에서 검색/필터가 URL에 없음을 진단으로 확인하고 별도 백로그로 분리. 무리하게 한 브랜치에 끼우지 않음
- **회귀 여부는 뿌리로 판단**: 추가 플로우 조건 미유지는 3번 이후 표면화됐으나 진단 결과 기존 동작(뿌리는 리스트→추가 진입부 미배선)이었음. "언제 보였나"가 아니라 "어디서 비롯됐나"로 회귀를 가름
- **문구 통일 ≠ 무조건 동일화**: 상세 하단 버튼과 카드 메뉴는 맥락이 달라 정방향 문구가 달라도 됨("다녀왔어요" 유지). 실제 목적은 역방향 "되돌리기"의 어색함 제거였음. 통일 대상을 정확히 특정
- **입력 차단 검증을 먼저 본다**: 링크 스킴 보정은 href만 고쳐선 안 되고, 애초에 스킴 없는 입력을 막던 폼·API 검증(zod)을 함께 완화해야 실제 동작. 표면(표시)만 보지 말고 입력 파이프라인 전체 확인

---
