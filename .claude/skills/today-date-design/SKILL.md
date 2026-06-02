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

## 1. 배경색 (페이지 / 카드 / 컨트롤)

왜: 흰·검은 여백 노출을 막고(전역 배경), 라이트는 보라색기 없는 중성, 다크는 보라/핑크 코너 글로우로 무드를 준다.

| 용도 | 라이트 | 다크 | 출처/클래스 |
|---|---|---|---|
| 전역 html/body | `#ffffff` | `#0a0712` | `globals.css` html,body |
| 페이지 고정 배경 레이어 | `#fafafb` | radial(보라 `rgba(192,132,252,0.12)`)+radial(핑크 `rgba(244,114,182,0.07)`)+linear `#0a0712→#120c1e` | `.page::before` |
| 카드 표면 `--s-card-bg` | `#ffffff` | `#241a36` | `styles.card` |
| 컨트롤 표면(검색/필터/세그먼트) | `#ffffff` | 세그먼트 트랙 `#1b1430`, 검색/필터 `#241a36` | `styles.search*/filterToggle/segment` |
| 소프트 강조 배경 `--s-accent-soft-bg` | `#f6f1ff` | `#2d2540` | `styles.statCardAccent/visitedTag/visitBox` |

복붙: 페이지 래퍼는 `styles.page`만 쓰면 배경이 자동 적용됨. 카드/컨트롤은 `styles.card` 등 클래스가 토큰을 읽으므로 색 지정 불필요.

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

클릭 카드: `cn(styles.card, styles.cardInteractive)` → hover 시 `translateY(-2px)` + 보더/그림자 강조.

복붙:
```tsx
<div className={cn(styles.card, styles.cardInteractive, 'p-3.5')}>…</div>
```

---

## 4. 토글 · 검색 · 필터 컨트롤 스타일

왜: 라이트는 흰 면 + 옅은 보더(`--s-card-border-strong`)로 통일, 활성만 보라로 구분. 포커스 시 보더는 1px 자리를 항상 차지해 레이아웃 점프가 없다.

- **세그먼트 토글** `styles.segment` / `styles.segmentBtn` / `styles.segmentBtnActive`
  - 트랙: padding `0.1875rem`, radius `0.625rem`, 라이트 `#fff`+보더 `#eceaf3` / 다크 트랙 `#1b1430`+보더 없음
  - 버튼: padding `0.375rem 0.75rem`, radius `0.5rem`, `0.8125rem`/weight 500, color `sub`
- **검색 입력** `styles.search` + `styles.searchInput`(+`styles.searchIcon` 왼쪽 아이콘)
  - height `2.5rem`, radius `0.75rem`, 보더 `1px var(--s-card-border-strong)`, bg `card-bg`, font `0.875rem`
- **필터 토글 버튼** `styles.filterToggle`(+`styles.filterToggleActive`)
  - height `2.25rem`, radius `0.625rem`, `0.8125rem`/weight 500
- **필터 칩** `styles.chip`(+`styles.chipActive`)
  - radius `9999px`, padding `0.375rem 0.75rem`, font `0.8125rem`, 보더 `1px var(--s-card-border)`
- **초기화 버튼** `styles.resetBtn` (필터 버튼과 같은 높이의 작은 pill, `X` 아이콘 + 텍스트)
- **활성 필터 개수 뱃지** `styles.filterCount` (그라데이션 채움)

복붙(필터 칩):
```tsx
<button className={cn(styles.chip, active && styles.chipActive)}>
  <CategoryIcon name={c.name} className="h-3.5 w-3.5" />
  {c.name}
</button>
```

---

## 5. 활성화 상태 규칙 (활성 칩 색 · 글씨 · 포커스링 분리)

왜: 활성/선택/포커스 색을 **단일 토큰 세트**로만 참조해, 활성색 변경 시 한 곳(`screens.module.css` `.page`)만 고친다. 요소별 하드코딩 금지.

활성 토큰 (라이트 / 다크):
| 토큰 | 라이트 | 다크 | 의미 |
|---|---|---|---|
| `--s-active-fill` | `linear-gradient(135deg,#a855f7,#ec4899)` | `linear-gradient(135deg,#c084fc,#f472b6)` | 채움형 칩 배경 |
| `--s-active-on` | `#ffffff` | `#ffffff` | 채움 위 글씨/아이콘 |
| `--s-active-line` | `#7c3aed` | `#7c3aed` | 활성/포커스 보더·링 |
| `--s-active-text` | `#7c3aed` | `#d8b4fe` | 외곽선형 활성(토글/필터버튼) 글씨·아이콘 |
| `--s-active-glow` | `rgba(124,58,237,0.2)` | 동일 | 옅은 포커스 글로우 |

**포커스 역할 분리 규칙 (중요):**
- 텍스트 입력(검색/위치): `:focus` → 활성 보더(`--s-active-line`) **+ 링** `box-shadow: 0 0 0 3px var(--s-active-glow)`.
- 버튼류(필터 토글/칩): `:focus-visible` → 활성 **보더만**, 링 없음.

활성 칩 규칙: `styles.chipActive`는 예외 없이 `--s-active-fill` 채움 + `--s-active-on`(흰) 글씨/아이콘. 세그먼트/필터버튼 같은 외곽선형 활성은 `--s-active-text` + `--s-active-line` 보더.

