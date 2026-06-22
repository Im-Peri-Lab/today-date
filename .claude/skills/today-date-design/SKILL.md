---
name: today-date-design
description: >
  Today Date 앱의 화면 디자인 단일 출처(single source of truth).
  홈(`/`)·목록(`/list`)을 비롯한 모든 메인 화면을 새로 만들거나 수정할 때,
  배경/글씨/카드/컨트롤/활성상태/헤더/아이콘/뱃지/하단여백을 이 문서의 값과 클래스에
  정확히 맞춘다. 색·간격·아이콘을 임의로 정하지 말고 항상 여기서 복붙한다.
---

# Today Date 디자인 통일 기준 (single source of truth)

이 문서는 **추측 금지**. 모든 값은 실제 코드에서 추출했다.

- 디자인 토큰 원본: `src/components/screens.module.css` (`.page` 컨테이너 안에서 `--s-*` 변수 정의)
- 전역 배경/세이프영역: `src/app/globals.css`
- shadcn HSL 토큰: `src/app/globals.css` `:root` / `.dark` + `tailwind.config.ts`
- 공용 헤더: `src/components/PageHeader.tsx`, `src/components/BrandMark.tsx`
- 화면 예시: `src/components/HomeDashboard.tsx`, `src/components/track/ListView.tsx`

## 0. 가장 중요한 구조 원칙 (먼저 읽기)

- 메인 화면은 `<main className={styles.page}>`(홈) / `<main className={cn(styles.page, styles.pageStatic)}>`(`/list`)로 감싼다.
- 색은 두 계열이 공존한다:
  1. **`--s-*` 토큰** (`screens.module.css`) — 메인 화면(홈/목록/카드)의 모든 색·표면·활성상태. 라이트 값은 `var(--s-*, 라이트폴백)`로 내장, 다크는 `.page` 안에서 `@media (prefers-color-scheme: dark)`로 오버라이드.
  2. **shadcn HSL 토큰** (`--background` 등) — `ui/*` 컴포넌트(button/input/dialog 등)용.
- 새 화면은 `.page` 안에서 `styles.*` 클래스를 재사용한다. **요소별로 색을 하드코딩하지 말 것.**

---

## 적용 현황 (이 기준이 어디까지 반영됐나)

이 문서의 기준값은 **이미 반영된 화면(홈·`/list`)에서 추출**한 것이다. 아래 미반영 화면을 옮길 때 이 문서를 그대로 복붙 레퍼런스로 쓴다.

| 화면 | 상태 | 비고 |
|---|---|---|
| `/` (홈) | ✅ 기준 반영 | `styles.page` + `PageHeader` + `--s-*` 토큰 |
| `/list` (목록) | ✅ 기준 반영 | 기준의 레퍼런스 구현 (`ListView`) |
| `/activities/[id]`, `/places/[id]` (상세) | ✅ 기준 반영 | DetailBlock 카드·인라인 편집·버튼 위계·상태 태그·메타 아이콘 확정. § 10 참고 |
| `/activities/[id]/edit` (수정) | ❌ 미반영 | 옛 `bg-gradient-to-br from-violet-50 to-purple-100` 사용 → 금지 규칙 위반 |
| `/recommend/activity`, `/recommend/place` (추천) | ❌ 미반영 | 동일하게 옛 보라 그라데이션 사용 |

미반영 화면 마이그레이션 순서: ① `<main>` 래퍼를 `styles.page`(또는 `cn(styles.page, styles.pageStatic)`)로 교체 → ② 보라 그라데이션 배경 제거 → ③ 카드/컨트롤/헤더를 아래 1~9 섹션 클래스로 치환.

---

## 1. 배경색 (페이지 / 카드 / 컨트롤)

왜: 흰·검은 여백 노출을 막고(전역 배경), 라이트는 보라색기 없는 중성, 다크는 보라/핑크 코너 글로우로 무드를 준다.

| 용도 | 라이트 | 다크 | 출처/클래스 |
|---|---|---|---|
| 전역 html/body | `#ffffff` | `#0a0712` | `globals.css` html,body |
| 페이지 고정 배경 레이어 | `--s-page-bg-light` 기본 `#fafafb` (홈은 `#f4f2fa` 오버라이드) | radial(보라)+radial(핑크)+linear `#0a0712→#120c1e` | `.page::before` + `.pageHome` |
| 카드 표면 `--s-card-bg` | `#ffffff` | `#241a36` | `styles.card` |
| 컨트롤 표면(검색/필터/세그먼트) | `#ffffff` | 세그먼트 트랙 `#1b1430`, 검색/필터 `#241a36` | `styles.search*/filterToggle/segment` |
| 소프트 강조 배경 `--s-accent-soft-bg` | `#f6f1ff` | `#2d2540` | `styles.statCardAccent/visitedTag/visitBox` |

복붙:
- 일반 화면(리스트/상세): `styles.page` — 배경 `#fafafb` 자동 적용.
- **홈**: `cn(styles.page, styles.pageHome)` — `--s-page-bg-light`를 `#f4f2fa`(옅은 라일락)로 오버라이드해 흰 카드가 떠 보이게.
- 카드/컨트롤은 `styles.card` 등 클래스가 토큰을 읽으므로 색 지정 불필요.
- 전체 확장 시: `.page { --s-page-bg-light }` 기본값 한 줄만 교체하면 모든 `.page` 화면에 라일락 배경 일괄 적용.

**배경 < 카드 계층 관계 (라이트/다크 둘 다 충족):**
- **라이트**: 배경 `#f4f2fa`(홈) / `#fafafb`(기타 화면) ≪ 카드 `#ffffff` — 라일락 배경 위 흰 카드가 떠 보임.
- **다크**: 배경 `#0a0712~#120c1e` ≪ 카드 `#241a36` — 이미 충족, 변경 없음.

### 전역 시맨틱 토큰 (`:root` — portal 안전)

`.page` 스코프 밖(portal·body 직접 렌더)에서도 참조 가능한 토큰들. `globals.css` `:root`에 정의 + `@media (prefers-color-scheme: dark)` 오버라이드.

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--s-success` | `#16a34a` | `#1fb877` | 완료·체크 배지 배경 |
| `--s-success-on` | `#ffffff` | `#15121e` | success 면 위 전경(글씨·아이콘·링) |
| `--s-accent-pink` | `#db2777` | `#f18fb5` | 장소(place) 브랜드 핑크 전경 |
| `--s-accent-pink-soft-bg` | `#fbeaf3` | `#3a2433` | 장소 위시리스트 칩 배경 |
| `--s-accent-chip-tint` | `var(--s-accent-soft-bg)` | `#2c2440` | 활동 위시리스트 칩 배경 (다크는 accent-soft-bg `#573f7f`보다 어두운 미세 틴트) |
| `--s-chip-neutral-bg` | `var(--s-card-border-strong)` | `var(--s-card-bg)` | 다녀온 곳 칩 중성 배경 |
| `--s-label-muted` | `#8b8798` | `#908aa0` | 섹션 레이블·미리보기 텍스트 (sub↔faint 중간 톤) |
| `--s-icon-muted` | `#c7c3d2` | `#4f4960` | chevron 등 중성 진입 아이콘 |
| `--s-hint` | `#b5b0bf` | `#635d72` | 빈 상태 안내·visited place 칩 전경 |

> **`--s-hint` vs `--s-placeholder`**: `--s-placeholder`는 폼 입력 placeholder 전용(접근성 대비 기준 유지). `--s-hint`는 UI 안내 텍스트(빈 상태·칩 흐림) 전용 — 어두운 배경 위에서 더 낮은 대비를 허용하는 컨텍스트. 두 토큰을 섞지 않는다.

---

## 2. 글씨색 (기본 / 흐린 텍스트)

왜: 한 가족의 3단계 톤(기본/보조/더 흐림)으로 위계를 만든다. 강조는 보라 한 색.

| 토큰/클래스 | 라이트 | 다크 |
|---|---|---|
| 기본/제목 `styles.ink` (`--s-ink`) | `#1a1033` | `#f5f3fa` |
| 보조 `styles.sub` (`--s-sub`) | `#6b7280` | `#a8a0b8` |
| 더 흐림 `styles.faint` (`--s-faint`) | `#9ca3af` | `#8c84a0` |
| 강조 `styles.accent` (`--s-accent`) | `#7c3aed` | `#c084fc` |

복붙: `cn('text-...', styles.ink)` / `styles.sub` / `styles.faint`. shadcn 영역은 `text-foreground`(라이트 `0 0% 8%` / 다크 `0 0% 98%`), 보조는 `text-muted-foreground`(라이트 `0 0% 40%` / 다크 `0 0% 60%`).

---

## 3. 박스(카드) 스타일: 모서리 · 여백 · 그림자 · 보더

왜: 카드는 그림자로 컨트롤(보더)보다 한 단계 더 떠 보이게 해 위계를 만든다.

`styles.card` 값:
- 모서리: `border-radius: 1rem` (16px)
- 보더: `1px solid var(--s-card-border, rgba(0,0,0,0.06))` (다크 `#2a1f3e`)
- 그림자 `--s-card-shadow`: 라이트 `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)` / 다크 `0 8px 24px -16px rgba(0,0,0,0.6)`
- 컨트롤용 또렷한 보더 `--s-card-border-strong`: 라이트 `#eceaf3` / 다크 `#3a2f4e`

여백(패딩) 관례: 아이템 카드 `p-3.5`, CTA 카드 `p-5`, 통계 카드 `p-4`.

클릭 카드: `cn(styles.card, styles.cardInteractive)` → hover 시 `translateY(-2px)` + 보더/그림자 강조. `/list` 카드는 ⋮ 메뉴 열림 중에도 보더만 같은 톤으로 강조 유지(§5-A).

복붙:
```tsx
<div className={cn(styles.card, styles.cardInteractive, 'p-3.5')}>…</div>
```

### 조연 카드 위계 규칙 (StatSection — 홈 통계 카드)

**카드 그림자 3단계 위계.** 주연(CTA)·리스트·조연(통계)은 동일한 `--s-card-shadow` 계열 토큰 안에서 단계를 나눠 위계를 만든다:

| 단계 | 적용 카드 | `box-shadow` 토큰 | 라이트 값 | 다크 값 |
|---|---|---|---|---|
| 표준 | CTA 카드 (주연) + 리스트 카드 | `--s-card-shadow` | `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)` | `0 8px 24px -16px rgba(0,0,0,0.6)` |
| 최약 | 통계 카드 (`statSectionCard`) | `--s-card-shadow-xs` | `0 1px 2px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04)` | `none` (다크: 배경<카드 명도 계층이 이미 충분) |

**다크 통계 카드 그림자 = none (현행 유지)**: 다크에서는 배경(`#0a0712~#120c1e`) < 카드(`#241a36`) 명도 계층이 그림자 없이도 카드를 충분히 분리한다. `--s-card-shadow-xs`는 다크에서 `none`으로 재정의돼 있어 다크 시각에 영향이 없다.

