> [ARCHIVED] 이 문서는 홈 리디자인 외부 의뢰용 일회성 브리프입니다.
> 목적이 소비되었고 내용이 stale하며, 현재 디자인 권위는 `.claude/skills/today-date-design/SKILL.md`에 있습니다.
> 이력 보존 목적으로만 남겨둡니다.

# Design Brief — Today Date 홈 화면 리디자인

> 목적: 외부 디자이너 AI에게 홈 화면(`/`) 리디자인 시안을 의뢰하기 위한 브리프.  
> 모든 값은 코드 실측 기준 (추측·기억 금지). 출처 파일을 각 항목에 명시.

---

## 스택 · 제약 (반드시 준수)

| 항목 | 사양 |
|---|---|
| 프레임워크 | Next.js 14 (App Router, RSC) |
| 스타일링 | Tailwind CSS + CSS Modules (`screens.module.css`) |
| UI 컴포넌트 | shadcn/ui (`style: "base-nova"`, `baseColor: "neutral"`) |
| 아이콘 | `lucide-react` 전용 |
| 다크모드 트리거 | **`@media (prefers-color-scheme: dark)` 전용** |
| ⚠️ 다크모드 주의 | Tailwind의 `dark:` 변형과 shadcn의 `.dark` 클래스는 이 앱에서 **작동 안 함**. `tailwind.config.ts`에 `darkMode: ['class']`가 선언되어 있으나 `.dark` 클래스를 런타임에 부여하지 않음. 다크 시안도 반드시 `@media` 기반 토큰으로 처리할 것. |
| 색·값 하드코딩 금지 | 모든 색·두께는 아래 토큰에 정의하고 `var()` 참조. `px`·hex 리터럴 직접 사용 금지. |
| 페이지 라우트 | 홈 `/`, 목록 `/list`, 추천 `/recommend/activity`, `/recommend/place` |

---

## 1. 색상 토큰

### 1-A. shadcn/Tailwind 시스템 토큰 (HSL)
출처: `src/app/globals.css` `:root`

| 토큰 변수 | 라이트 (HSL) | 라이트 hex 환산 | 다크 (`globals.css .dark` 블록) | 비고 |
|---|---|---|---|---|
| `--background` | `0 0% 100%` | #ffffff | `0 0% 8%` ≈ #141414 | html/body 배경 |
| `--foreground` | `0 0% 8%` | ≈ #141414 | `0 0% 98%` ≈ #fafafa | |
| `--card` | `0 0% 100%` | #ffffff | `0 0% 12%` ≈ #1f1f1f | |
| `--card-foreground` | `0 0% 8%` | ≈ #141414 | `0 0% 98%` ≈ #fafafa | |
| `--primary` | `0 0% 12%` | ≈ #1f1f1f | `0 0% 90%` ≈ #e5e5e5 | 중성(보라 아님) |
| `--primary-foreground` | `0 0% 98%` | ≈ #fafafa | `0 0% 12%` ≈ #1f1f1f | |
| `--secondary` | `0 0% 96%` | ≈ #f5f5f5 | `0 0% 16%` ≈ #292929 | |
| `--muted` | `0 0% 96%` | ≈ #f5f5f5 | `0 0% 16%` ≈ #292929 | |
| `--muted-foreground` | `0 0% 40%` | ≈ #666666 | `0 0% 60%` ≈ #999999 | |
| `--accent` | `0 0% 96%` | ≈ #f5f5f5 | `0 0% 16%` ≈ #292929 | **shadcn accent = 중성**. 브랜드 보라는 `--s-accent` 참조 |
| `--destructive` | `0 84% 60%` | ≈ #ef4343 | `0 72% 51%` ≈ #dc3f3f | |
| `--destructive-foreground` | `0 0% 98%` | ≈ #fafafa | `0 0% 98%` ≈ #fafafa | |
| `--border` | `0 0% 90%` | ≈ #e5e5e5 | `0 0% 20%` ≈ #333333 | |
| `--input` | `0 0% 90%` | ≈ #e5e5e5 | `0 0% 20%` ≈ #333333 | |
| `--ring` | `262 83% 58%` | ≈ #7c3aed | `262 83% 58%` ≈ #7c3aed | 보라 — 라이트·다크 동일 |
| `--radius` | `0.625rem` | 10px | — | Tailwind `rounded-lg` 기준 |

