import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { priorityMeta, type Priority } from "@/lib/incident-data"

export function Panel({
  title,
  subtitle,
  description,
  icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string
  subtitle: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card shadow-card",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? <span className="mt-0.5 shrink-0 text-primary">{icon}</span> : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            {description ? (
              <p className="mt-1 truncate text-[10px] leading-snug text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  )
}

/** Standalone section header for non-Panel blocks (e.g. Executive Summary). */
export function SectionHeader({
  title,
  subtitle,
  description,
  icon,
  action,
  className,
}: {
  title: string
  subtitle: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          {description ? (
            <p className="mt-1 truncate text-[10px] leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/** One-line page purpose banner for first-time visitors. */
export function PagePurpose({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-accent/60 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold text-primary">本页面帮助你了解什么</div>
      <p className="mt-1 text-[12px] leading-relaxed text-foreground">{children}</p>
    </div>
  )
}

/** Key takeaway strip at the bottom of a module. */
export function ModuleConclusion({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-md border border-border bg-panel px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
      <span className="mr-1.5 font-semibold text-foreground">关键结论 ·</span>
      {children}
    </div>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const meta = priorityMeta[priority]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular",
        className,
      )}
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}

export function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ color }}>
      {pulse ? (
        <span className="animate-pulse-ring absolute inline-flex size-2.5 rounded-full opacity-60" />
      ) : null}
      <span className="relative size-2.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}