| 속성 | CTA 카드 (주연) | 리스트 카드 | 조연 카드 (`statSectionCard`) |
|---|---|---|---|
| `box-shadow` 라이트 | `var(--s-card-shadow)` | `var(--s-card-shadow)` | `var(--s-card-shadow-xs)` (최약) |
| `box-shadow` 다크 | `var(--s-card-shadow)` | `var(--s-card-shadow)` | `none` |
| `border-radius` | **16px** (`1rem`) | **16px** (`1rem`) | **14px** (`0.875rem`) |
| `background` | `var(--s-card-bg)` | `var(--s-card-bg)` | `var(--s-card-bg)` |
| `border` | `var(--s-card-border)` | `var(--s-card-border)` | `var(--s-card-border-strong)` |

**radius 통일 이유**: 과거 모바일 `13px` / PC `14px` 분리는 의도 없는 임의값이었다. `0.875rem`(14px)으로 통일. CTA(16px)보다 한 단계 작아 시각적 위계를 유지한다.

**색은 기존 토큰 흡수.** 조연 카드 안의 색(칩·텍스트·아이콘)은 전용 네임스페이스 토큰 없이 전역 시맨틱 토큰(`--s-accent`, `--s-ink`, `--s-label-muted`, `--s-icon-muted`, `--s-hint` 등)을 직접 참조한다. 전용 토큰은 `--s-row-divider`(카드 내 행 구분선 — `--s-divider`보다 연한 톤이 의도)만 남긴다.

---

## 4. 토글 · 검색 · 필터 컨트롤 스타일

왜: 입력/컨트롤 줄(토글·검색바·필터)은 **바깥 박스 40px로 통일**해 한 줄로 정렬되게 한다. 라이트는 흰 면 + 옅은 보더(`--s-card-border-strong`), 활성만 보라로 구분. 포커스 시 보더는 1px 자리를 항상 차지해 레이아웃 점프가 없다.

- **컨트롤 줄 높이 = 40px 통일 (확정)**: 토글 트랙(`.segment`)·검색바(`.searchInput`)·필터 버튼(`.filterToggle`) **바깥 박스가 모두 40px**. 컨트롤 간 세로 간격은 **12px 균일**(`/list` 필터바: 토글↔검색바·검색바↔필터 모두 `mt-3`).
- **세그먼트 토글** `styles.segment` / `styles.segmentBtn` / `styles.segmentBtnActive`
  - 트랙: padding `0.0625rem`(1px), radius `0.625rem`, 배경 `var(--s-track, --s-card-border-strong)`(라이트 연회색 그루브 `#eceaf3` / 다크 트랙 `#1b1430`), 보더 `1px --s-card-border-strong`(라·다 동일 톤). **안쪽 버튼 36 + padding 2 + border 2 = 바깥 40px.**
  - 버튼(`.segmentBtn`): height `2.25rem`(36px), padding `0 0.75rem`, radius `0.5rem`, `0.8125rem`/weight 500, color `sub`.
  - 선택(`.segmentBtnActive`): **iOS식 흰 면 떠오름 + 보라 테두리** — 칩 틴트와 구분되는 별개 패턴(**§5-A** 참조).
- **검색 입력** `styles.search` + `styles.searchInput`(+`styles.searchIcon` 왼쪽 아이콘)
  - height `2.5rem`(40px), radius `0.75rem`, 보더 `1px var(--s-card-border-strong)`, bg `card-bg`, font `0.875rem`. 포커스 = 보더 `--s-active-line` + 3px 글로우(입력 전용, §5 포커스 역할 분리).
- **필터 토글 버튼** `styles.filterToggle`(+`styles.filterToggleActive`)
  - height `2.5rem`(40px — 토글·검색바와 통일), radius `0.75rem`(검색바 정합), `0.8125rem`/weight 500. **너비는 내용폭(컴팩트) 유지 — 가로로 꽉 채우지 않는다.**
- **필터 칩** `styles.chip`(+`styles.chipActive`)
  - height `2.25rem`(36px), radius `9999px`(pill), padding `0 0.75rem`, font `0.8125rem`, 보더 `1px var(--s-card-border-strong)`. 선택 = 틴트(**§5-A**).
- **초기화 버튼** `styles.resetBtn` (height 36px 작은 pill, `X` 아이콘 + 텍스트)
- **활성 필터 개수 뱃지** `styles.filterCount` (그라데이션 채움)

복붙(필터 칩):
```tsx
<button className={cn(styles.chip, active && styles.chipActive)}>
  <CategoryIcon name={c.name} className="h-3.5 w-3.5" />
  {c.name}
</button>
```

---

## 4-A. 폼 입력/선택 컨트롤 표준 (추가/수정 화면 + 상세 인라인 편집 공통)

왜: `/activities/new`·`/places/new`·상세 인라인 편집은 같은 프리미티브를 쓴다. 컨트롤 높이·radius·라벨 색을 아래 표준으로 고정해 한 화면 안에서 정렬되게 한다. (이 값들은 실제 코드에 반영됨 — 임의 변경 금지)

**높이 표준** (한 화면 안에서 정렬):
| 컨트롤 | 높이 | radius | 출처 |
|---|---|---|---|
| 텍스트 입력바 (`Input`) | **40px** (`h-10`) | 10px (`rounded-lg`=`var(--radius)`) | `src/components/ui/input.tsx` |
| textarea (`Textarea`) | min **64px** (`min-h-16`) | 10px | `src/components/ui/textarea.tsx` |
| 세그먼트 (`styles.option`) | **40px** (`height:2.5rem`) | 10px (`0.625rem`) | `screens.module.css .option` |
| 카테고리 칩 (`styles.chip`) | **36px** (`height:2.25rem`) | pill (`9999px`) | `screens.module.css .chip` |
| 추가 화면 하단 Primary (제출) | **48px** (`h-12`) | 10px | `FormLayout.tsx` |
| 상세 하단 Primary("다녀왔어요"/"되돌리기")·삭제 | **36px** (`h-9`) | 10px | `ActivityDetail`/`PlaceDetail` |
| 인라인 편집 Save·Cancel (`DetailBlock`) | **36px** (`h-9`) | 10px | `DetailBlock.tsx` |

→ **액션·컨트롤 사이즈 위계** (한 화면 안에서 정렬):
- **48px** — 신규 생성 마무리 CTA(추가 화면 Primary `h-12` **전용**). 인라인엔 쓰지 않는다.
- **40px** — 일반 입력/선택 컨트롤(`Input`·`Textarea`·세그먼트·카테고리 외 컨트롤·날짜 박스 `dateTrigger`)·컨트롤 줄(토글·검색바·필터, §4).
- **36px** — 카테고리 칩 + **인라인 액션(저장·취소·삭제·전환)**.
- **인라인 액션 = 36px (`h-9`, 확정)**: 상세 하단 Primary/삭제·인라인 Save/Cancel 모두 `h-9` 명시(예전 32px `h-8`에서 상향). 글자만인 Save/Cancel은 정사각 옹색함을 피하려 `px-4`로 통통하게, 아이콘+글자인 삭제/전환은 Button 기본 `px-2.5` 유지(이미 폭 있음). 한 화면(인라인 편집)에서 Save/Cancel·하단 Primary/삭제가 같은 36px로 정렬.
- 인라인 액션(36px)은 카드 안 일반 컨트롤(40px)보다 **한 단계 작은 "보조 액션"** 결. Save 채움은 단색 액센트(`styles.detailPrimaryBtn`) 유지.

**페이지 높이/하단 여백**: 상세 페이지는 `cn(styles.page, styles.pageStatic)`로 `min-height:auto`(100dvh spacer 없음) → 콘텐츠 자연 높이. 짧은 콘텐츠 아래는 고정 배경(`.page::before`)이 채워 흰 빈칸이 없다(별도 spacer 금지).

### 액션 버튼 2종 패턴 (거버넌스)

이 앱의 액션 버튼은 **두 가지 패턴만** 사용한다. 새 화면을 추가할 때도 아래 두 패턴 외 **새 사이즈 도입 금지**.

**1) 풀폭 Primary CTA** — **48px / `w-full` / radius 10px / 단색 채움(`--s-active-fill` via `styles.detailPrimaryBtn`)**
- 용도: "새 항목 생성 완료" — 데이터 추가가 발생하는 마무리 액션.
- 적용처: `/activities/new` "활동 등록하기" · `/places/new` "장소 등록하기" · (향후) 추천 위저드 결과 저장, CSV 가져오기 완료 등.

**2) 콘텐츠폭 액션** — **36px / 자연폭(`w-auto`, `h-9`) / radius 10px**
- 용도: "기존 항목에 작용" — 수정·전환·삭제 등 데이터 가공 액션.
- 적용처: 인라인 편집 Save/Cancel(`DetailBlock` 내부) · 상세 하단 전환 액션("다녀왔어요"/"가보고 싶은 곳으로 되돌리기") · 상세 하단 삭제(ghost variant + destructive 톤) · 카드 메뉴 액션 · (향후) 다중 선택 액션 등.

**판단 기준 — "이 행위가 새 데이터를 만드는가?"**
- YES → 풀폭 Primary (48px)
- NO (수정·전환·삭제·취소) → 콘텐츠폭 액션 (36px)

일반 컨트롤(입력바·세그먼트 등 **40px**)·카테고리 칩(**36px**)은 위 액션 버튼과 별개의 표준으로 유지한다(위 §4-A 높이 표 참조).


**폰트:**
- 입력 본문(`Input`/`Textarea`): **16px** (`text-base`, `md:text-sm` 쓰지 않음 → iOS 포커스 자동 줌인 방지).
- 라벨(`Label`): **14px** (`text-sm`) + `font-medium`.

**색 토큰 (shadcn 의존 금지, `--s-*`만):**
- 이 앱은 `.dark` 클래스를 붙이지 않고 `@media (prefers-color-scheme: dark)` + `--s-*` 토큰으로만 다크를 처리한다. 따라서 폼 컨트롤은 shadcn HSL 토큰(`--foreground`/`--input`/`--muted-foreground`)을 쓰면 다크에서 라이트값에 고정되어 안 보인다(대비 ~1:1).
- 라벨 색: `--s-ink` (`text-[color:var(--s-ink,#1a1033)]`) — `ui/label.tsx`에 적용 → `FormField`·`VisitRecordBlock` 라벨 모두 적용됨.
- 입력/textarea 본문 색: `--s-ink`, placeholder: `--s-faint`.
- **폼 컨트롤 보더는 `--s-input` 전용 토큰**(입력·textarea·세그먼트·칩·날짜 트리거/팝업). 라이트 `#eceaf3`(= `--s-card-border-strong`와 동일), **다크 `#4a3f63`** — 카드면(`#241a36`)·`--s-card-border-strong`(`#3a2f4e`)보다 한 단계 밝아 다크에서 보더가 또렷이 보인다. `--s-card-border-strong`은 뱃지·삭제버튼 등 **채움**으로도 쓰이므로 보더만 분리(채움 면엔 영향 없음). 라이트 값 동일 → 라이트 무변화.
- 활성(칩·세그먼트): **틴트**(`--s-accent-soft-bg` + `--s-active-line` 보더 + `--s-active-text`, §5·§5-A). Primary 버튼: `styles.detailPrimaryBtn`(`--s-active-line` 단색).
- **outline 버튼(`variant="outline"`, 인라인 편집 취소 등)도 `--s-*` 기반**: 보더 `--s-card-border-strong`, 면 `bg-transparent`, 글씨 `--s-ink`, hover 면 `--s-card-border-strong`. shadcn `border-border`/`bg-background`/`text-foreground` 및 `dark:` 프리픽스 사용 금지(`.dark` 미적용 → 다크에서 흰 칩으로 뜸). `src/components/ui/button.tsx` outline variant에 반영.

