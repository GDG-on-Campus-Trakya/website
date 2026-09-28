import * as React from "react"

import { cn } from "@/lib/utils"

// One figure with its label. Put several inside a <dl> grid. Value first on screen, label first in the DOM.
function Stat({ label, value, hint, className }) {
  return (
    <div className={cn("flex flex-col-reverse", className)}>
      <dt className="mt-1 text-sm text-muted-foreground">
        {label}
        {hint && <span className="block text-xs">{hint}</span>}
      </dt>
      <dd className="font-display text-3xl font-extrabold leading-none tabular-nums tracking-tight">
        {value}
      </dd>
    </div>
  )
}

export { Stat }
