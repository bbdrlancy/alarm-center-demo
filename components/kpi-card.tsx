"use client"

import type { LucideIcon } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

export type KpiCardData = {
  key: string
  label: string
  value: number
  total?: number
  unit?: string
  trend?: readonly number[]
  decimals?: number
  prefix?: string
  suffix?: string
  badge?: string
  delay?: number
  success?: boolean
  immediate?: boolean
}

function Sparkline({ data }: { data: readonly number[] }) {
  const max = Math.max(...data)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 28 - (v / max) * 24 - 2
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function KpiCard({ kpi, icon: Icon }: { kpi: KpiCardData; icon: LucideIcon }) {
  const { ref, display } = useCountUp(kpi.value, {
    duration: 1300,
    decimals: kpi.decimals ?? (kpi.total ? 0 : kpi.suffix === "%" ? (kpi.value % 1 !== 0 ? 2 : 0) : 0),
    delay: kpi.delay ?? 0,
    immediate: kpi.immediate,
  })
  const pct = kpi.total ? Math.round((kpi.value / kpi.total) * 100) : null
  const badge = pct !== null ? `${pct}%` : kpi.badge

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          <Icon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{kpi.label}</span>
        </div>
        {badge ? (
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular",
              kpi.success
                ? "bg-primary/12 text-primary"
                : "bg-[var(--p1)]/10 text-[var(--p1)]",
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        {kpi.prefix ? (
          <span className="text-2xl font-bold tabular text-kpi">{kpi.prefix}</span>
        ) : null}
        <span ref={ref} className={cn("text-2xl font-bold tabular text-kpi", kpi.success && "text-success")}>
          {display}
        </span>
        {kpi.suffix ? (
          <span className={cn("text-lg font-bold tabular", kpi.success ? "text-success" : "text-kpi")}>
            {kpi.suffix}
          </span>
        ) : null}
        {kpi.total !== undefined ? (
          <span className="text-xs text-muted-foreground">
            /{kpi.total.toLocaleString()} {kpi.unit}
          </span>
        ) : kpi.unit ? (
          <span className="text-xs text-muted-foreground">{kpi.unit}</span>
        ) : null}
      </div>
      {kpi.trend ? <Sparkline data={kpi.trend} /> : null}
    </div>
  )
}