**인라인 편집 컨텍스트 규칙 (`DetailBlock`):**
- `DetailBlock` 안의 편집 폼(`ActivityFields`/`PlaceFields`/`VisitRecordBlock`)은 추가 화면 `FormLayout`(`space-y-5`)과 동일한 필드 간 리듬을 직접 제공해야 한다 → `DetailBlock`이 editing 모드 children 래퍼에 `space-y-5` 부여(읽기 모드는 영향 없음), `VisitRecordBlock`의 편집 폼 래퍼도 `space-y-5`. `FormField`/필드 묶음 내부 `space-y-1.5`(라벨↔컨트롤)만으로는 필드↔필드 간격이 0이 되어 어긋난다.
- 섹션 라벨(`<h2>`)이 보이는 블록(방문 기록)은 editing 시 헤더↔폼 간격을 `mt-5`(읽기 모드는 `mt-3` 유지)로 둔다. 상세 두 블록 사이 간격도 `space-y-5`(`ActivityDetail`/`PlaceDetail` 래퍼)로 폼 리듬과 통일.
- 인라인 폼 카드는 페이지 패딩 + 카드 `px-5`로 추가 화면보다 좌우 각 20px 좁다(카드 정체상 정상, 오버플로 아님).

**날짜 입력(네이티브 date 입력 — `src/components/forms/DatePickerField.tsx`):**
- **달력 팝업은 OS 네이티브(`<input type="date">`)를 쓴다.** 박스/leading 아이콘/표시 텍스트만 우리 토큰으로 유지하고, 달력 UI 자체는 OS에 위임한다. (과거 base-ui `Popover` + 자체 월 그리드를 썼으나, 다이얼로그 안 portal 잡음·데스크탑 고정폭(`17rem`) 캘린더 폭 초과·다크 토큰 재선언 부담 때문에 네이티브로 전환.)
- **⚠️ 폐기**: 옛 커스텀 picker 규칙(`styles.dpPopup`/`dpHeader`/`dpNav`/`dpGrid`/`dpDay`/`dpToday` 등 `dp*` 클래스, `Popover.Portal` + `@media` 다크 토큰 재선언, 자체 연/월 드롭다운·"오늘" 버튼·빈 행 없는 그리드)은 **모두 폐기**됐다. 관련 CSS·컴포넌트 코드는 제거됨 — 다시 도입하지 말 것.
- 구현: `styles.dateTrigger`(relative 박스) 안에 [leading `Calendar`(accent 톤) + 표시 텍스트] + 그 위를 덮는 `styles.dateInput`(네이티브 `<input type="date">`, `position:absolute; inset:0; opacity:0`). 박스를 누르면 네이티브 input이 클릭/포커스를 받아 OS 달력을 연다(데스크탑은 `showPicker()`로 보강, 모바일은 포커스만으로 열림). `value`/`onChange`는 ISO(`YYYY-MM-DD`) 그대로.
- 트리거 박스(`styles.dateTrigger`)는 다른 입력바와 **동일한 외형**: 40px / radius 10px / `--s-input` 보더 / `px-3` / `box-sizing:border-box`(`w-full`이 부모 폭을 절대 안 넘음, 고정 px width 없음). **"선택 트리거" 성격이라 [leading `Calendar` 아이콘 + 날짜 텍스트]를 한 묶음으로 박스 가운데 정렬**(`justify-content:center`) — 다른 입력바(제목/메모/위치)는 좌측 정렬 유지. 빈 값이면 placeholder "날짜 선택"(`--s-faint`). 박스 아래 별도 캡션 없음.
- **아이콘 색은 `--s-accent`(`styles.accent`)로 통일** — 다녀왔어요 다이얼로그·기록 수정·상세화면 방문일 아이콘이 모두 같은 보라 톤(상세화면 기준). 라이트 `#7c3aed` / 다크 `#c084fc` 자동.
- 표시 포맷은 **`YYYY.MM.DD (요일)`**(예: `2026.05.28 (목)`) — `formatDotDate()`(`lib/date.ts`) 단일 출처. 방문 날짜 표시(날짜 박스·카드 방문일·방문 기록 보기)는 모두 이 함수를 쓴다(한글 없음, 요일은 괄호로). 요일 계산용 Date는 연/월/일 인자로 로컬 생성(타임존 안전). 요일이 무의미한 "등록일" 캡션은 `formatKoreanDate()`(`"2026년 4월 6일"`) 유지.
- 포커스: 네이티브 input 포커스 시 `styles.dateTrigger:focus-within`이 박스 보더를 `--s-active-line`로 — 다른 입력바와 동일한 포커스 언어.
- iOS 줌인 방지: 네이티브 input `font-size:16px`. OS 다크 달력/indicator 대응: input `color-scheme: light dark`.
- **알려진 트레이드오프(수용)**: 달력 팝업 UI는 OS 통제라 앱이 못 바꾼다. ① 선택일 강조색이 OS 기본(예: iOS Safari는 파랑)으로 뜨고 앱 보라(`--s-active-*`)로 못 바꾼다. ② "오늘로 점프" 버튼 유무 등 컨트롤이 플랫폼마다 다르다(맥 Chrome엔 "오늘", iOS엔 없음). → portal 잡음·폭 초과 제거의 대가로 의도적으로 수용. 앱 보라색 선택일/오늘 버튼이 꼭 필요하면 커스텀 picker로 회귀해야 하므로 신규 도입 전 트레이드오프를 재검토할 것.
- 저장값은 ISO(`YYYY-MM-DD`) 그대로. 표시 변환(`formatDotDate`/`formatKoreanDate`)은 문자열 분해로만(`new Date(iso)` 문자열 파싱 금지 — UTC 자정 밀림 방지, `lib/date.ts`와 동일 원칙).

---

## 5. 상호작용 표준 (포커스 · 활성 · hover · 눌림)

왜: 활성/선택/포커스 색을 **단일 토큰 세트**로만 참조해, 활성색 변경 시 한 곳(`screens.module.css` `.page`)만 고친다. 요소별 하드코딩 금지.

**활성 토큰** (라이트 / 다크):
| 토큰 | 라이트 | 다크 | 의미 |
|---|---|---|---|
| `--s-active-fill` | `#7c3aed` | `#7c3aed` (재정의 없음) | StepDots 진행점 등 단색 채움 전용 |
| `--s-active-on` | `#ffffff` | `#ffffff` | 채움 위 글씨/아이콘 |
| `--s-active-line` | `#7c3aed` | `#7c3aed` | 활성/포커스 보더·링 |
| `--s-active-text` | `#7c3aed` | `#d8b4fe` | 외곽선형 활성(토글/필터버튼) 글씨·아이콘 |

**포커스 글로우 토큰** (full shadow 값으로 토큰화 — 사용처는 `var()` 참조만):
| 토큰 | 라이트 값 | 다크 값 | tier |
|---|---|---|---|
| `--s-active-glow` | `0 0 0 3px rgba(124,58,237,0.2)` | `0 0 0 3px rgba(192,132,252,0.2)` | 입력 필드 (3px · 알파 0.2 은은) |
| `--s-focus-ring` | `0 0 0 2px rgba(124,58,237,0.5)` | `0 0 0 2px rgba(192,132,252,0.5)` | 소형 컨트롤 (2px · 알파 0.5) |
| `--s-focus-ring-card` | `0 0 0 3px rgba(124,58,237,0.5)` | `0 0 0 3px rgba(192,132,252,0.5)` | 카드·박스형 (3px · 알파 0.5) |

> **선택 컨트롤 활성 = 연한 틴트 (확정).** 칩/세그먼트/옵션카드의 활성은 **단색 채움 금지** → `--s-accent-soft-bg` 틴트 + `--s-active-line` 보더 + `--s-active-text` 글씨. 단색 채움은 **"지금 누를 단 하나의 CTA"에만**. §5-A 참조.

### 포커스 글로우 표준 (확정 — 이 표에 없는 요소에도 이 기준으로 적용)

| tier | 대상 요소 | 표현 | CSS 참조 |
|---|---|---|---|
| **입력 필드** | `.searchInput` / `.plainInput` / auth `.input` / `.dateTrigger` | border + 3px glow 알파 0.2 | `box-shadow: var(--s-active-glow)` |
| **소형 컨트롤** | `.segmentBtn` / `.chip` / `.filterToggle` / `.resetBtn` / `.option` / `.tab` / `.backLink` / `.brandLink` / `.ratingStar` / `.dialogCloseBtn` / FAB / auth 버튼 / shadcn `default`·`secondary`·`ghost`·`link`·`outline`·`destructive` | border(또는 color) + 2px glow 알파 0.5 | `box-shadow: var(--s-focus-ring)` |
| **카드·박스형** | `.cardInteractive` (Link 포함 `:has(a:focus-visible)`) / `.optionCard` | border + 3px glow 알파 0.5 | `box-shadow: var(--s-focus-ring-card)` |
| **인라인 텍스트 링크** | auth `.link` / `.textLink` / 참고 링크 `<a>` | outline none + accent 색 + 2px underline | CSS underline |
| **중성 보조** | `.iconBtn` / `.editGhostBtn` / `HomeMenu` / DropdownMenuItem | hover와 동일 중성 면 (글로우 없음) | §7 그대로 유지 |

**규칙:**
- 모든 `:focus-visible` box-shadow는 `var(--token, fallback)` 참조. 리터럴 `0 0 0 Xpx rgba(...)` 하드코딩 금지.
- 카드 내부 `<a>` 요소는 `outline: none` (`:has(a:focus-visible)` 규칙이 카드 전체에 글로우).
- **portal scope**: `.dialogPopup`(body portal)은 `.page` `--s-*` 상속 불가 → `.dialogPopup` 다크 블록에 `--s-focus-ring` / `--s-focus-ring-card` 재선언(이미 적용). 새 portal 루트 추가 시 동일하게.
- 브라우저 기본 outline 방치 금지. 표시가 없으면 위 tier에서 해당하는 것을 적용한다.

### 새 인터랙티브 컴포넌트 추가 시 절차

1. **tier 판단**: 위 표에서 해당 tier를 결정.
   - 버튼/탭/링크/날짜 트리거 → 소형 컨트롤 (`var(--s-focus-ring)`)
   - 클릭 가능한 카드/풀폭 옵션 박스 → 카드·박스형 (`var(--s-focus-ring-card)`)
   - 텍스트 입력/textarea → 입력 필드 (`var(--s-active-glow)`)
   - 문장 내 텍스트 링크 → outline none + accent 색 + underline
   - 도구 버튼(아이콘 전용) → 중성 면 (hover 패턴 유지, `.iconBtn` 참조)

