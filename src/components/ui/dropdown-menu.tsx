"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  align = "end",
  side = "bottom",
  children,
  ...props
}: MenuPrimitive.Popup.Props & {
  sideOffset?: number
  align?: "start" | "center" | "end"
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        side={side}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "min-w-[10rem] origin-[var(--transform-origin)] overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/15 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/**
 * 항목 공통 표면 — 액션 항목(Item)과 이동 항목(LinkItem)이 픽셀 단위로 같은 모양을
 * 갖도록 클래스를 한 곳에 둔다. 두 항목이 섞인 메뉴에서 모양이 갈리면 "누르면
 * 무슨 일이 나는지"와 무관한 차이가 시각 노이즈로 읽힌다.
 *
 * highlight 배경은 globals.css 의 [data-slot][data-highlighted] 규칙이 담당
 * (라이트/다크 대칭). 여기서는 텍스트 색만 — destructive=빨강 글자.
 */
const menuItemClass =
  "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        menuItemClass,
        variant === "destructive" && "text-destructive",
        className
      )}
      {...props}
    />
  )
}

/**
 * 다른 화면으로 이동하는 메뉴 항목 — `<a>` 로 렌더된다.
 *
 * 이동을 onClick + router.push 로 처리하지 않는 이유: 메뉴 항목이 실제 링크여야
 * 스크린리더가 "링크"로 읽고, 새 탭 열기·주소 복사 같은 브라우저 기본 동작이 산다.
 * Next 라우터를 타려면 호출부에서 `render={<Link href="..." />}` 를 넘긴다.
 *
 * data-slot 은 Item 과 같은 값을 유지한다 — globals.css 의 highlight 규칙이
 * 슬롯 이름으로 걸려 있어, 이름을 바꾸면 이동 항목만 hover 강조를 잃는다.
 *
 * variant 도 Item 과 같은 값을 받는다: 파괴적 결과로 이어지는 화면으로 보내는 항목
 * (계정 삭제 진입 등)이 액션 항목과 같은 빨강 글자·hover 를 갖도록 한다. 두 항목
 * 종류에서 같은 이름의 variant 가 같은 모습을 뜻해야, 메뉴가 "이동인지 실행인지"와
 * 무관하게 위험도를 일관되게 표시한다.
 */
function DropdownMenuLinkItem({
  className,
  variant = "default",
  ...props
}: MenuPrimitive.LinkItem.Props & {
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-item"
      data-variant={variant}
      closeOnClick
      className={cn(
        menuItemClass,
        variant === "destructive" && "text-destructive",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
}
