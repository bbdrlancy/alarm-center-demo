"use client"

import { useMemo, useState } from "react"
import { Activity, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import {
  getIncidentHealthBoard,
  HEALTH_TIME_RANGES,
  trendSeriesMeta,
  type DistributionSlice,
  type HealthMetric,
  type HealthTimeRange,
  type TrendPoint,
  type TrendSeriesKey,
} from "@/lib/incident-health-board"
import { getCommandPortfolio } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

export function PortfolioSummaryBar() {
  const [range, setRange] = useState<HealthTimeRange>("24H")
  const [trendKey, setTrendKey] = useState<TrendSeriesKey>("open")

  const portfolio = useMemo(() => getCommandPortfolio(), [])
  const board = useMemo(() => getIncidentHealthBoard(range, portfolio), [range, portfolio])

  return (
    <section
      id="portfolio-summary"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">事故健康看板</h2>
            <p className="text-[11px] text-muted-foreground">Incident Health Board · 态势感知</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5">
          {HEALTH_TIME_RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                range === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.en}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-3 xl:grid-cols-5">
        {board.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      <p className="border-b border-border/60 bg-muted/20 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">研判 · Insight</span>
        <span className="mx-1.5 text-border">·</span>
        {board.insight.zh}
        <span className="ml-1.5 hidden sm:inline">({board.insight.en})</span>
      </p>

      <div className="grid gap-px bg-border/60 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
        <TrendPanel points={board.trend} active={trendKey} onSelect={setTrendKey} range={range} />
        <RiskWeightPanel slices={board.riskWeight} />
        <FunnelPanel stages={board.funnel} />
      </div>
    </section>
  )
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const up = metric.delta > 0
  const flat = metric.delta === 0
  const good =
    flat ||
    (metric.polarity === "risk" ? metric.delta < 0 : metric.delta > 0)
  const tone = flat ? "text-muted-foreground" : good ? "text-primary" : "text-[var(--p1)]"

  return (
    <div className="bg-card px-4 py-3">
      <div className="text-[10px] font-semibold text-foreground">{metric.zh}</div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{metric.en}</div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="font-mono text-[22px] font-extrabold tabular leading-none text-foreground">
          {metric.value}
          {metric.suffix ?? ""}
        </div>
        <div className={cn("inline-flex items-center gap-0.5 text-[11px] font-bold tabular", tone)}>
          {flat ? <Minus className="size-3" /> : up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {flat ? "0" : `${up ? "+" : ""}${metric.delta}${metric.deltaSuffix ?? ""}`}
        </div>
      </div>
      <div className="mt-1 text-[9px] text-muted-foreground">vs 上一窗口</div>
    </div>
  )
}

function TrendPanel({
  points,
  active,
  onSelect,
  range,
}: {
  points: TrendPoint[]
  active: TrendSeriesKey
  onSelect: (key: TrendSeriesKey) => void
  range: HealthTimeRange
}) {
  const keys: TrendSeriesKey[] = ["open", "p1", "recovered"]
  const meta = trendSeriesMeta(active)
  const values = points.map((point) => point[active])
  const path = buildLinePath(values, 280, 96, 8)

  return (
    <div className="bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-foreground">事故趋势</div>
          <div className="text-[10px] text-muted-foreground">
            Incident Trend · {range === "7D" ? "7 days" : range === "24H" ? "24 hours" : range}
          </div>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-muted/25 p-0.5">
          {keys.map((key) => {
            const item = trendSeriesMeta(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold",
                  active === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {item.en}
              </button>
            )
          })}
        </div>
      </div>
      <svg viewBox="0 0 280 112" className="h-[112px] w-full" role="img" aria-label={meta.en}>
        {[0, 1, 2, 3].map((row) => (
          <line
            key={row}
            x1="8"
            x2="272"
            y1={12 + row * 28}
            y2={12 + row * 28}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
          />
        ))}
        <path d={path} fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => {
          const { x, y } = pointAt(values, index, 280, 96, 8)
          return <circle key={point.label} cx={x} cy={y} r="3" fill={meta.color} />
        })}
        {points.map((point, index) => {
          const { x } = pointAt(values, index, 280, 96, 8)
          return (
            <text
              key={`${point.label}-label`}
              x={x}
              y={108}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 8 }}
            >
              {point.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function RiskWeightPanel({ slices }: { slices: DistributionSlice[] }) {
  const top = slices.reduce((best, slice) => (slice.value > best.value ? slice : best), slices[0]!)
  const arcs = buildDonutArcs(slices, 52, 34)

  return (
    <div className="bg-card p-4">
      <div className="mb-3">
        <div className="text-[12px] font-semibold text-foreground">风险权重</div>
        <div className="text-[10px] text-muted-foreground">Risk Weight · 域风险构成</div>
      </div>
      <div className="flex items-start gap-3">
        <svg viewBox="0 0 120 120" className="size-[112px] shrink-0" role="img" aria-label="Risk Weight">
          {arcs.map((arc) => (
            <path key={arc.id} d={arc.d} fill={arc.color} />
          ))}
          <circle cx="60" cy="60" r="28" className="fill-card" />
          <text x="60" y="54" textAnchor="middle" className="fill-foreground" style={{ fontSize: 13, fontWeight: 800 }}>
            {top.value}%
          </text>
          <text x="60" y="68" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>
            {top.label}
          </text>
        </svg>
        <ul className="min-w-0 flex-1 space-y-2 pt-0.5">
          {slices.map((slice) => (
            <li key={slice.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="truncate font-semibold text-foreground">{slice.label}</span>
                </span>
                <span className="font-mono text-[12px] font-extrabold tabular text-foreground">{slice.value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${slice.value}%`, backgroundColor: slice.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FunnelPanel({
  stages,
}: {
  stages: { id: string; zh: string; en: string; count: number }[]
}) {
  const max = Math.max(...stages.map((stage) => stage.count), 1)
  return (
    <div className="bg-card p-4">
      <div className="mb-3">
        <div className="text-[12px] font-semibold text-foreground">恢复漏斗</div>
        <div className="text-[10px] text-muted-foreground">Recovery Funnel</div>
      </div>
      <ol className="space-y-2">
        {stages.map((stage, index) => {
          const width = Math.max(28, Math.round((stage.count / max) * 100))
          return (
            <li key={stage.id} className="flex items-center gap-2">
              <div className="w-16 shrink-0">
                <div className="text-[11px] font-semibold text-foreground">{stage.en}</div>
                <div className="text-[9px] text-muted-foreground">{stage.zh}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "flex h-7 items-center justify-end rounded-md px-2 font-mono text-[12px] font-bold tabular text-foreground",
                    index === 0 && "bg-[var(--p1)]/12",
                    index === stages.length - 1 && "bg-primary/15",
                    index > 0 && index < stages.length - 1 && "bg-muted",
                  )}
                  style={{ width: `${width}%` }}
                >
                  {stage.count}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function buildLinePath(values: number[], width: number, height: number, pad: number) {
  if (!values.length) return ""
  return values
    .map((_, index) => {
      const { x, y } = pointAt(values, index, width, height, pad)
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
}

function pointAt(values: number[], index: number, width: number, height: number, pad: number) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const x = pad + (values.length <= 1 ? innerW / 2 : (index / (values.length - 1)) * innerW)
  const y = pad + innerH - ((values[index]! - min) / span) * innerH
  return { x, y }
}

function buildDonutArcs(slices: DistributionSlice[], outer: number, inner: number) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  if (total <= 0) {
    return [
      {
        id: "empty",
        color: "#e2e8f0",
        d: describeDonutSlice(60, 60, outer, inner, 0, Math.PI * 2 - 0.001),
      },
    ]
  }
  let angle = -Math.PI / 2
  return slices
    .filter((slice) => slice.value > 0)
    .map((slice) => {
      const sweep = (slice.value / total) * Math.PI * 2
      const start = angle
      const end = angle + sweep
      angle = end
      return {
        id: slice.id,
        color: slice.color,
        d: describeDonutSlice(60, 60, outer, inner, start, end),
      }
    })
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
) {
  const large = end - start > Math.PI ? 1 : 0
  const ox1 = cx + outer * Math.cos(start)
  const oy1 = cy + outer * Math.sin(start)
  const ox2 = cx + outer * Math.cos(end)
  const oy2 = cy + outer * Math.sin(end)
  const ix1 = cx + inner * Math.cos(end)
  const iy1 = cy + inner * Math.sin(end)
  const ix2 = cx + inner * Math.cos(start)
  const iy2 = cy + inner * Math.sin(start)
  return [
    `M ${ox1} ${oy1}`,
    `A ${outer} ${outer} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ")
}
