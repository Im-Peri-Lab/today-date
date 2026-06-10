# 디자인 토큰 감사 — button-system 컨트롤 (핸드오프 문서)

> 목적: `refactor/button-system`에서 다룬 컨트롤들의 색·그림자·보더가 토큰화돼 있는지 점검한 결과.
> 이 문서는 **현재 코드 사실만** 담는다(추측 없음). 후속 AI가 토큰 정리 작업을 할 때 참조.
> 기준 커밋: `refactor/button-system` (감사 시점 HEAD). 모든 행번호는 감사 시점 기준 — 작업 전 재확인 권장.

## 대상 컨트롤
토글(`.segment`/`.segmentBtn`/`.segmentBtnActive`), 검색바(`.searchInput`/`.plainInput`), 필터(`.filterToggle`/`.filterToggleActive`/`.filterCount`/`.resetBtn`), 칩(`.chip`/`.chipActive`/`.catIcon`), 세그먼트(`.option`/`.optionActive`/`.optionCard`/`.optionCardActive`), 드롭다운(globals.css `[data-slot='dropdown-menu-*']`), 그라데이션 진입버튼(`.gradIcon`), 빈상태 하트(`BrandMark.MiniHeart`), 보조(`.mealBadge`).

## 파일
- `src/components/screens.module.css` — `.page` 스코프 `--s-*` 토큰 + 컨트롤 클래스
- `src/app/globals.css` — 드롭다운(포털), shadcn HSL 토큰
- `src/components/BrandMark.tsx` — MiniHeart(SVG 그라데이션 하트)

---

## 전제: 라이트 `.page`에 실제 정의된 `--s-*` 토큰
`screens.module.css`의 `.page`(라이트, 약 24–42행)에 **정의된** 토큰:
`--s-active-fill`, `--s-active-on`, `--s-active-line`, `--s-active-text`, `--s-active-glow`,
`--s-card-bg`, `--s-card-border-strong`, `--s-input`, `--s-card-shadow`.

→ 위 목록 **밖**의 토큰은 **라이트에서 미정의** → 각 클래스의 `var(--token, fallback)` 중 **fallback이 실제 렌더값**이 된다.
미정의(라이트) 예: `--s-sub`, `--s-faint`, `--s-ink`, `--s-accent`, `--s-accent-soft-bg`, `--s-accent-soft-text`,
`--s-grad`, `--s-grad-shadow`, `--s-card-shadow-hover`, `--s-card-hover-border`, `--s-track`, `--s-raised`, `--s-divider`, `--s-card-border`, `--s-skeleton`.

**다크**(`@media (prefers-color-scheme: dark)`의 `.page`, 약 86–112행 + `.dialogPopup` 미러 약 696–713행)는 위 토큰 대부분을 정의함.

> 구조 원칙: **라이트 = 인라인 fallback / 다크 = @media 정의**가 앱 전반의 의도된 패턴.
> 따라서 아래 "라이트 정식 정의 누락"은 이 컨트롤들만의 버그가 아니라 앱 전역 토큰 정리(별도 작업) 성격.

---

## 1. 하드코딩 리터럴 색 (var() 없이 직접)

