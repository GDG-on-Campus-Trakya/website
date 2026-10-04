"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-11 shrink-0 before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-[''] cursor-pointer items-center rounded-full border border-input p-[3px] transition-colors duration-micro focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=unchecked]:bg-paper-3",
      className
    )}
    {...props}
    ref={ref}>
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full transition-transform duration-micro ease-out data-[state=checked]:translate-x-5 data-[state=checked]:bg-brand-ink data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-ink-2"
      )} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
