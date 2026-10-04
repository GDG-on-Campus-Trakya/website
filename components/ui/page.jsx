import * as React from "react"

import { cn } from "@/lib/utils"

// Page frame shared by every inner page: one column, tokenised gutter, hairline under the title.
function PageContainer({ className, as: Comp = "div", ...props }) {
  return (
    <Comp
      className={cn("mx-auto w-full max-w-page px-gutter py-6 md:py-8", className)}
      {...props}
    />
  )
}

function PageHeader({ title, description, actions, className, children }) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-rule pb-5 md:mb-8 md:flex-row md:items-end md:justify-between md:pb-6",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-extrabold leading-tight md:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-measure text-ink-2 md:text-md">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

// A titled band inside a page: heavy rule on top, title, optional right-side action.
function Section({ title, action, className, children, ...props }) {
  return (
    <section className={cn("mt-10 first:mt-0 md:mt-14", className)} {...props}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3">
          {title && <h2 className="font-display text-xl font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function EmptyState({ title, description, action, className }) {
  return (
    <div className={cn("border-y border-rule py-10", className)}>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-measure text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded bg-paper-3 motion-safe:animate-pulse", className)}
      {...props}
    />
  )
}

export { PageContainer, PageHeader, Section, EmptyState, Skeleton }