> ⚠️ `.dark` 클래스 블록(`globals.css` 29–49행)은 코드에 존재하나 이 앱의 다크모드와 **무관**함. 실제 다크는 `:root` 및 `.page`의 `@media (prefers-color-scheme: dark)` 블록이 담당.

### 1-B. 앱 전용 `--s-*` 토큰 (라이트)
출처: `src/components/screens.module.css` `.page` 블록 (라이트) + `src/app/globals.css` `:root`

#### 활성/포커스 상태
| 토큰 | 값 | 출처 |
|---|---|---|
| `--s-active-fill` | `#7c3aed` | `screens.module.css .page` |
| `--s-active-on` | `#ffffff` | `screens.module.css .page` |
| `--s-active-line` | `#7c3aed` | `screens.module.css .page` |
| `--s-active-text` | `#7c3aed` | `screens.module.css .page` |
| `--s-active-glow` | `0 0 0 3px rgba(124,58,237,0.2)` | `screens.module.css .page` |
| `--s-focus-ring` | `0 0 0 2px rgba(124,58,237,0.5)` | `screens.module.css .page` |
| `--s-focus-ring-card` | `0 0 0 3px rgba(124,58,237,0.5)` | `screens.module.css .page` |

#### 표면/보더/그림자
| 토큰 | 값 | 출처 |
|---|---|---|
| `--s-card-bg` | `#ffffff` | `screens.module.css .page` + `globals.css :root` |
| `--s-card-border-strong` | `#eceaf3` | `screens.module.css .page` + `globals.css :root` |
| `--s-input` | `#eceaf3` | `screens.module.css .page` |
| `--s-card-shadow` | `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)` | `screens.module.css .page` |
| `--s-card-border` | 코드 미정의 (라이트) — fallback: `rgba(0,0,0,0.06)` | `screens.module.css .card` fallback |
| `--s-card-shadow-hover` | 코드 미정의 (라이트) — fallback: `0 12px 28px -12px rgba(168,85,247,0.32)` | `screens.module.css .cardInteractive:hover` fallback |
| `--s-card-hover-border` | 코드 미정의 (라이트) — fallback: `rgba(168,85,247,0.4)` | `screens.module.css .cardInteractive:hover` fallback |
| `--s-dropdown-ring` | `#eceaf3` | `globals.css :root` |
| `--s-dropdown-shadow` | `0 14px 32px -12px rgba(20,20,30,0.18)` | `globals.css :root` |

#### 텍스트
| 토큰 | 값 | 출처 |
|---|---|---|
| `--s-ink` | `#1a1033` | `screens.module.css .page` + `globals.css :root` |
| `--s-sub` | `#6b7280` | `screens.module.css .page` |
| `--s-faint` | 코드 미정의 (라이트) — fallback: `#9ca3af` | `screens.module.css .faint` fallback |
| `--s-placeholder` | `#b0aabe` | `screens.module.css .page` |

#### 브랜드/강조
| 토큰 | 값 | 출처 |
|---|---|---|
| `--s-accent` | `#7c3aed` (보라) | `screens.module.css .page` |
| `--s-accent-soft-bg` | `#f6f1ff` | `screens.module.css .page` + `globals.css :root` |
| `--s-accent-soft-text` | 코드 미정의 (라이트) | 다크에만 정의됨 |
| `--s-grad` | `linear-gradient(135deg, #a855f7 0%, #ec4899 100%)` | `screens.module.css .page` |
| `--s-grad-shadow` | 코드 미정의 (라이트) — fallback: `0 6px 16px -8px rgba(168,85,247,0.5)` | `screens.module.css .gradIcon` fallback |

#### 기타 표면 (라이트 미정의)
| 토큰 | 상태 | 다크값 |
|---|---|---|
| `--s-divider` | 라이트 미정의 — fallback: `#ece7f5` | `#2c2442` |
| `--s-track` | 라이트 미정의 — fallback: `var(--s-card-border-strong, #eceaf3)` | `#1b1430` |
| `--s-raised` | 라이트 미정의 | `#2f2647` |
| `--s-skeleton` | 라이트 미정의 — fallback: `#ece7f5` | `#2a2340` |