| 파일:선택자 | 속성 | 값 | 치환 토큰(기존) / 비고 |
|---|---|---|---|
| screens `.gradIcon` | color | `#ffffff` | `--s-active-on`(#ffffff, 존재) |
| screens `.filterCount` | color | `#ffffff` | `--s-active-on` |
| BrandMark `MiniHeart`(빈상태 하트) | svg `stop-color` | `#a855f7` / `#ec4899` | `--s-grad` stop과 동일값. SVG `stopColor`라 var 치환 난해 |
| globals `[dropdown-menu-content]` | box-shadow | `#eceaf3`, `rgba(20,20,30,.18)` | 의미상 `--s-card-border-strong`(#eceaf3). **portal이라 `.page` 토큰 못 받음 → 의도적 리터럴** |
| globals dark `[dropdown-menu-content]` | background / color | `#241a36` / `#f5f3fa` | `--s-card-bg` / `--s-ink` (portal, 의도적) |
| globals dark `[dropdown-menu-content]` | box-shadow | `#3a2f4e`, `rgba(0,0,0,.75)` | `--s-card-border-strong`(dark) (portal) |
| globals dark `[dropdown-menu-separator]` | background | `#2c2442` | `--s-divider`(dark) (portal) |

> 드롭다운은 base-ui가 `body`로 portal 렌더 → `.page`의 `--s-*`를 상속 못 받아 직접 리터럴이 **의도적**. 토큰화하려면 portal 루트에 토큰 재선언이 필요(다이얼로그 `.dialogPopup` 패턴 참고).

---

## 2. 죽지 않은 fallback (라이트에서 토큰 미정의 → fallback이 실제 렌더)

| 선택자 | 속성 | 선언 | 라이트 실제값 | 치환(라이트 정식 정의 필요) |
|---|---|---|---|---|
| `.segmentBtn`·`.filterToggle`·`.resetBtn`·`.chip`·`.option`·`.mealBadge` | color | `var(--s-sub,#6b7280)` | `#6b7280` | `--s-sub` 라이트 정의 |
| `.searchIcon` | color | `var(--s-faint,#9ca3af)` | `#9ca3af` | `--s-faint` |
| `.searchInput::placeholder` | color | `var(--s-faint,#b0aabe)` | `#b0aabe` | `--s-faint` ⚠ 위와 다른 값 |
| `.searchInput` | color | `var(--s-ink,#1a1033)` | `#1a1033` | `--s-ink` |
| `.catIcon` | color | `var(--s-accent,#7c3aed)` | `#7c3aed` | `--s-accent` |
| `.chipActive`·`.optionActive`·`.optionCardActive` | background | `var(--s-accent-soft-bg,#f6f1ff)` | `#f6f1ff` | `--s-accent-soft-bg` 라이트 정의 ★ |
| `.filterCount`·`.gradIcon` | background | `var(--s-grad, linear-gradient(135deg,#a855f7,#ec4899))` | 그 그라데이션 | `--s-grad` 라이트 정의 |
| `.gradIcon` | box-shadow | `var(--s-grad-shadow, 0 6px 16px -8px rgba(168,85,247,.5))` | rgba 리터럴 | `--s-grad-shadow` |
| `.optionCard:hover` | box-shadow | `var(--s-card-shadow-hover, 0 12px 28px -12px rgba(168,85,247,.32))` | rgba 리터럴 | `--s-card-shadow-hover` |

**죽은(렌더 영향 없는) fallback — 참고**
- `--s-active-text`는 **라이트에 정의됨(#7c3aed)** → fallback은 죽어 있음(토큰값 사용). (흔히 오해하는 지점)
- `.segment`·`.mealBadge`의 `var(--s-track, var(--s-card-border-strong,#eceaf3))` → 라이트에선 정의된 `--s-card-border-strong`(#eceaf3)로 해석 → 최내곽 `#eceaf3` 리터럴 미사용(토큰 backed). 다크는 `--s-track`(#1b1430) 사용.

---

## 3. 같은 토큰인데 선언마다 fallback 리터럴이 다름

| 토큰 | fallback A (선택자) | fallback B (선택자) | 라이트 실렌더 영향 |
|---|---|---|---|
| `--s-faint` | `#9ca3af` (`.searchIcon`) | `#b0aabe` (`.searchInput::placeholder`) | **둘 다 live → 서로 다른 회색으로 렌더(실제 불일치)** |
| `--s-card-border-strong` | `#eceaf3` (`.chip`,`.segment`) | `#c9b8e4` (`.searchInput`,`.filterToggle`,`.resetBtn`) | 토큰 정의됨(#eceaf3) → fallback **죽음**(렌더 동일). 소스 표기만 불일치 |
| `--s-active-line` | `#7c3aed` (활성/`:focus`) | `#c4b5fd` (hover: `.chip`/`.option`/`.filterToggle`/`.resetBtn`) | 토큰 정의됨(#7c3aed) → fallback **죽음**. 소스 표기만 불일치 |

→ **실렌더에 영향 있는 불일치는 `--s-faint`(#9ca3af vs #b0aabe) 하나.** 나머지 둘은 화면 영향 없는 소스 불일치.

---

## 4. box-shadow / border 색이 토큰 아닌 rgba/hex 직접

| 선택자 | 속성 | 리터럴 | 비고 |
|---|---|---|---|
| `.segmentBtnActive` | box-shadow 2번째 레이어 | `rgba(0,0,0,0.06)` | 중성 그림자(토큰 없음 — 의도적 중성값) |
| `.optionCard:hover` | box-shadow | `rgba(168,85,247,0.32)` | `--s-card-shadow-hover` fallback(라이트 live) |
| `.gradIcon` | box-shadow | `rgba(168,85,247,0.5)` | `--s-grad-shadow` fallback(라이트 live) |
| `.searchInput:focus` | box-shadow | `var(--s-active-glow, rgba(124,58,237,.2))` | `--s-active-glow` **라이트 정의됨** → 토큰 사용(fallback 죽음) |
| globals 드롭다운(라/다크) | box-shadow | `#eceaf3` / `rgba(20,20,30,.18)` / `#3a2f4e` / `rgba(0,0,0,.75)` | portal — `.page` 토큰 불가(의도적) |

---

## ★ "라이트 정식 정의가 필요한 토큰" (별도 표시)

아래 토큰은 **이름은 이미 존재(다크에 정의)**하나 **라이트 값이 `.page`에 없어** fallback에 의존.
라이트 토큰화 = `.page`(라이트)에 정의 추가(= 새 값 신설이 아니라 **누락된 라이트 정의 보완**):

- `--s-accent-soft-bg` (라이트 fallback `#f6f1ff`) — 칩·옵션 선택 틴트 ★
- `--s-sub` (`#6b7280`)
- `--s-faint` (`#9ca3af` / `#b0aabe` — **두 값 불일치, 통일 필요**)
- `--s-ink` (`#1a1033`)
- `--s-accent` (`#7c3aed`)
- `--s-grad`, `--s-grad-shadow`, `--s-card-shadow-hover` (그라데이션·호버 그림자)

---

## 후속 작업 시 권고 우선순위 (제안 — 실행은 별도 합의)
1. **`--s-faint` fallback 통일** — 실제 렌더 불일치(아이콘 #9ca3af vs placeholder #b0aabe). 가장 명확한 수정 후보.
2. **라이트 `--s-accent-soft-bg` 등 정식 정의** — fallback 의존 제거(디자인 토큰 단일 출처 강화).
3. **fallback 리터럴 표기 통일** (`--s-card-border-strong`, `--s-active-line`) — 렌더 영향 없으나 유지보수성.
4. 드롭다운 portal 리터럴 — 토큰화하려면 portal 루트에 토큰 재선언(다이얼로그 `.dialogPopup` 패턴). 범위 큼.

> 주의: 라이트는 현재 양호하게 렌더되므로(디자인 확인 완료), 위 작업은 **시각 변경이 아니라 토큰 정합/유지보수** 목적. 값을 옮길 때 라이트 렌더가 1:1 동일하게 유지되는지 확인할 것(특히 `--s-faint` 통일 시 어느 값으로 맞출지는 디자인 결정).