2. **CSS 추가** (`screens.module.css`, `var()` 참조 필수):
   ```css
   /* 소형 컨트롤 */
   .myButton:focus-visible {
     outline: none;
     box-shadow: var(--s-focus-ring, 0 0 0 2px rgba(124, 58, 237, 0.5));
   }
   /* 카드·박스형 (내부 Link 포커스도 카드에 글로우) */
   .myCard:focus-visible,
   .myCard:has(a:focus-visible) {
     outline: none;
     border-color: var(--s-card-hover-border, rgba(168, 85, 247, 0.4));
     box-shadow: var(--s-focus-ring-card, 0 0 0 3px rgba(124, 58, 237, 0.5));
   }
   .myCard a:focus-visible { outline: none; }
   ```

3. **portal 체크**: `.page` 밖 렌더 시 → `.dialogPopup` 다크 블록에 `--s-focus-ring` / `--s-focus-ring-card` 재선언 필요 (없으면 다크에서 글로우가 라이트색 fallback으로 뜸).

4. **라이트/다크 확인**: 라이트는 보라(`rgba(124,58,237,...)`), 다크는 라벤더(`rgba(192,132,252,...)`) 톤.

### 카드 내부 행(statRow) 포커스 — inset 링 패턴

카드 안에 행(`<a>`)이 쌓이는 구조(`statSectionCard` > `statRow`)는 **overflow가 잘려 외부 글로우가 안 보인다**. 이 경우 `inset` 그림자로 카드 안쪽에서 링을 그린다:

```css
.statRow:focus-visible {
  outline: none;
  box-shadow: inset var(--s-focus-ring, inset 0 0 0 2px rgba(124, 58, 237, 0.5));
}
```

- `inset` 키워드로 링이 요소 **내부**에 그려져 overflow:hidden 컨테이너 클리핑 문제를 우회한다.
- 카드 자체 `:has(a:focus-visible)` 규칙(카드·박스형 tier)과 **충돌 없음** — `statSectionCard`는 `cardInteractive`가 아니라 조연 컨테이너라 `:has` 규칙 미적용.
- 적용처: `statRow`처럼 **카드 내부에서 overflow 밖으로 글로우가 나갈 수 없는 `<a>`/`<button>` 행**. 컨테이너가 `overflow:visible`이면 일반 외부 글로우 패턴(카드·박스형 tier) 사용.

**활성 칩/세그먼트 규칙:** `styles.chipActive` / `styles.optionActive` / `styles.optionCardActive`는 **틴트**(`--s-accent-soft-bg` 배경 + `--s-active-line` 보더 + `--s-active-text` 글씨, weight 500). `/list` 상태 토글(`styles.segmentBtnActive`)은 별개 패턴 — iOS식 "흰 면 떠오름 + 보라 테두리"(§5-A 참조).

**`:active`(눌림) 표준:**

| 요소 군 | 표현 |
|---|---|
| 채움형 CTA · 패스코드 키 | `scale(0.96)` + inset 눌림 그림자 |
| 선택·컨트롤 버튼(칩·세그먼트·필터 등) | `scale(0.97)` |
| 카드(`.cardInteractive`·`.optionCard`) | `translateY(0)` (hover 부상 취소) |
| 입력 필드 · 텍스트 링크 | active 없음 |

원칙: focus(글로우/보더/면)는 정적 표시, active(눌림)는 순간 물리 변형(scale) → 동시에 같은 모습이 되지 않는다.

---

## 5-A. 상태 표현 위계 + hover 언어 (이번 세션 확정)

왜: hover와 "선택됨"을 요소마다 다르게 칠하지 않도록 **두 축**(① 채움 위계 ② hover 언어)을 한 원칙으로 고정한다. 추천 화면·`/list`·추가/수정 폼이 모두 같은 결로 읽혀야 한다.

### 채움 위계 (단색은 CTA 하나에만)
- **단색 채움**(`--s-active-fill`/`--s-active-line` 솔리드 + 흰 글씨): **"지금 누를 단 하나의 CTA"에만.** 등록(`/activities/new`·`/places/new` 제출)·저장(인라인/상세 Primary)·추천 "다른 추천 보기" — `styles.detailPrimaryBtn`(`--s-active-line`).
- **그라데이션 채움**(`styles.gradIcon`, `--s-grad`): **단독 진입 버튼에만** — 빈상태 "첫 활동/장소 추가하기"(`EmptyState`)·추천0개 "활동/장소 추가하기"(추천 위저드, **버튼이 1개일 때만**). 버튼이 2개인 박스(예: 활동 추천0개 "더 짧은 일정도 볼까요?" + "추가하기")는 **둘 다 그라데이션 금지** — Primary는 `detailPrimaryBtn` 단색, 보조는 outline.
- **선택됨/활성**(옵션 카드·칩·세그먼트·필터 칩): **단색 채움 금지** → `--s-accent-soft-bg` 틴트 + `--s-active-line` accent 보더 + `--s-active-text` accent 글씨/체크 + **weight 500**. (`styles.chipActive`/`styles.optionActive`/`styles.optionCardActive`)
  - **다크 틴트 밝기 규칙(확정)**: 다크 `--s-accent-soft-bg`는 카드면(`--s-card-bg` `#241a36`)보다 **분명히 밝아야** 한다(현재 `#573f7f`) — 보라 테두리에만 의존하지 않고 **면 색만으로도 선택이 구분**되도록. 라이트는 비선택 흰 배경과 또렷이 구분되는 연보라(fallback `#f6f1ff`). 비선택과 위계가 깨질 만큼 과하게 올리지는 않는다.
- **예외(단색 유지)**: **StepDots 진행 점** — "선택 상태"가 아니라 위치 표시라 `--s-active-fill` 단색 유지. (날짜 선택은 네이티브 `<input type="date">`로 전환되어 캘린더 선택일 렌더는 OS가 담당 — 우리 토큰 예외 대상 아님, §4-A.)

### 앱 전역 선택/활성 공통 언어 = 보라 테두리 (`--s-active-line`)
- 탭 밑줄, 검색바 포커스 보더, 필터 펼침 보더(`filterToggleActive`), 칩/옵션 선택 보더, 토글 선택 링이 **모두 `--s-active-line`(`#7c3aed`, 라·다 동일) 1px**을 공유한다. **새 선택 UI도 이 보라 테두리를 따른다.**
- 칩·옵션은 "틴트 + 보라 테두리", 토글은 "흰 면 떠오름 + 보라 테두리"로 면 처리는 다르되, **테두리 언어는 공통**. 검색바 포커스만 추가로 3px 글로우(입력 전용, §5).

### 토글(세그먼트) 선택 = iOS식 "흰 면 떠오름 + 보라 테두리" (확정)
- `/list` 상태 토글(`.segment`/`.segmentBtnActive`)은 칩의 **틴트 채움과 구분되는 별개 패턴**.
- **트랙**: 카드면보다 한 단계 어두운 중성 그루브(`var(--s-track, --s-card-border-strong)` — 라이트 `#eceaf3` / 다크 `#1b1430`).
- **선택칸**: 트랙 위로 **밝은 면이 떠오름** — 라이트 흰 면(`--s-card-bg` `#ffffff`) / 다크 한 단계 밝은 raised 면(`--s-raised` `#2f2647`). + `--s-active-line` 보라 1px 링(`box-shadow 0 0 0 1px`) + `--s-active-text` 보라 글자 + **weight 600**. 중성 그림자는 약하게(`0 1px 2px rgba(0,0,0,.06)`)만 — 떠오름은 트랙↔선택칸 면 명도차가 담당.
- 비선택칸은 `transparent`(트랙 그루브가 비침).

### hover 언어 — "콘텐츠 vs 유틸리티" (의도된 구분)
- **콘텐츠 요소**(카드·칩·옵션 카드 — 사용자가 *고르는* 대상): hover = **accent 보더**. 카드 `--s-card-hover-border`(라벤더 알파), 칩·옵션 비활성 `--s-active-line` 보더. **추천 위저드 옵션 카드(`.optionCard`)는 hover 시 리스트 카드(`.cardInteractive`)와 동일한 부상**(`translateY(-2px)` + `--s-card-shadow-hover`, `@media(hover)` 한정·`:active`에서 `translateY(0)`).
- **유틸리티 아이콘 버튼**(도구 — `.iconBtn` ⋮케밥/홈/햄버거, `.editGhostBtn` 연필, ghost `X` 닫기): hover = **중성 회색**(라이트 `#eceaf3`=`--s-card-border-strong`, 다크 보라 소프트 `--s-accent-soft-bg`). §7·§10-B·금지규칙 4 그대로 유지 — accent로 **바꾸지 않는다**.
- **둘이 다른 건 버그가 아니라 의도**다: 고르는 콘텐츠는 accent로 "선택 가능"을 암시, 도구 버튼은 중성으로 차분하게. (하단 삭제 `styles.detailDeleteBtn`만 destructive 틴트 — 별도 예외.)

### 카드 ⋮ 메뉴 열림 강조
- `/list` 카드(`ActivityCard`/`PlaceCard`)는 ⋮ 메뉴가 열린 동안 카드 보더를 **hover와 동일 톤**(`--s-card-hover-border`)으로 유지한다. 트리거의 `aria-expanded="true"`를 카드가 `:has([aria-expanded='true'])`로 반영(`screens.module.css` `.cardInteractive`). **보더만** — 그림자·`translateY` 없음(메뉴 조작 중 카드 들썩임 방지). `@media(hover)` 밖이라 **마우스·터치 모두** 강조. `hideMenu` 결과 카드(추천)는 트리거가 없어 미적용.

### 토큰 공유 주의
- `--s-active-fill`/`--s-active-line`은 `/list` 필터 칩·세그먼트·상태 토글과 **공유**된다. 상태 색을 바꿀 땐 토큰 정의값을 건드리지 말고 **사용처 클래스**(`.chipActive` 등)에서만 조정한다 — 토큰값을 바꾸면 StepDots·CTA까지 휩쓸려 회귀한다.

---

## 5-B. destructive(삭제) 소프트 배경 — 공통 토큰 + 표면별 분리 (확정)

왜: 삭제 hover/채움의 빨강 틴트가 화면마다 다른 불투명도로 흩어져 있었다. **표면색이 같은 곳은 공통 토큰으로 묶고, 표면이 다르면 같은 불투명도를 강요하지 않는다** — 불투명도 틴트는 표면이 어두울수록 perceptually 묽게(빨강이 아니라 면색처럼) 읽히기 때문이다.

### 공통 토큰 (표면 `#241a36` 전용) — `globals.css`
`--destructive`(`0 84% 60%`) 위에 알파를 얹은 소프트 배경. 라이트보다 다크를 한 단계 진하게(다크면에선 같은 알파가 묽게 읽힘 → 드롭다운 hover 기준 CR≈1.23로 맞춤):

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--s-destructive-soft-bg` | `hsl(var(--destructive) / 0.1)` | `hsl(var(--destructive) / 0.18)` | 삭제 hover·소프트 채움 기본 |
| `--s-destructive-soft-bg-strong` | `hsl(var(--destructive) / 0.2)` | `hsl(var(--destructive) / 0.3)` | hover 강조·active 단계 |

- **portal 상속**: 드롭다운·다이얼로그는 body로 portal돼 `.page`의 `--s-*`를 못 받는다 → 이 토큰은 **`:root` 전역 정의 + `@media (prefers-color-scheme: dark)`로 다크 오버라이드**해 portal에서도 상속되게 한다.
- 적용처(둘 다 표면 `#241a36`):
  - **드롭다운 삭제 항목 hover**: `[data-slot='dropdown-menu-item'][data-variant='destructive'][data-highlighted]` → `background: var(--s-destructive-soft-bg)`. 단일 규칙(specificity `0,3,0`)이 다크 일반항목 규칙(`0,2,0`)을 이겨 모드 분기 없이 적용.
  - **삭제 확인 다이얼로그 버튼**(`Button variant="destructive"`, `DeleteConfirmDialog`): rest `bg-[var(--s-destructive-soft-bg)]` / hover `bg-[var(--s-destructive-soft-bg-strong)]`. (옛 `dark:bg-destructive/*`는 `.dark` 미적용이라 죽어 다크에서 라이트값으로 묽게 떴음 → 토큰으로 교체해 다크에서 의도대로 진해짐.)