#### 시맨틱 (Destructive)
| 토큰 | 값 | 출처 |
|---|---|---|
| `--s-destructive-soft-bg` | `hsl(var(--destructive) / 0.1)` (라이트) | `globals.css :root` |
| `--s-destructive-soft-bg-strong` | `hsl(var(--destructive) / 0.2)` (라이트) | `globals.css :root` |

### 1-C. 앱 전용 `--s-*` 토큰 (다크)
출처: `src/components/screens.module.css` `@media (prefers-color-scheme: dark) .page` + `src/app/globals.css @media`

#### 활성/포커스 (다크)
| 토큰 | 다크값 |
|---|---|
| `--s-active-fill` | 재정의 없음 → 라이트와 동일 `#7c3aed` |
| `--s-active-text` | `#d8b4fe` |
| `--s-active-line` | 재정의 없음 → `#7c3aed` |
| `--s-active-glow` | `0 0 0 3px rgba(192,132,252,0.2)` |
| `--s-focus-ring` | `0 0 0 2px rgba(192,132,252,0.5)` |
| `--s-focus-ring-card` | `0 0 0 3px rgba(192,132,252,0.5)` |

#### 표면/보더/그림자 (다크)
| 토큰 | 다크값 |
|---|---|
| `--s-card-bg` | `#241a36` |
| `--s-card-border` | `#2a1f3e` |
| `--s-card-border-strong` | `#3a2f4e` |
| `--s-input` | `#4a3f63` |
| `--s-card-shadow` | `0 8px 24px -16px rgba(0,0,0,0.6)` |
| `--s-card-shadow-hover` | `0 16px 40px -16px rgba(0,0,0,0.72), 0 4px 22px -10px rgba(192,132,252,0.3)` |
| `--s-card-hover-border` | `rgba(192,132,252,0.5)` |
| `--s-divider` | `#2c2442` |
| `--s-track` | `#1b1430` |
| `--s-raised` | `#2f2647` |
| `--s-skeleton` | `#2a2340` |
| `--s-dropdown-ring` | `#3a2f4e` |
| `--s-dropdown-shadow` | `0 18px 44px -12px rgba(0,0,0,0.75)` |

#### 텍스트 (다크)
| 토큰 | 다크값 |
|---|---|
| `--s-ink` | `#f5f3fa` |
| `--s-sub` | `#a8a0b8` |
| `--s-faint` | `#8c84a0` |
| `--s-placeholder` | `#8c84a0` |

#### 브랜드/강조 (다크)
| 토큰 | 다크값 |
|---|---|
| `--s-accent` | `#c084fc` (라벤더) |
| `--s-accent-soft-bg` | `#573f7f` |
| `--s-accent-soft-text` | `#d8b4fe` |
| `--s-grad` | `linear-gradient(135deg, #c084fc 0%, #f472b6 100%)` |
| `--s-grad-shadow` | `0 8px 20px -8px rgba(192,132,252,0.45)` |

#### 시맨틱 (다크)
| 토큰 | 다크값 | 출처 |
|---|---|---|
| `--s-destructive-soft-bg` | `hsl(var(--destructive) / 0.18)` | `globals.css @media :root` |
| `--s-destructive-soft-bg-strong` | `hsl(var(--destructive) / 0.3)` | `globals.css @media :root` |

### 1-D. 페이지 배경색 (전역)
출처: `src/app/globals.css` 및 `screens.module.css .page::before`

| 상태 | 값 | 출처 |
|---|---|---|
| html/body 라이트 | `#ffffff` | `globals.css` html, body |
| html/body 다크 | `#0a0712` | `globals.css @media` |
| .page 배경 레이어 라이트 | `#fafafb` (고정 레이어) | `screens.module.css .page::before` |
| .page 배경 레이어 다크 | `radial-gradient(50rem 32rem at 100% -8%, rgba(192,132,252,0.12), transparent 62%), radial-gradient(44rem 30rem at -6% 6%, rgba(244,114,182,0.07), transparent 60%), linear-gradient(180deg, #0a0712 0%, #120c1e 100%)` | `screens.module.css .page::before @media` |

---

## 2. 타이포그래피

출처: `src/components/screens.module.css`

### 폰트 패밀리
```
'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
'SF Pro Display', 'SF Pro Text', 'Apple SD Gothic Neo', system-ui,
'Segoe UI', Roboto, sans-serif
```
출처: `screens.module.css .page`

