import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// Label above, helper below. An error replaces the helper in the same slot (no layout jump)
// and is wired to the control through aria-invalid and aria-describedby.
// Usage: <Field id="email" label="E-posta" error={err}><Input id="email" .../></Field>
// `action` sits at the end of the label row (e.g. a "forgot password" link).
function Field({ id, label, action, help, error, required, className, children }) {
  const messageId = id ? `${id}-message` : undefined
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? id,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        "aria-describedby": messageId,
        "aria-required": required || children.props["aria-required"],
      })
    : children

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && !action && (
        <Label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Label>
      )}
      {label && action && (
        <div className="flex items-baseline justify-between gap-4">
          <Label htmlFor={id}>
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </Label>
          {action}
        </div>
      )}
      {control}
      <p
        id={messageId}
        role={error ? "alert" : undefined}
        className={cn("min-h-[1lh] text-sm", error ? "text-error" : "text-muted-foreground")}
      >
        {error || help}
      </p>
    </div>
  )
}

export { Field }