### 표면이 다르면 같은 불투명도를 강요하지 말 것
상세 하단 삭제 버튼(`.detailDeleteBtn`)은 드롭다운/다이얼로그(`#241a36`)보다 **더 어두운 페이지 배경(`#0a0712~#120c1e`)** 위에 있다. 공통 토큰의 다크값(`0.18`)은 이 표면에서 미달(CR≈1.20)이라 **공통 토큰을 쓰지 않고** 이 표면에 맞춘 값을 `@media`로 직접 적용한다:

| 상태 | 라이트 | 다크(이 표면 전용) |
|---|---|---|
| hover | `/0.15` (불변) | `/0.20` (CR≈1.23 — 드롭다운 기준과 동급) |
| active | `/0.2` (불변) | `/0.26` (CR≈1.36) |

→ **원칙: 빨강 틴트의 불투명도는 "표면색"에 종속된다.** 새 destructive 면을 추가할 때 표면이 `#241a36`면 공통 토큰을, 더 어둡거나 밝은 표면이면 그 표면에서 기준 대비(hover CR≈1.23)를 맞춘 값을 별도로 정한다.

### 소프트 배경과 섞지 않는 것 (분리 유지)
- **삭제 글자·아이콘 색(`text-destructive`)**: 전경색이라 솔리드 `hsl(var(--destructive))` 단일 출처. 소프트 배경 토큰에 섞지 않는다.
- **폼 오류 표시(`aria-invalid` border/ring)**: "삭제"가 아니라 "검증 오류" 의미축 — 빨강을 공유하지만 역할이 달라 별도 유지.

---

## 6. 헤더(PageHeader) 통일 기준

왜: 홈과 `/list`의 로고~제목~서브카피 세로 간격을 픽셀 단위로 동일하게 유지하려고 **공용 `PageHeader`** 하나만 쓴다. 절대 화면마다 직접 헤더를 짜지 않는다.

복붙:
```tsx
<PageHeader title="우리의 위시리스트" subtitle="함께 쌓아온 곳들" homeNav />
// 홈에서는 homeNav 생략(로고가 링크 아님), 하위 화면은 homeNav={true}
```

- **브랜드 줄**: `MiniHeart`(보라→핑크 그라데이션 하트, `h-6 w-6` / lg `h-7 w-7`) + `Today Date` 텍스트(`styles.brand`: `1rem`/weight 500/letter-spacing `-0.01em`, lg `text-lg`), 둘 사이 `gap-2.5`. 우측에 홈 버튼(하위 화면) + 햄버거 메뉴(`HomeMenu`).
- **제목 블록 간격**: 헤더 → 제목 블록 `mt-6 lg:mt-8`(24/32px, 공용 `PageHeader`).
- **서브카피 아래 간격(다음 요소에 맞춰 조정)**: 다음 요소의 **자체 패딩까지 고려**해 두 화면이 비슷한 시각적 공백으로 읽히게 한다.
  - 홈(`/`)처럼 서브카피 바로 아래 **카드**(자체 상단 패딩 없음)가 오면 `mt-5`(20px) — `HomeDashboard` CTA 그리드(`lg:mt-5`).
  - 리스트(`/list`)처럼 **자체 상하 패딩(~10px)이 있는 탭**이 오면 `mt-3`(12px) — `ListView` `tabBar`. (마진 12px + 탭 내부 패딩 ≈ 홈의 20px 공백과 같은 리듬)
  - 원칙: 균등한 마진 숫자 맞추기가 아니라 **눈에 보이는 공백**을 두 화면에서 맞춘다.
- **제목** `styles.pageTitle`: `font-size 1.7rem`(~27px), lg `1.875rem`(30px) / **weight 600 (semibold)** / letter-spacing `-0.01em` / line-height `1.2`. (bold 700 아님 — 중간 톤)
- **서브카피** `styles.pageSubtitle`: `margin-top 0.25rem`(lg `0.375rem`), `font 0.875rem`(lg `1.125rem`), color `sub`.

---

## 7. 아이콘 규칙

왜: 아이콘은 `lucide-react` 단색 선으로 통일해 톤을 맞춘다. DB에 저장된 카테고리 이모지는 화면 아이콘으로 쓰지 않는다.

- 라이브러리: **`lucide-react`만** 사용. 기능 아이콘으로 **이모지 사용 금지**.
- 카테고리 아이콘은 이름→lucide 매핑(`src/components/track/categoryIcon.tsx`)으로만 고른다. DB `category.icon`(이모지)은 렌더하지 않는다.
- **아이콘 색 기준**:
  - 카테고리 아이콘 `styles.catIcon`: `--s-accent`(라이트 `#7c3aed` / 다크 `#c084fc`). 활성 칩 안에서는 `--s-active-on`(흰)으로 전환.
  - 메타 줄 아이콘(Clock/Sun/Moon/MapPin/Utensils 등):
    - **리스트 카드(ActivityCard/PlaceCard)**: 아이콘 색 지정 없이 부모 div(`styles.sub`) 상속.
    - **상세 화면(DetailRow 안)**: `styles.faint`(`--s-faint`) 명시 → 카테고리 아이콘(`styles.accent`)보다 한 단계 약한 위계. `className={cn('h-3.5 w-3.5 shrink-0', styles.faint)}` 패턴 사용.
  - 헤더 아이콘 버튼(`styles.iconBtn`): `sub`, hover 시 라이트는 중성 면 `#eceaf3`+`ink`, 다크는 보라 소프트. (유틸리티 도구라 **중성 hover** 유지 — 콘텐츠 요소의 accent hover와 의도적으로 구분, §5-A.)
  - **키보드 포커스(`:focus-visible`) = hover와 동일한 중성 면** (`iconBtn`·`editGhostBtn`): 브라우저 기본 outline을 끄고(`outline:none`) 중성 회색 면으로 표시. **입력 글로우(box-shadow 링) 쓰지 않는다**(글로우는 입력 필드 전용, §5).
- **유틸 아이콘 글리프 크기 (탭타깃별 통일, 확정)**: **44px 탭타깃 버튼(`.iconBtn` — ⋮케밥·홈·햄버거·로그아웃) → 글리프 20px(`h-5 w-5`)** / **36px 버튼(`.editGhostBtn` 연필) → 글리프 16px(`h-4 w-4`)**. 탭타깃 크기(44/36) 자체는 유지하고 글리프만 이 규칙으로 맞춘다.
- strokeWidth: 카테고리 `2`, CTA 그라데이션 배지 내부 아이콘 `1.75`.
- 크기 관례: 리스트 카드 메타 `h-3 w-3`, 상세 화면 DetailRow 메타 `h-3.5 w-3.5`, 헤더/검색 `h-4~5`.
- 참고: 장식용 하트/💜는 카피(서브카피·빈 상태 문구)에만 등장 — 기능 아이콘 자리에는 절대 넣지 않는다.

---

## 8. 카테고리 뱃지 · 메타 줄 규칙 (배경 없이 아이콘 + 텍스트)

왜: 카드가 색 pill로 시끄러워지지 않게, 분류는 **아이콘 색**으로만 구분하고 텍스트는 차분한 톤으로 둔다.

- **카테고리 뱃지** `CategoryBadge` → `styles.labelBadge`: **배경 pill 없음**. 인라인 `아이콘 + 텍스트`, gap `0.3rem`, font `0.8125rem`/weight 500, color `sub`. 아이콘만 보라(`catIcon`).
- **메타 줄**(소요시간/시간대/위치/식사시간): `flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs` + `styles.sub`, 각 항목 `inline-flex items-center gap-1` 아이콘(`h-3 w-3`)+텍스트.
- 식사시간 등 보조 pill이 꼭 필요할 때만 `styles.mealBadge`(track 배경, radius full, `11px`).

복붙:
```tsx
<span className={styles.labelBadge}>
  <CategoryIcon name={category.name} className="h-3.5 w-3.5" />
  {category.name}
</span>
```

### 8-A. 카드 내부 수직 간격 (헤더 덩어리 / 정보 덩어리)

왜: 카드는 **두 덩어리**로 읽혀야 한다 — "헤더 덩어리(카테고리 + 제목)"와 "정보 덩어리(메타 + 메모)". 간격을 균등하게 주면 모든 요소가 비슷하게 떠 위계가 사라진다. **원칙: "붙을 덴 확 붙이고, 덩어리 사이는 확 띄운다"(균등 간격 금지).** 상세 화면에서 카테고리+제목이 한 헤더로 묶이는 결과 카드도 동일하게 맞춘다.

| 구간 | 값(Tailwind) | 의미 |
|---|---|---|
| 카테고리 → 제목 | `mb-0.5` (2px) | 헤더 덩어리 **내부** — 밀착 |
| 제목 → 메타 | `mb-3` (12px) | 헤더 덩어리 ↔ 정보 덩어리 **경계** — 확실히 벌림 |
| 메타 → 메모 | `mb-1` (4px) | 정보 덩어리 **내부** — 밀착 |
| 메모 → 별점/날짜(구분선 포함) | 기존 유지 (`mt-2.5 pt-2.5` + `styles.divider`) | `isVisited` 시에만, 구분선으로 분리된 별개 푸터 |

- 출처: `ActivityCard.tsx` / `PlaceCard.tsx`의 인라인 Tailwind 클래스(간격 전용 `--s-*` 토큰은 없음). 카드 Link 패딩은 `p-3.5`(14px) 유지.
- **ActivityCard / PlaceCard 두 카드는 항상 정확히 같은 값**으로 동기화한다(한쪽만 바꾸지 말 것).
- 이 간격 클래스에는 `dark:`·`sm:`·`lg:` 프리픽스를 붙이지 않는다 → 라이트/다크·모바일/데스크탑 동일.

### 8-B. 시간대(time_of_day) 표시 규칙

왜: 시간대(`day`/`night`/`any`)는 항상 값이 있는(널 불가, DB `not null default 'any'`) 사용자 선택값이다. 셋 다 표시해 정보 손실을 막되, 라벨·아이콘 출처를 한 곳으로 모아 카드·상세가 갈라지지 않게 한다.

