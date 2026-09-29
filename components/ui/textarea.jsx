import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldClasses } from "@/components/ui/input"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(fieldClasses, "flex min-h-24 resize-y py-2 leading-relaxed", className)}
      ref={ref}
      {...props} />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
