import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils"

// States: default, hover (pointer devices only), focus-visible, active, disabled,
// loading (`loading` prop), error and success (`data-state`).
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium text-sm transition-[background-color,color,border-color,transform] duration-micro ease-out active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-brand-hover data-[state=error]:bg-error data-[state=success]:bg-success",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-ink bg-transparent text-foreground hover:bg-secondary data-[state=error]:border-error data-[state=error]:text-error data-[state=success]:border-success data-[state=success]:text-success",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-paper-3",
        ghost: "text-foreground hover:bg-secondary",
        link: "text-primary underline underline-offset-4 decoration-1 hover:decoration-2",
      },
      size: {
        default: "h-control px-5",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-control w-control",
      },
    },
    compoundVariants: [
      { variant: "link", class: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      return (
        <Slot className={classes} ref={ref} disabled={disabled} {...props}>
          {children}
        </Slot>
      )
    }

    // While loading the label stays in the layout (invisible) so the button keeps its width.
    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        <span className={cn("inline-flex items-center justify-center gap-2", loading && "invisible")}>
          {children}
        </span>
        {loading && (
          <Loader2 className="absolute animate-spin" aria-hidden="true" />
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