### 역할별 타이포 스케일

| 역할 | 클래스/컴포넌트 | size (mobile) | size (lg≥1024px) | weight | letter-spacing | line-height | color 토큰 |
|---|---|---|---|---|---|---|---|
| 페이지 제목 | `.pageTitle` | `1.7rem` (~27px) | `1.875rem` (30px) | 600 | -0.01em | 1.2 | `--s-ink` |
| 페이지 서브카피 | `.pageSubtitle` | `0.875rem` (14px) | `1.125rem` (18px) | 400 | — | — | `--s-sub` |
| 브랜드명 "Today Date" | `.brand` (+ Tailwind `lg:text-lg`) | `1rem` (16px) | `1.125rem` (18px) | 500 | -0.01em | — | `--s-ink` |
| 카드 제목 | `.cardTitle` | `1rem` (16px) | — | 500 | -0.01em | — | `--s-ink` |
| 통계 숫자 | `.statNum` (+ Tailwind `text-2xl lg:text-3xl`) | `1.5rem` (24px) | `1.875rem` (30px) | 600 | -0.02em | 1 | 라이트 `--s-ink` / 다크 `--s-accent` |
| 컨트롤 텍스트 (칩·세그먼트·필터) | `.chip`, `.segmentBtn`, `.filterToggle` 등 | `0.8125rem` (13px) | — | 500 | — | — | `--s-sub` |
| 탭 | `.tab` | `0.9375rem` (15px) | — | 500 | — | — | 라이트 `#9ca3af` / 다크 `--s-sub` |
| 검색 입력 | `.searchInput` | `0.875rem` (14px) | — | 400 | — | — | `--s-ink` |
| 날짜 트리거 | `.dateTrigger` | `1rem` (16px — iOS 줌인 방지) | — | 400 | — | — | `--s-ink` |
| 뱃지/레이블 | `.mealBadge`, `.labelBadge` | `11px` / `0.8125rem` | — | 400 / 500 | — | — | `--s-sub` |
| 상태 태그 | `.visitedTag` | `0.75rem` (12px) | — | 500 | — | — | 상태별 상이 |
| 뒤로가기 링크 | `.backLink` | `0.8125rem` (13px) | — | 400 | — | — | `--s-sub` |

---

## 3. 레이아웃 · 반경 · 간격 · 그림자

### Border Radius 단계
출처: `tailwind.config.ts` + `screens.module.css`

| 이름 | 값 | 출처 | 사용처 |
|---|---|---|---|
| `--radius` (Tailwind `rounded-lg`) | `0.625rem` = 10px | `globals.css :root`, `tailwind.config.ts` | 입력바·옵션·날짜 트리거 |
| `rounded-md` | `calc(var(--radius) - 2px)` = 8px | `tailwind.config.ts` | 세그먼트 버튼·editGhostBtn |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 6px | `tailwind.config.ts` | 브랜드링크 focus |
| `.card` | `1rem` = 16px | `screens.module.css .card` | 일반 카드 |
| `.detailCard` | `1.5rem` = 24px | `screens.module.css .detailCard` | 상세 화면 카드 |
| `.gradIcon` | `0.875rem` = 14px | `screens.module.css .gradIcon` | CTA 그라데이션 아이콘 뱃지 |
| `.fab` | `9999px` | `screens.module.css .fab` | FAB (원형) |
| `.chip`, `.mealBadge`, `.filterCount`, `.visitedTag` | `9999px` | `screens.module.css` | pill 형태 |
| `.searchInput` | `0.75rem` = 12px | `screens.module.css .searchInput` | 검색 입력바 |
| `.filterToggle` | `0.75rem` = 12px | `screens.module.css .filterToggle` | 필터 토글 버튼 |
| `.iconBtn` | `0.75rem` = 12px | `screens.module.css .iconBtn` | 헤더 아이콘 버튼 |

### 컨트롤 높이 (표준화된 값)
출처: `screens.module.css`

| 높이 | 적용 컨트롤 |
|---|---|
| `2.25rem` = 36px | `.chip`, `.segmentBtn`, `.resetBtn` |
| `2.5rem` = 40px | `.searchInput`, `.filterToggle`, `.option`, `.dateTrigger` |
| `2.75rem` = 44px | `.iconBtn` (최소 탭 타깃) |
| `3.5rem` = 56px | `.fab` |

