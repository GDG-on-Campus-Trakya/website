import * as React from "react"

import { cn } from "@/lib/utils"

// Border width never changes between states. Focus is an outline, shown instantly.
// Error: pass aria-invalid and render the message with aria-describedby.
export const fieldClasses =
  "w-full rounded border border-input bg-background px-3 text-base text-foreground transition-colors duration-micro placeholder:text-muted-foreground hover:bg-secondary focus-visible:bg-background focus-visible:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-error aria-[invalid=true]:outline-error"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        fieldClasses,
        "flex h-control py-2 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
