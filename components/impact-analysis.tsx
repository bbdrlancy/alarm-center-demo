"use client"

import { Server, Cpu, Boxes, Layers, TrendingDown } from "lucide-react"
import { demoMetrics, impactKpis, powerTrend } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { KpiCard } from "@/components/kpi-card"

const icons: Record<string, typeof Server> = {
  rack: Boxes,
  server: Server,
  gpu: Cpu,
  service: Layers,
}

function PowerChart() {
  const w = 100
  const h = 40
  const incidentIdx = powerTrend.findIndex((d) => d.incident)
  const incidentX =
    incidentIdx >= 0 ? (incidentIdx / (powerTrend.length - 1)) * w : w / 2

  const line = (key: "load" | "voltage", maxVal: number, color: string) => {
    const pts = powerTrend
      .map((d, i) => {
        const x = (i / (powerTrend.length - 1)) * w
        const y = h - (d[key] / maxVal) * (h - 4) - 2
        return `${x},${y}`
      })
      .join(" ")
    return (
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <TrendingDown className="size-3.5 text-[var(--p1)]" />
          Power Zone A 供电趋势
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-primary" />负载 %
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="h-0.5 w-3 rounded-full bg-[var(--info)]" />电压 V
          </span>
          <span className="flex items-center gap-1 text-[var(--p1)]">
            <span className="h-3 w-px bg-[var(--p1)]" />
            {demoMetrics.incidentTime} · {demoMetrics.incidentMarkerLabel}
          </span>
        </div>
      </div>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-28 w-full">
        {line("load", 100, "var(--primary)")}
        {line("voltage", 400, "var(--info)")}
        {incidentIdx >= 0 ? (
          <g>
            <line
              x1={incidentX}
              y1={4}
              x2={incidentX}
              y2={h}
              stroke="var(--p1)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={incidentX} cy={4} r="1.8" fill="var(--p1)" />
            <text
              x={incidentX}
              y={2}
              textAnchor="middle"
              className="fill-[var(--p1)] text-[3px] font-semibold"
              style={{ fontSize: "3px" }}
            >
              {demoMetrics.incidentMarkerLabel}
            </text>
          </g>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular">
        {powerTrend.map((d) => (
          <span key={d.t} className="flex flex-col items-center gap-0.5">
            <span className={d.incident ? "font-semibold text-[var(--p1)]" : undefined}>{d.t}</span>
            {d.incident ? (
              <span className="text-[8px] font-medium leading-none text-[var(--p1)]">
                {demoMetrics.incidentMarkerLabel}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ImpactAnalysis() {
  return (
    <Panel
      title="影响范围分析"
      subtitle="Impact Analysis"
      description="量化评估故障对基础设施与关键业务的影响范围"
      icon={<Layers className="size-4" />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {impactKpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} icon={icons[kpi.key]} />
        ))}
      </div>
      <div className="mt-3">
        <PowerChart />
      </div>
      <ModuleConclusion>
        共影响 {demoMetrics.affectedRack} 个机架、{demoMetrics.affectedServer} 台服务器、
        {demoMetrics.affectedGpu} 卡 GPU 及 {demoMetrics.affectedService} 项业务，需优先保障 AI Training Service 恢复。
      </ModuleConclusion>
    </Panel>
  )
}