---

## 6. 헤더(PageHeader) 통일 기준

왜: 홈과 `/list`의 로고~제목~서브카피 세로 간격을 픽셀 단위로 동일하게 유지하려고 **공용 `PageHeader`** 하나만 쓴다. 절대 화면마다 직접 헤더를 짜지 않는다.

복붙:
```tsx
<PageHeader title="우리의 위시리스트" subtitle="함께 쌓아온 곳들" homeNav />
// 홈에서는 homeNav 생략(로고가 링크 아님), 하위 화면은 homeNav={true}
```

- **브랜드 줄**: `MiniHeart`(보라→핑크 그라데이션 하트, `h-6 w-6` / lg `h-7 w-7`) + `Today Date` 텍스트(`styles.brand`: `1rem`/weight 500/letter-spacing `-0.01em`, lg `text-lg`), 둘 사이 `gap-2.5`. 우측에 홈 버튼(하위 화면) + 햄버거 메뉴(`HomeMenu`).
- **제목 블록 간격**: 헤더 → 제목 블록 `mt-8 lg:mt-10`. 제목 블록 → 다음 콘텐츠(탭/CTA) `mt-8`.
- **제목** `styles.pageTitle`: `font-size 1.7rem`(~27px), lg `1.875rem`(30px) / **weight 600 (semibold)** / letter-spacing `-0.01em` / line-height `1.2`. (bold 700 아님 — 중간 톤)
- **서브카피** `styles.pageSubtitle`: `margin-top 0.25rem`(lg `0.375rem`), `font 0.875rem`(lg `1.125rem`), color `sub`.

---

## 7. 아이콘 규칙

왜: 아이콘은 `lucide-react` 단색 선으로 통일해 톤을 맞춘다. DB에 저장된 카테고리 이모지는 화면 아이콘으로 쓰지 않는다.

- 라이브러리: **`lucide-react`만** 사용. 기능 아이콘으로 **이모지 사용 금지**.
- 카테고리 아이콘은 이름→lucide 매핑(`src/components/track/categoryIcon.tsx`)으로만 고른다. DB `category.icon`(이모지)은 렌더하지 않는다.
- **아이콘 색 기준**:
  - 카테고리 아이콘 `styles.catIcon`: `--s-accent`(라이트 `#7c3aed` / 다크 `#c084fc`). 활성 칩 안에서는 `--s-active-on`(흰)으로 전환.
  - 메타 줄 아이콘(Clock/Sun/Moon/MapPin/Utensils 등): 색 지정 없이 부모 텍스트색(`sub`) 상속.
  - 헤더 아이콘 버튼(`styles.iconBtn`): `sub`, hover 시 라이트는 중성 면 `#eceaf3`+`ink`, 다크는 보라 소프트.
- strokeWidth: 카테고리 `2`, CTA 그라데이션 배지 내부 아이콘 `1.75`.
- 크기 관례: 메타/뱃지 아이콘 `h-3 w-3`~`h-3.5 w-3.5`, 헤더/검색 `h-4~5`.
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

---

## 9. 화면 하단 여백 제거 방법 (html / body / main / FAB)

왜: iOS 주소창 토글·오버스크롤·콘텐츠 길이에 따라 흰/검은 여백이나 FAB 출렁임이 생기지 않게 한다.

- **html/body** (`globals.css`): `min-height: 100svh` + 배경색을 html/body 레벨에 직접 지정(라이트 `#fff`/다크 `#0a0712`) + `overscroll-behavior: none`. → SSR 시점부터 여백 없음.
- **`.page`**: `min-height: 100dvh`, `display:flex; flex-direction:column`, 세이프영역 `padding`(상단 `env(safe-area-inset-top)+0.5rem` 등).
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

---

## 🚫 금지 규칙 (별도 섹션)

라이트모드에서 절대 하지 말 것:
1. **라이트모드 페이지/카드/컨트롤 배경에 보라·핑크 사용 금지.** 라이트 페이지 배경은 중성 `#fafafb`, 카드/컨트롤은 `#ffffff`. (옛 `bg-gradient-to-br from-violet-50 to-purple-100` 같은 보라 그라데이션 배경 금지)
2. 보라는 **강조에만**: 활성 칩 채움(`--s-active-fill`), 카테고리 아이콘(`catIcon`), 포커스 보더/링(`--s-active-line/glow`), FAB·`gradIcon`·`filterCount`. 표면(면)에는 쓰지 않는다.
3. 통계 숫자(`styles.statNum`)는 라이트에서 **중성 `ink`**. (보라는 다크에서만 `@media`로 적용)
4. 아이콘 버튼 hover 라이트는 **중성 면 `#eceaf3`** — 보라 소프트 금지.
5. 활성/포커스 색을 요소마다 **하드코딩 금지** — 반드시 `--s-active-*` 토큰 참조.
6. 기능 아이콘에 **이모지 금지** — `lucide-react` 단색 선만.
7. 화면마다 헤더 직접 작성 금지 — **`PageHeader` 공용 컴포넌트만** 사용.
8. FAB/하단 여백에 `env(safe-area-inset-bottom)` 의존 금지 — 고정 rem 사용.

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
