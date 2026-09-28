import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Status is always carried by the label as well as the colour.
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border-rule bg-secondary text-ink-2",
        accent: "border-brand text-brand",
        success: "border-success text-success",
        error: "border-error text-error",
        warning: "border-ink bg-warning text-ink",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