- **세 값 모두 표시**: `day`·`night`·`any` 전부 카드(`/list`)·상세(`/activities/[id]`)에 렌더한다. **`any`를 숨기지 않는다**(`=== 'any'`로 거르는 옛 분기 금지).
- **라벨 단일 출처**: `TIME_OF_DAY_LABELS`(`src/lib/labels.ts`) — `day:'주간'` / `night:'야간'` / `any:'아무때나'`. 카드·상세·추가/수정 세그먼트·추천 위저드 모두 이 라벨을 쓴다(하드코딩 금지). `any`는 "상관없음"이 아니라 **"아무때나"**(시간대 축의 값으로 자족적으로 읽히게).
- **아이콘 매핑 단일 출처**: `TIME_OF_DAY_ICONS`(`src/lib/labels.ts`) `Record<TimeOfDay, LucideIcon | null>` — `day: Sun` / `night: Moon` / **`any: null`(아이콘 없음)**. 카드·상세는 이 매핑을 공유한다. **파일별 인라인 삼항식(`day ? Sun : Moon`) 금지.**
- **렌더 패턴**: 아이콘이 있으면 "아이콘 + 라벨", `null`(=`any`)이면 "라벨만". `{TimeOfDayIcon && <TimeOfDayIcon … />}` 가드로 처리 → `any`는 라벨만, 단일 자식이라 `gap` 선행 여백 없이 주간/야간과 정렬이 자연스럽다.
- **아이콘 톤·크기**(§7 메타 규칙 준수, 임의 변경 금지): 카드 = 색 지정 없이 부모(`styles.sub`) 상속 + `h-3 w-3 shrink-0` / 상세 DetailRow = `styles.faint` + `h-3.5 w-3.5 shrink-0`.
- **저장값 불변**: 표시 문구·아이콘만의 규칙이다. 저장값 `'any'`·스키마(`z.enum(['day','night','any'])`)·DB enum·필터 로직은 건드리지 않는다.

---

## 9. 화면 하단 여백 제거 방법 (html / body / main / FAB)

왜: iOS 주소창 토글·오버스크롤·콘텐츠 길이에 따라 흰/검은 여백이나 FAB 출렁임이 생기지 않게 한다.

- **html/body** (`globals.css`): `min-height: 100svh` + 배경색을 html/body 레벨에 직접 지정(라이트 `#fff`/다크 `#0a0712`) + `overscroll-behavior: none`. → SSR 시점부터 여백 없음.
- **`.page`** (`screens.module.css`, 일반 화면): `min-height: 100svh`, `display:flex; flex-direction:column`, 세이프영역 `padding`(상단 `env(safe-area-inset-top)+0.5rem` 등). (단위 근거는 §9-A)
- **`.page::before`**: `position: fixed; inset: 0; z-index: -1` 배경 레이어 → 콘텐츠 길이가 변해도 배경이 움직이지 않음.
- **`/list`**: `.pageStatic` 추가 → `min-height: auto` + `padding-bottom: 0` (dvh/env 의존 제거, 스크롤 출렁임 방지). 콘텐츠 끝은 `styles.listBottom`(`padding-bottom: 5rem`)으로 마지막 카드와 FAB 사이 간격 확보.
- **FAB** `styles.fab`: `position: fixed; right: 1.25rem; bottom: 1.5rem`(**고정 rem — `env()` 쓰지 않음**: 주소창 토글 시 세로 출렁임 방지), `3.5rem` 원형, 그라데이션. `listBottom`의 5rem = FAB footprint(bottom 1.5 + height 3.5).

복붙(래퍼):
```tsx
// 홈
<main className={styles.page}><HomeDashboard /></main>
// /list (콘텐츠 주도)
<main className={cn(styles.page, styles.pageStatic)}><ListView /></main>
```

### 9-A. 페이지 높이 정책 (svh / dvh 분리 — 중요)

왜: 뷰포트 높이 단위는 두 종류가 공존한다. `svh`(주소창 보이는 **최소·정적** 높이)와 `dvh`(현재 가시영역을 추종하는 **동적** 높이). 화면 성격에 따라 **의도적으로 다른 단위**를 쓴다. 섞어 쓰거나 한쪽으로 통일하면 회귀가 난다(아래 교훈).

- **일반 화면(홈 `/`·리스트 `/list`·상세 `/activities/[id]`·추가 `/activities/new` 등) + 전역 `html/body`**: **`min-height: 100svh`로 통일**.
  - 근거: `svh`는 정적이라 **주소창 토글에도 문서 높이가 안 변해 스크롤 출렁임이 없다**. 콘텐츠가 짧으면 주소창 숨김 상태에서 하단에 약간의 흰 여백이 남을 수 있으나(svh 특성), 일반 화면은 `.page::before`(fixed 배경)가 덮어 대부분 가려지고, **출렁임 제거 이득이 더 커서 이 방식을 채택**한다.
  - 위치: `screens.module.css` `.page`(`min-height:100svh`), `globals.css` html/body(`100svh`), 추천 페이지 `min-h-svh`.
- **인증 화면(`/lock`·`/forgot`·`/reset`·`/setup`·`/setup/verify`)**: `AuthLayout` → `auth.module.css`의 **`.page`는 `100dvh`(동적)** 사용. **전역 `.page`(`screens.module.css`)와 이름만 같은 별개 클래스라 독립적.**
  - 근거: 인증 `.page`는 배경 그라데이션을 **요소 자체에** 얹으므로, `dvh`로 가시영역을 추종해야 ① 콘텐츠가 한 화면에 들어오고(주소창 접히면 lvh까지 확장) ② 배경이 항상 뷰포트를 채워 **흰 여백이 없다**.
  - 콘텐츠 정렬은 `.group`의 **`margin-block: auto`**: 여유가 있으면 세로 중앙, 넘치면 마진이 0이 되어 **상단부터 + 자연 스크롤** → 어떤 기기·글꼴에서도 **잘리지 않는다**(footer도 `.bodyGroup` 안 in-flow로 일원화, 하단 고정 모드 없음).

**교훈 (반드시 지킬 것):**
1. **전역 높이 단위를 바꿀 때 인증 `.page`까지 휩쓸지 말 것.** 인증은 `dvh`, 일반은 `svh`로 **분리 유지**. 과거 전역을 `svh`로 통일하며 인증 `.page`까지 `svh`로 바꿨다가 **패스코드 콘텐츠가 잘리는 회귀**가 발생했다(주소창 접힘 여유가 사라져 floor가 콘텐츠보다 작아짐).
2. **높이 맞춤은 "요소 깎기"가 아니라 "정렬(`margin:auto`) + 자연 스크롤"로 해결.** 고정 크기 합(키패드·헤더·간격)을 가변 뷰포트(svh)에 수동으로 맞추면 기기·폰트 편차에 취약하다. 잘림은 `justify-content:center`가 오버플로를 상단으로 밀어 닿지 못하게 만들기 때문 → `margin-block:auto`로 대체하면 넘침 시 상단정렬+스크롤로 graceful degrade.



---

## 10. 상세 화면 (`/activities/[id]`, `/places/[id]`)

### 10-A. 카드 블록 구조

상세 화면은 **두 개의 카드 블록**으로 구성된다. 공용 셸: `DetailBlock` (`src/components/track/DetailBlock.tsx`).

| 블록 | 섹션 라벨 | 근거 |
|---|---|---|
| 등록 정보 | 숨김(`blockTitle` 있으면 렌더 안 함) | 제목·카테고리·상태 태그가 자체 식별 |
| 방문 기록 | `<h2>` 유지 ("방문 기록"), 톤은 필드 라벨과 동일 | 스크린리더 섹션 탐색 보장 |

블록 헤더 라벨 톤: 시멘틱은 `<h2>` 유지하되 스타일은 폼 필드 라벨("제목"·"메모" 등)과 같은 결 — `text-sm font-medium` + `styles.ink`(`--s-ink`). 예전 `text-xs uppercase` + `sub`는 쓰지 않는다(`DetailBlock` showHeader 경로에 반영).

카드 클래스: `styles.card` + `styles.detailCard`
- `styles.card`: `border-radius: 1rem`, 보더, 그림자 (공용)
- `styles.detailCard`: `border-radius: 1.5rem` (24px) — `.card` 위에 덮어씀, 상세 전용
- 패딩: `px-5 pt-5 pb-4` / lg `px-6 pt-6 pb-5`

편집 모드 진입 시: `blockTitle` 있는 블록(등록 정보)은 헤더 전체 숨김 → 폼이 카드 최상단에서 즉시 시작.

페이지 높이: 상세 페이지(`/activities/[id]`·`/places/[id]`)의 `<main>`은 `cn(styles.page, styles.pageStatic)`를 쓴다(`/list`와 동일). 순수 `styles.page`(`min-height:100dvh`)만 쓰면 콘텐츠가 짧을 때(특히 편집 모드로 하단 버튼이 숨겨질 때) 카드 아래 큰 빈 여백이 남으므로, `pageStatic`(`min-height:auto`)로 콘텐츠 주도 높이를 쓴다. 배경은 `.page::before`(fixed)가 채우므로 영향 없음.

복붙(등록 정보 블록):
```tsx
<DetailBlock
  title="등록 정보"
  blockTitle={item.title}
  blockCategory={item.category ? <CategoryBadge category={item.category} /> : undefined}
  headerExtra={
    <span className={cn(styles.visitedTag,
      item.status === 'visited' ? styles.visitedTagVisited : styles.visitedTagWishlist)}>
      {STATUS_LABELS[item.status]}
    </span>
  }
  editing={editingInfo}
  onEdit={startEditInfo} onCancel={exitEditInfo} onSave={onSaveInfo} saving={isSubmitting}
>
  {/* 필드 그리드 */}
</DetailBlock>
```

---

### 10-B. 연필(고스트) 편집 버튼

카드 우상단 절대 위치. 카드 `<section>`에 `relative` 필수. 편집 중에는 렌더 안 함.

```tsx
<button
  type="button"
  className={cn(styles.editGhostBtn, 'absolute top-3.5 right-3.5')}
  onClick={onEdit}
  aria-label={`${title} 수정`}
>
  <Pencil className="h-4 w-4" />
</button>
```

`styles.editGhostBtn` 상태별 색:

| 상태 | 배경 | 색상 |
|---|---|---|
| 기본 | 투명 | `--s-faint` (`#9ca3af` / `#8c84a0`) |
| hover 라이트 | `--s-card-border-strong` (`#eceaf3`) | `--s-ink` (`#1a1033`) |
| hover 다크 | `--s-accent-soft-bg` (`#2d2540`) | `--s-accent` (`#c084fc`) |

헤더 콘텐츠 영역에 `pr-10` 추가해 버튼과 텍스트 겹침 방지.

---

### 10-C. 필드 레이아웃 (DetailRow)

```tsx
// 부모 그리드
<div className="grid grid-cols-1 sm:grid-cols-2">
  <DetailRow label="소요시간">…</DetailRow>          {/* 짧은 값: 1열 */}
  <DetailRow label="시간대">…</DetailRow>
  <DetailRow label="메모" wide>…</DetailRow>          {/* 긴 값: wide → sm:col-span-2 */}
  <DetailRow label="참고 링크" wide>…</DetailRow>
</div>
```

`styles.sheetRow`: `padding-top: 0.875rem` — 구분선(border-top) 없이 여백만으로 행 구분.  
라벨: `text-xs font-normal uppercase tracking-wide` + `styles.faint` (값보다 약한 캡션 톤)  
값: `text-sm` + `styles.ink`

등록 메타(추가자·등록일) 캡션: `styles.sheetRow` 제외, `mt-3.5` + `sm:col-span-2`, `text-xs` + `styles.faint`.

