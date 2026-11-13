"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import styles from "@/components/screens.module.css"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn('toaster group', styles.toaster)}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          // 일반(normal) 토스트 표면은 다이얼로그와 같은 카드 토큰을 쓴다. globals.css 의 shadcn 색 토큰
          // (--popover 등)은 HSL 채널 값이고 다크 값이 .dark 클래스 아래에만 있어, 이 앱(.dark 미사용)에서는
          // 무효이거나 라이트 값으로 떨어진다. 다크 값은 .toaster(screens.module.css)에서 재선언한다.
          "--normal-bg": "var(--s-card-bg, #ffffff)",
          "--normal-text": "var(--s-ink, #1a1033)",
          "--normal-border": "var(--s-card-border-strong, #eceaf3)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
