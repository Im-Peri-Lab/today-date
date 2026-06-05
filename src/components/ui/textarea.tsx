import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        ref={ref}
        className={cn(
          "flex min-h-16 w-full rounded-lg border border-[var(--s-card-border-strong,#eceaf3)] bg-transparent px-3 py-2 text-base text-[color:var(--s-ink,#1a1033)] transition-colors outline-none placeholder:text-[color:var(--s-faint,#9ca3af)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