---

### 10-D. 메타 값 아이콘 (상세 화면 DetailRow)

모두 `lucide-react`. 카테고리 아이콘(`styles.accent`) 보다 한 단계 약한 `styles.faint` 색.

| 필드 | 아이콘 | 색 | 크기 | 비고 |
|---|---|---|---|---|
| 소요시간 | `Clock` | `styles.faint` | `h-3.5 w-3.5 shrink-0` | |
| 시간대 주간 | `Sun` | `styles.faint` | `h-3.5 w-3.5 shrink-0` | |
| 시간대 야간 | `Moon` | `styles.faint` | `h-3.5 w-3.5 shrink-0` | |
| 위치 | `MapPin` | `styles.faint` | `h-3.5 w-3.5 shrink-0` | |
| 식사시간 | `Utensils` | `styles.faint` | `h-3.5 w-3.5 shrink-0 mt-0.5` | 뱃지 그룹 앞 |

복붙:
```tsx
<span className="inline-flex items-center gap-1.5">
  <Clock className={cn('h-3.5 w-3.5 shrink-0', styles.faint)} />
  {DURATION_LABELS[item.duration_bucket]}
</span>
```

---

### 10-E. 상태 라벨·태그

**문구 단일 출처**: `src/lib/labels.ts`의 `STATUS_LABELS`. 문구 직접 기재 금지.

```ts
export const STATUS_LABELS: Record<Status, string> = {
  wishlist: '가보고 싶은 곳',
  visited:  '다녀온 곳',
  archived: '보관됨',
}
```

상태 토글 라벨(`ListView`), 상세 태그(`headerExtra`), 홈 통계 헤더(`HomeDashboard`) 모두 이 상수 참조.

**태그 클래스 조합** (크기·패딩·radius 동일, 색만 다름):
```tsx
<span className={cn(
  styles.visitedTag,        // 공용 레이아웃: radius 9999px / padding 0.125rem 0.5rem / 0.75rem/500
  item.status === 'visited'
    ? styles.visitedTagVisited    // 다녀온 곳
    : styles.visitedTagWishlist,  // 가보고 싶은 곳
)}>
  {STATUS_LABELS[item.status]}
</span>
```

| 클래스 | 배경 | 텍스트 | 다크 배경 | 다크 텍스트 |
|---|---|---|---|---|
| `visitedTagVisited` | `--s-card-border-strong` (`#eceaf3`) | `--s-sub` (`#6b7280`) | `#3a2f4e` (cascade) | `#a8a0b8` (cascade) |
| `visitedTagWishlist` | `rgba(124,58,237,0.08)` (`--s-accent` 8%) | `--s-accent` (`#7c3aed`) | `--s-accent-soft-bg` (`#2d2540`) | `#c084fc` (cascade) |

---

### 10-F. 하단 액션 버튼 위계

```tsx
<div className="mt-6 flex items-center justify-between gap-3">
  {/* 좌: 삭제 — 약한 중립 면 */}
  <Button variant="ghost" className={cn(styles.detailDeleteBtn, 'gap-1.5')}
    onClick={() => setDeleteOpen(true)}>
    <Trash2 className="h-4 w-4" />삭제
  </Button>

  {/* 우: Primary — 단색 보라 채움 */}
  <Button className={cn(styles.detailPrimaryBtn, 'gap-1.5 text-white hover:brightness-105')}
    onClick={…}>
    <CheckCircle2 className="h-4 w-4" />다녀왔어요   {/* or 가보고 싶은 곳으로 되돌리기 */}
  </Button>
</div>
```

**Primary 버튼** (`styles.detailPrimaryBtn`):
- 배경: `var(--s-active-line, #7c3aed)` — 라이트·다크 동일 (`--s-active-line` 다크 블록에서 재정의 없음)
- ⚠️ `--s-accent` 사용 금지: 다크에서 `#c084fc` (L=65%)로 오버라이드 → 카드면 위 부상 현상
- ⚠️ `inline style={{ background: ... }}` 사용 금지: CSS 클래스를 항상 이겨 다크 보정 불가
- 텍스트: `text-white` (대비 ~5.4:1, WCAG AA ✓)
- 그라데이션(`--s-active-fill`, `--s-grad`) 사용 금지 — FAB·로고 등 소형 액센트 전용
- 라벨: 미방문 `"다녀왔어요"` / 방문완료 `"가보고 싶은 곳으로 되돌리기"`

**삭제 버튼** (`styles.detailDeleteBtn`):
- 기본: `--s-card-border-strong` 배경 + `--s-faint` 텍스트 (중립 면, 빨강 배경 금지)
- hover: 배경 라이트 `hsl(var(--destructive) / 0.15)` / **다크 `/0.20`** + destructive 텍스트
- active: 배경 라이트 `hsl(var(--destructive) / 0.2)` / **다크 `/0.26`**
- 다크값이 더 진한 이유: 이 버튼은 페이지 배경(`#0a0712~#120c1e`)이라 드롭다운/다이얼로그(`#241a36`)보다 어두워, 공통 토큰(`--s-destructive-soft-bg`) 대신 이 표면 전용값을 `@media`로 직접 적용한다(§5-B 표면별 분리). 라이트는 불변.
- 위치: 좌측 끝(오삭제 방지). Primary와 최대한 분리.

---

### 10-G. 인라인 편집 라디오 옵션

```tsx
<label className={cn(styles.editRadioOption, isActive && styles.editRadioOptionActive)}>
```

- `editRadioOption`: `--s-card-bg` 배경, `--s-card-border-strong` 보더, `--s-sub` 색
- `editRadioOptionActive`: `--s-active-line` 보더, `--s-active-text` 색, `font-weight: 500`

---

### 10-H. 날짜 표시·별점·토스트

**날짜**: 저장은 ISO(`YYYY-MM-DD`). 방문 날짜 표시는 `formatDotDate()`(`lib/date.ts`, 타임존 안전) → `"2026.05.28 (목)"`(YYYY.MM.DD (요일)). 방문 기록 편집의 날짜 입력은 네이티브 `<input type="date">`(박스/아이콘은 우리 토큰, 달력 팝업만 OS) 사용 — §4-A. "등록일" 캡션은 `formatKoreanDate()`(`"2026년 4월 6일"`).

**방문일 아이콘**: `Calendar` (`lucide-react`) + `styles.accent` 색 — 완료 이벤트 강조.

**별점 사이즈 위계**: 표시(읽기)는 **`size="sm"`(16px)** — 카드·상세 뷰의 `<RatingStars value={...} size="sm" />`. 편집(인터랙티브, `onChange` 있음)은 **`size="lg"`(32px)** + 넓은 간격(`gap-2`) — `VisitRecordBlock` 편집·`VisitedDialog`. 근거: 손가락 터치 타깃 확보(별 32px + 간격으로 인접 별 오터치 방지, HIG 44pt에 근사). 색은 채움 `--s-accent` / 빈 별 `--s-faint` 동일.

**토스트 문구**:
```
되돌리기 성공:     "가보고 싶은 곳으로 옮겼어요"
삭제 성공:         "삭제했어요"
저장 성공:         "수정되었습니다!"
활동 되돌리기 확인 다이얼로그 제목: "가보고 싶은 곳으로 되돌릴까요?"
```

---

## 11. 다이얼로그(Dialog) 닫기 수단 표준

왜: 닫기 수단(상단 `X` + 하단 "취소")이 한 다이얼로그에 둘 다 있으면 중복이라 시선이 분산된다. **닫기 수단은 다이얼로그 종류에 따라 하나만** 둔다.

- **입력 폼 다이얼로그** (`VisitedDialog` 등 — 데이터를 입력해 저장): **상단 `X`만** 유지(`DialogContent`의 기본 `showCloseButton={true}`). 하단엔 "취소" 버튼을 두지 않고 **CTA(저장하기) 하나만** 남겨 유일한 주행동으로 또렷하게 한다. → 닫기는 도구(`X`)로, 풋터는 주행동 전용.
- **결정 다이얼로그** (`DeleteConfirmDialog` 등 — 확인/취소 두 결정 중 택1): **하단 "취소" 버튼만** 유지. 상단 `X`는 제거(`DialogContent`에 `showCloseButton={false}`). iOS Action Sheet 표준대로 **확인(삭제 등)·취소 두 결정을 풋터에 나란히 명시**해 동등한 선택지로 읽히게 한다.
- 판단 기준: **"이 다이얼로그가 입력을 받는가, 결정을 묻는가?"** 입력 폼 → `X`만(CTA 명시) / 결정 다이얼로그 → 취소 버튼만(확인/취소 두 결정 명시).

### 11-A. 제목 스케일 (다이얼로그 전용 위계)

왜: 다이얼로그는 좁은 박스라 페이지 h1(`styles.pageTitle` ~27px, §6)을 그대로 쓰면 과하게 크다. **페이지 제목과 통일하지 않고 다이얼로그 전용으로 한 단계 작게** 둔다.

- 베이스 `DialogTitle`(`ui/dialog.tsx`): **`text-xl`(20px) / `font-semibold`(600) / `leading-snug` / `tracking-[-0.01em]`**. `VisitedDialog`·`DeleteConfirmDialog` 모두 이 베이스를 쓴다(개별 다이얼로그에서 `styles.pageTitle`로 덮어쓰지 않는다).
- 설명(`DialogDescription`)은 `--s-sub` 톤. `VisitedDialog`는 `styles.pageSubtitle`(margin-top 0.25rem)로 제목↔설명 간격을 담당.

### 11-B. 다크모드 식별성 (오버레이 · 팝업 분리)

왜: 다크에서 페이지(`#0a0712`)가 이미 어두워, 라이트용 오버레이(검정 10%)로는 거의 안 눌려 팝업 경계가 안 보인다. 라이트 식별성은 유지하면서 다크만 강화한다.

- **오버레이**(`styles.dialogOverlay`, `screens.module.css`): 라이트 `rgba(0,0,0,0.10)`(기존 `bg-black/10`과 동일) / 다크 `rgba(0,0,0,0.55)`. `@media (prefers-color-scheme: dark)`로 직접 분기(backdrop은 portal로 나가 `--s-*` 상속 불가). CSS module 클래스라 Tailwind utilities 레이어를 이긴다.
- **팝업 가장자리**(`styles.dialogPopup` 다크 블록): ring 색 토큰 `--s-card-border`를 다크에서 `#3a2f4e`(= border-strong)로 끌어올려 카드면(`#241a36`)과 분리 + `box-shadow: 0 16px 48px -12px rgba(0,0,0,0.7)`로 깊이를 준다. **라이트는 box-shadow를 두지 않아 기존 ring-only 외형 그대로**(무변화).

---

## 12. 화면 전환 로딩 패턴

왜: 로딩 방식은 "앱 전반 일관성"이 아니라 **레이아웃 예측 가능성**으로 정한다. 화면마다 레이아웃 특성이 다르므로 같은 패턴을 강제하면 오히려 레이아웃 점프가 생긴다.

### 패턴 선택 기준