### 홈 화면 레이아웃 간격
출처: `src/components/HomeDashboard.tsx` Tailwind 클래스

| 영역 | 값 |
|---|---|
| 최대 너비 | `max-w-xl` (512px) → `lg:max-w-3xl` (768px) |
| 좌우 패딩 | `px-5` (20px) → `lg:px-8` (32px) |
| 상단 패딩 | `pt-6` (24px) → `lg:pt-12` (48px) |
| 하단 패딩 | `pb-16` (64px) → `lg:pb-24` (96px) |
| CTA 카드 그리드 | `grid-cols-2 gap-3` → `lg:gap-4` |
| 통계 섹션 상단 여백 | `mt-6` (24px) |
| 통계 카드 그리드 | `grid-cols-2 gap-3` → `lg:gap-4` |
| 통계 그룹 간격 | `mt-5` (20px) |

### 그림자 / 글로우 토큰 전체 목록
출처: `screens.module.css`

| 토큰 | 라이트값 | 다크값 | 사용처 |
|---|---|---|---|
| `--s-card-shadow` | `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05)` | `0 8px 24px -16px rgba(0,0,0,0.6)` | `.card` |
| `--s-card-shadow-hover` | 미정의 — fallback: `0 12px 28px -12px rgba(168,85,247,0.32)` | `0 16px 40px -16px rgba(0,0,0,0.72), 0 4px 22px -10px rgba(192,132,252,0.3)` | `.cardInteractive:hover` |
| `--s-grad-shadow` | 미정의 — fallback: `0 6px 16px -8px rgba(168,85,247,0.5)` | `0 8px 20px -8px rgba(192,132,252,0.45)` | `.gradIcon`, `.fab` |
| `--s-active-glow` | `0 0 0 3px rgba(124,58,237,0.2)` | `0 0 0 3px rgba(192,132,252,0.2)` | 입력 필드 포커스 전용 |
| `--s-focus-ring` | `0 0 0 2px rgba(124,58,237,0.5)` | `0 0 0 2px rgba(192,132,252,0.5)` | 소형 컨트롤 키보드 포커스 |
| `--s-focus-ring-card` | `0 0 0 3px rgba(124,58,237,0.5)` | `0 0 0 3px rgba(192,132,252,0.5)` | 카드·박스형 키보드 포커스 |
| `--s-dropdown-shadow` | `0 14px 32px -12px rgba(20,20,30,0.18)` | `0 18px 44px -12px rgba(0,0,0,0.75)` | 드롭다운 메뉴 |
| `.miniHeart` drop-shadow | `drop-shadow(0 2px 7px rgba(168,85,247,0.34))` | 동일 | 브랜드 하트 로고 |

### 전환 (Transition)
출처: `screens.module.css`

| 적용 대상 | 값 |
|---|---|
| `.cardInteractive` | `transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease` |
| `.fab` | `transform 140ms ease, filter 140ms ease` |
| 대부분의 컨트롤 | `140ms ease` (색·보더 계열) |

---

## 4. 현재 컴포넌트 무드 (홈 화면 실제 구조)

### 4-A. 페이지 헤더
출처: `src/components/PageHeader.tsx`, `screens.module.css`

```
[MiniHeart SVG 로고]  "Today Date"          [HomeMenu ⋮]
                ↕ mt-6/lg:mt-8
[h1 pageTitle: "오늘, 우리 어떻게 보낼까?"]
[p pageSubtitle: "위시리스트에서 골라드릴게요 💜"]
```

- MiniHeart: SVG 그라데이션 하트 (stop-color `#a855f7` → `#ec4899`), `drop-shadow(0 2px 7px rgba(168,85,247,0.34))`
- 브랜드명: `1rem / weight 500 / letter-spacing -0.01em / --s-ink`
- HomeMenu: 아이콘 버튼 (⋮), 클릭 시 드롭다운

### 4-B. CtaCard (메인 액션 카드)
출처: `src/components/HomeDashboard.tsx`, `screens.module.css`

