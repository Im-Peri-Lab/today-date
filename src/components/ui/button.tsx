import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// 키보드 포커스 글로우 링 — §5 소형 컨트롤 tier: 2px ring.
// 실제 ring 색은 globals.css의 [data-slot='button']:focus-visible 규칙(--s-focus-ring 토큰)이
// 여기 있는 shadcn 기본 --ring(.dark 클래스 전용이라 이 프로젝트에서 항상 정적)을 덮어써
// 화면 전체와 동일한 다크 대응 색을 쓴다. 이 Tailwind 클래스는 JS 미적용 등 폴백용으로 유지.
const focusRing =
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `bg-[var(--s-active-fill,#7c3aed)] text-[color:var(--s-active-on,#ffffff)] hover:brightness-105 ${focusRing}`,
        outline:
          "border-[var(--s-card-border-strong,#eceaf3)] bg-transparent text-[color:var(--s-ink,#1a1033)] hover:border-[var(--s-active-line,#7c3aed)] hover:text-[color:var(--s-active-text,#7c3aed)] focus-visible:border-[var(--s-active-line,#7c3aed)] focus-visible:text-[color:var(--s-active-text,#7c3aed)] focus-visible:ring-2 focus-visible:ring-ring/50 aria-expanded:border-[var(--s-active-line,#7c3aed)] aria-expanded:text-[color:var(--s-active-text,#7c3aed)]",
        secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground ${focusRing}`,
        ghost: `hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground ${focusRing}`,
        // 배경 틴트는 공용 토큰(--s-destructive-soft-bg / -strong)으로 — 라이트 0.10/0.20,
        // 다크 0.18/0.30 을 :root @media 로 인코딩. (기존 dark:bg-* 는 .dark 미적용이라 죽어서
        // 다크에서 라이트값으로 묽게 떴음 → 토큰으로 교체해 다크에서 의도대로 진하게.)
        destructive:
          "bg-[var(--s-destructive-soft-bg)] text-destructive hover:bg-[var(--s-destructive-soft-bg-strong)] focus-visible:border-destructive/40 focus-visible:ring-2 focus-visible:ring-destructive/20",
        link: `text-primary underline-offset-4 hover:underline ${focusRing}`,
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