**스켈레톤**: 개별 요소(카드 한 장)의 모양·크기가 예측 가능한 경우.
- 카드 개수가 가변이어도 **모양이 고정**이면 스켈레톤이 위에서부터 차곡차곡 정렬돼 점프 없이 자연스럽게 늘고 줄어든다(`/list` 카드 그리드, `CardGridSkeleton`).
- 반면 개별 요소의 크기 자체가 가변이면(상세 페이지 텍스트·태그 수) 스켈레톤이 실제 콘텐츠 크기를 예측 못 해 레이아웃 점프 발생 → 서버 prefetch로 해결.

**서버 prefetch** (`page.tsx`에서 조회 → `initialData`): 개별 요소 크기가 가변인 상세 페이지에 적용.
- `page.tsx` 서버 컴포넌트에서 DB 조회(e.g. `getActivityById(id)`) → 클라이언트 컴포넌트에 `initialData`로 전달 → React Query `isLoading=false` → 스켈레톤 없이 즉시 렌더.
- 데이터가 없으면 서버에서 `notFound()` 처리 → 클라이언트 로딩 후 에러 표시 대신 즉시 404.

**프로그래매틱 `router.push` + API 대기**: `useTopLoader()`로 수동 제어.
```tsx
topLoader.start()              // API 호출 직전
try {
  const res = await fetch(...)
  if (!res.ok) {
    topLoader.done()           // 에러 경로: 명시 done
    return
  }
  router.push('/destination')  // 성공 경로: done() 호출 안 함
} catch {
  topLoader.done()             // 네트워크 오류: 명시 done
} finally {
  setIsLoading(false)
  // ⚠️ finally에 done()을 두면 router.push 직후 동기 실행되어 RSC 도착 전에 막대가
  //    조기 종료 → 막대 끝 후 공백. 성공 경로는 pushState 패치가 RSC 완료 시 자동 done.
}
```

**`<Link>` 전환**: `nextjs-toploader` 자동.
- 앵커 클릭 → `start()` → RSC 완료 후 `pushState` 패치 → `done()`. 추가 코드 불필요.
- `<DropdownMenuItem onClick={() => router.push(...)}>`처럼 앵커 클릭이 아닌 프로그래매틱 이동은 자동 적용 안 됨. API 대기 없는 즉시 이동이면 막대 없어도 무방.

### 의도된 차이

| 라우트 | 로딩 패턴 | 이유 |
|---|---|---|
| `/list` | `CardGridSkeleton` | 카드 모양 고정, 개수만 가변 → 스켈레톤이 점프 없이 자연스럽게 늘고 줄어듦 |
| `/activities/[id]`, `/places/[id]` | 서버 prefetch + `initialData` | 텍스트·태그 길이 가변 → 스켈레톤이 크기 예측 못 해 점프. prefetch로 즉시 렌더 |

둘 다 위 기준을 따른 결과이며, 패턴이 달라도 불일치가 아니다.

### 새 라우트 추가 시 판단 흐름

```
도착 화면의 개별 요소 크기가 예측 가능한가?
  YES (카드 그리드 등) → 스켈레톤
  NO  (상세 페이지, 가변 텍스트) → 서버 prefetch (page.tsx + initialData)

전환 방식이 <Link>인가?
  YES → toploader 자동, 추가 코드 없음
  NO  (router.push + API 대기) → useTopLoader() 수동 제어 (위 코드 패턴 참조)
  NO  (router.push + 즉시 이동) → 막대 없어도 무방
```

---

## 🚫 금지 규칙 (별도 섹션)

라이트모드에서 절대 하지 말 것:
1. **라이트모드 페이지/카드/컨트롤 배경에 보라·핑크 사용 금지.** 라이트 페이지 배경은 `--s-page-bg-light`(기본 중성 `#fafafb`, 홈만 옅은 라일락 `#f4f2fa`), 카드/컨트롤은 `#ffffff`. (옛 `bg-gradient-to-br from-violet-50 to-purple-100` 같은 채도 있는 보라 그라데이션 배경 금지 — `#f4f2fa`는 채도가 거의 없는 라이트 서피스로 허용)
2. 보라는 **강조에만**: 활성 칩/옵션 틴트(`--s-accent-soft-bg`+`--s-active-line` 보더, §5-A), 카테고리 아이콘(`catIcon`), 포커스 보더/링(`--s-active-line/glow`), CTA 단색 채움(`--s-active-line`), FAB·`gradIcon`·`filterCount`. 중성 표면(면)에는 쓰지 않는다.
3. 통계 숫자(`styles.statNum`)는 라이트에서 **중성 `ink`**. (보라는 다크에서만 `@media`로 적용)
4. 아이콘 버튼 hover 라이트는 **중성 면 `#eceaf3`** — 보라 소프트 금지.
5. 활성/포커스 색을 요소마다 **하드코딩 금지** — 반드시 `--s-active-*` 토큰 참조.
6. 기능 아이콘에 **이모지 금지** — `lucide-react` 단색 선만.
7. 화면마다 헤더 직접 작성 금지 — **`PageHeader` 공용 컴포넌트만** 사용.
8. FAB/하단 여백에 `env(safe-area-inset-bottom)` 의존 금지 — 고정 rem 사용.
9. **하단 액션 버튼(Primary/삭제)에 그라데이션 금지** — `--s-active-fill`, `--s-grad`는 FAB·`gradIcon`·`filterCount` 등 소형 액센트 전용. 버튼 채움은 `--s-active-line` 단색.
10. **Primary 버튼에 `--s-accent` 사용 금지** — 다크에서 `#c084fc` (L=65%)로 오버라이드되어 카드면 위에서 부상. `--s-active-line` (`#7c3aed`, 다크 재정의 없음) 사용.
11. **Primary 버튼 배경에 inline `style={}` 사용 금지** — CSS 클래스를 항상 이겨 다크 모드 보정 불가. `styles.detailPrimaryBtn` CSS module 클래스로 제어.
12. **폼 컨트롤(라벨·입력 텍스트·보더·placeholder)에 shadcn `--foreground`/`--input`/`--muted-foreground` 의존 금지** — 이 앱은 `.dark` 클래스를 안 붙이고 `@media (prefers-color-scheme: dark)` + `--s-*`로만 다크를 처리하므로, shadcn HSL 토큰은 다크에서 라이트값에 고정되어 안 보인다(대비 ~1:1). 라벨/본문 `--s-ink`, placeholder `--s-faint`, 보더 `--s-card-border-strong` 사용(§4-A). `.dark` 클래스 신규 도입도 금지.
13. **입력바/textarea 본문 폰트에 `md:text-sm`(14px↓) 금지** — `text-base`(16px) 고정. 모바일 14px 이하면 iOS 포커스 시 자동 줌인 발생.

---

## 백로그 (별도 작업 필요 — 미해결)

- **다이얼로그가 OS 다크 미대응** (`VisitedDialog`·`DeleteConfirmDialog` 등 `DialogContent`): 다이얼로그 표면·텍스트·hover가 shadcn HSL 토큰(`--popover`/`--popover-foreground`/`--muted`/`--foreground`)에 의존하는데, 이 토큰들은 `globals.css`에서 **`.dark` 클래스 전용**으로만 다크값을 갖는다. 이 앱은 `.dark`를 부착하지 않고 `@media (prefers-color-scheme: dark)` + `--s-*`로만 다크를 처리하므로, **OS 다크에서 다이얼로그 전체가 라이트(흰 표면)로 고정**된다. ghost `X` 닫기의 `dark:hover:bg-muted/50`도 같은 이유로 죽은 규칙. (금지규칙 12와 동일 원인.) → 해결: `DialogContent` 표면·닫기 버튼을 `--s-card-bg`/`--s-ink`/`--s-card-border-strong` 등 `--s-*` 토큰으로 치환하는 별도 작업 필요. 단순 hover 패치가 아니라 다이얼로그 다크 테마 전반의 작업이라 범위를 따로 잡는다.
- **라이트 `--s-*` 토큰 정식 정의 미비 — 앱 전역 토큰 정리** (`docs/design-token-audit.md` 참조): 라이트는 핵심 토큰(`--s-active-*`/`--s-card-bg`/`--s-card-border-strong`/`--s-input`/`--s-card-shadow`)만 `.page`에 정의돼 있고, `--s-accent-soft-bg`·`--s-sub`·`--s-faint`·`--s-ink`·`--s-accent`·`--s-grad`·`--s-grad-shadow`·`--s-card-shadow-hover` 등은 **라이트 값이 없어 각 클래스의 `var(--token, fallback)` fallback에 의존**한다(다크만 `@media`로 정의). 동작엔 문제없지만 단일 출처가 약함. → 라이트 `.page`에 정식 정의를 추가하는 정리 작업(시각 변경 아님, 1:1 유지 확인 필요).
- **`--s-faint` fallback 불일치**: 같은 토큰인데 `.searchIcon`은 `#9ca3af`, `.searchInput::placeholder`는 `#b0aabe` — 라이트에서 둘 다 live라 실제로 다른 회색으로 렌더된다. 의미 분리(아이콘=기능 신호 / placeholder=임시 안내)인지 단순 불일치인지 정리 필요. (`--s-card-border-strong`·`--s-active-line` fallback도 선언마다 다르나 토큰이 정의돼 있어 렌더 영향은 없음 — 소스 표기만 통일하면 됨.)
- **드롭다운 portal 리터럴 토큰화**: `globals.css`의 `[data-slot='dropdown-menu-*']`은 body로 portal 렌더돼 `.page` `--s-*`를 못 받아 색·그림자가 직접 리터럴(`#eceaf3`·`#241a36`·`#3a2f4e`·`#2c2442` 등). 토큰화하려면 다이얼로그 `.dialogPopup` 패턴처럼 portal 루트에 토큰 재선언 필요. (위 다이얼로그 다크 대응과 묶어 처리 가능.) ※ **삭제 항목 hover 배경만 `--s-destructive-soft-bg`로 토큰화 완료**(§5-B) — 나머지(콘텐츠 배경·보더·구분선·일반 항목 hover)는 아직 리터럴.
- **`.detailDeleteBtn` 라이트 hover 불투명도 불일치**: 라이트 hover가 `/0.15`로, 공통 토큰 base(`--s-destructive-soft-bg` 라이트 `/0.1`)와 다르다. 본래 있던 불일치이며, 통일하면 라이트 hover가 `0.15→0.1`로 묽어지는 **라이트 시각 변경**이라 별도 사인오프 필요. (다크는 §5-B대로 이미 이 표면 전용값 `/0.20`·`/0.26`으로 분리 적용됨.)

---

## 부록: shadcn HSL 토큰 (ui/* 컴포넌트용)

`src/app/globals.css` / `tailwind.config.ts` 기준. `--radius: 0.625rem`.

| 토큰 | 라이트(HSL) | 다크(HSL) |
|---|---|---|
| `--background` | `0 0% 100%` | `0 0% 8%` |
| `--foreground` | `0 0% 8%` | `0 0% 98%` |
| `--card` | `0 0% 100%` | `0 0% 12%` |
| `--primary` | `0 0% 12%` | `0 0% 90%` |
| `--muted` | `0 0% 96%` | `0 0% 16%` |
| `--muted-foreground` | `0 0% 40%` | `0 0% 60%` |
| `--border` / `--input` | `0 0% 90%` | `0 0% 20%` |
| `--ring` | `262 83% 58%` | `262 83% 58%` |
| `--destructive` | `0 84% 60%` | `0 72% 51%` |