```
[GradIcon 32×32]          ← border-radius 14px, gradient bg (#a855f7→#ec4899), white icon
  mt-4
[title: text-base semibold --s-ink]
[mt-0.5 subtitle: text-sm --s-sub]
```

- 컨테이너: `.card` + `.cardInteractive` + `flex flex-col p-5`
- `.card`: `bg --s-card-bg / border 1px --s-card-border / border-radius 16px / shadow --s-card-shadow`
- 호버: `translateY(-2px) + border-color --s-card-hover-border + shadow --s-card-shadow-hover`
- 2열 그리드, `gap-3`
- 항목: "오늘 뭐할까?" (Sparkles 아이콘) / "오늘 어디갈까?" (MapPin 아이콘)

### 4-C. StatCard (통계 카드)
출처: `src/components/HomeDashboard.tsx`, `screens.module.css`

```
[statNum: text-2xl/3xl weight-600 letter-spacing -0.02em]   ← 라이트 --s-ink / 다크 --s-accent
[mt-1 label: text-sm --s-sub]
```

- 컨테이너: `.card` + `.cardInteractive` + `flex flex-col p-4`
- 로딩 중: Skeleton `h-7 w-10`
- 2열 그리드, 위시리스트 그룹 / 다녀온 곳 그룹 각 2개씩 총 4개
- 그룹 레이블: `text-sm font-medium --s-sub`

### 4-D. FAB (우하단 플로팅 버튼)
출처: `src/components/HomeFab.tsx`, `screens.module.css .fab`

- 위치: `position: fixed; right: 1.25rem; bottom: 1.5rem; z-index: 20`
- 크기: `3.5rem × 3.5rem` (56px)
- 형태: `border-radius 9999px`
- 배경: `var(--s-grad)` 그라데이션
- 아이콘: `Plus h-6 w-6` (24px), color `#ffffff`
- 그림자: `var(--s-grad-shadow)` fallback: `0 10px 24px -6px rgba(168,85,247,0.55)`
- hover: `translateY(-2px) + filter: brightness(1.05)`
- active: `scale(0.96)`
- 클릭 시: 드롭다운 메뉴 (상단 방향, "활동 추가" / "장소 추가")

---

## 5. 다크모드 스코프 아키텍처 (구현 시 필수 이해)

```
html body (bg: #0a0712)
└── .page (min-height: 100svh)
    ├── .page::before (position: fixed, z-index: -1)  ← 다크 radial-gradient 배경
    └── 자식 요소들 — .page에서 정의한 --s-* 토큰을 상속받아 자동 다크 적응
```

- `.page` 안의 모든 컴포넌트는 `@media (prefers-color-scheme: dark)` 블록에서 재정의된 `--s-*` 토큰을 자동 상속.
- **드롭다운·다이얼로그는 `body`로 portal 렌더** → `.page` 토큰 상속 불가. 전용 `:root` 레벨 토큰(`--s-card-bg`, `--s-card-border-strong`, `--s-ink`, `--s-accent-soft-bg`, `--s-dropdown-ring`, `--s-dropdown-shadow`)을 `globals.css`에서 `@media` 오버라이드로 처리.
- 다이얼로그는 루트 요소(`.dialogPopup`)에 `--s-*` 토큰을 직접 재선언하는 패턴 사용.

---

## 6. 리디자인 의뢰 방향

현재 홈 화면 구조는 **"헤더 + CTA 2열 + 통계 4개 + FAB"**의 단순한 레이아웃.  
아래 방향을 참고해 시안을 제안할 것. 단, **위 §1–5의 토큰과 스택 제약을 벗어나지 말 것**.

1. **무드**: "미니멀 럭셔리 + 로맨틱 한 스푼". 깨끗한 흰 표면에 보라-핑크 그라데이션 포인트.
2. **계층**: 통계 숫자가 너무 작게 느껴질 수 있음. StatCard의 숫자 표현 방식 개선 여지.
3. **배경**: 라이트는 `#fafafb` 단색 — 조금 더 브랜드 색기를 줄 수 있는 방법 탐색 가능.
4. **CTA**: 현재 그라데이션 아이콘 뱃지 + 텍스트 구조. 더 큰 시각적 임팩트 가능.
5. **금지**: `.dark` 클래스 사용, `dark:` Tailwind 변형, 새 토큰 임의 추가 (토큰은 위 목록에서만 참조).
