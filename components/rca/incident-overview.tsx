"use client"

import { useEffect, useMemo, useState } from "react"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useDemoStory } from "@/hooks/use-demo-story"
import { getIncidentOverview } from "@/lib/incident-overview"
import { downstreamChainIds, getImpactTwinHops } from "@/lib/impact-twin"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

const ACTION_STATUS_STYLE = {
  Suggested: "bg-muted text-l3 border-border",
  "In Progress": "bg-[var(--p2)]/15 text-[var(--p2)] border-[var(--p2)]/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
} as const

export function IncidentOverview() {
  const { scenario } = useDemoScenario()
  const overview = useMemo(() => getIncidentOverview(scenario), [scenario])
  const hops = useMemo(() => getImpactTwinHops(scenario), [scenario])
  const tone = priorityMeta[overview.severity]
  const { stage, playing, runId } = useDemoStory()
  const [activeHop, setActiveHop] = useState(0)
  const [activeBeat, setActiveBeat] = useState(0)
  const selectedId = hops[activeHop]?.chainId ?? null
  const activeHops = useMemo(() => downstreamChainIds(hops, selectedId), [hops, selectedId])
  const action = overview.recommendedAction

  useEffect(() => {
    setActiveHop(0)
    setActiveBeat(0)
  }, [scenario.id])

  useEffect(() => {
    if (stage !== 4 || !playing) return
    let i = 0
    setActiveHop(0)
    const timer = window.setInterval(() => {
      i += 1
      setActiveHop(Math.min(i, hops.length - 1))
      if (i >= hops.length - 1) window.clearInterval(timer)
    }, 900)
    return () => window.clearInterval(timer)
  }, [stage, playing, runId, hops.length])

  return (
    <section id="incident-overview" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <article
          className="overflow-hidden rounded-xl border bg-card shadow-card"
          style={{ borderColor: `${tone.color}55` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div>
              <Title zh="事故概览" en="Incident Overview" />
              <div className="mt-0.5 font-mono text-[12px] text-l4">
                {overview.incidentId} · {overview.domain} · {overview.status}
              </div>
            </div>
            <span className="text-[18px] font-extrabold" style={{ color: tone.color }}>
              {tone.label}
            </span>
          </div>

          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_auto]">
            <div>
              <Field zh="根因" en="Root Cause" />
              <h2 className="mt-1 text-[28px] font-extrabold leading-tight text-l1">{overview.rootCause}</h2>
              <p className="mt-1 text-[13px] text-l4">{overview.rootCauseZh}</p>
            </div>
            <div className="text-right">
              <Field zh="置信度" en="Confidence" className="text-right" />
              <div className="mt-1 text-[40px] font-extrabold leading-none tabular text-l1">{overview.confidence}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
            <Kpi zh="业务影响" en="Business Impact" value={overview.businessImpact} level="l2" />
            <Kpi zh="受影响资产" en="Affected Assets" value={overview.affectedAssets} level="l2" />
            <Kpi zh="级联告警" en="Cascaded Alarms" value={String(overview.cascadedCount)} level="l2" />
            <Kpi zh="持续时间" en="Duration" value={overview.duration} level="l2" />
          </div>
        </article>

        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div>
              <Title zh="建议行动" en="Recommended Action" />
              <div className="mt-0.5 text-[12px] text-l4">{action.ownerTeam}</div>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                ACTION_STATUS_STYLE[action.status],
              )}
            >
              {action.status}
            </span>
          </div>
          <div className="space-y-4 px-5 py-5">
            <h3 className="text-[20px] font-extrabold leading-snug text-l1">{action.actionZh}</h3>
            <p className="text-[13px] text-l4">{action.action}</p>
            <div className="grid grid-cols-2 gap-2">
              <Kpi zh="预计完成" en="ETA" value={action.eta} level="l2" boxed />
              <Kpi zh="风险下降" en="Risk ↓" value={`${action.riskReduction}%`} level="l2" boxed />
            </div>
            <ol className="space-y-1.5">
              {action.steps.map((step, index) => (
                <li key={step.zh} className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] font-bold text-l4">{index + 1}</span>
                  <span className="text-[13px] font-semibold text-l2">{step.zh}</span>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>

      <section className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <Title zh="事故故事" en="Incident Story" />
        <div className="relative mt-5">
          <div className="absolute left-[5px] top-6 bottom-6 w-px bg-[var(--text-l4)] lg:left-8 lg:right-8 lg:top-[28px] lg:bottom-auto lg:h-px lg:w-auto" />
          <ol className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-0">
            {overview.story.map((beat, index) => {
              const isFirst = index === 0
              const isLast = index === overview.story.length - 1
              const color = isFirst || isLast ? priorityMeta[beat.priority].color : "var(--text-l2)"
              return (
                <li key={`${beat.time}-${beat.title}`} className="flex flex-1 items-start gap-3 lg:flex-col lg:items-center lg:gap-0">
                  <button
                    type="button"
                    onClick={() => setActiveBeat(index)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left lg:flex-col lg:items-center lg:text-center"
                  >
                    <div className="flex w-3 shrink-0 flex-col items-center lg:w-full">
                      <div className="hidden font-mono text-[11px] text-l4 lg:block">{beat.time}</div>
                      <span
                        className={cn(
                          "relative z-10 mt-0 size-3 rounded-full lg:mt-2",
                          activeBeat === index && "ring-4 ring-[rgba(61,205,88,0.2)]",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <div className="min-w-0 lg:mt-2 lg:px-2">
                      <div className="font-mono text-[11px] text-l4 lg:hidden">{beat.time}</div>
                      <div
                        className={cn(
                          "text-[13px] font-bold leading-snug",
                          isFirst || isLast ? "text-l1" : "text-l2",
                        )}
                      >
                        {beat.title}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section id="topology-graph" className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="px-5 py-4">
          <Title zh="影响路径" en="Impact Path" />
          <p className="mt-1 text-[12px] text-l4">数字孪生叠加 · Digital Twin Overlay</p>
        </div>
        <TwinSchematic
          mode="impact"
          hops={hops}
          selectedHop={selectedId}
          activeHops={activeHops}
          onSelectHop={(chainId) => {
            const index = hops.findIndex((hop) => hop.chainId === chainId)
            if (index >= 0) setActiveHop(index)
          }}
        />
      </section>
    </section>
  )
}

function Title({ zh, en }: { zh: string; en: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-l3">{zh}</div>
      <div className="text-[10px] text-l4">{en}</div>
    </div>
  )
}

function Field({ zh, en, className }: { zh: string; en: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-bold text-l3">{zh}</div>
      <div className="text-[9px] text-l4">{en}</div>
    </div>
  )
}

function Kpi({
  zh,
  en,
  value,
  level,
  boxed,
}: {
  zh: string
  en: string
  value: string
  level: "l1" | "l2"
  boxed?: boolean
}) {
  return (
    <div className={cn("px-4 py-3", boxed && "rounded-lg border border-border bg-muted/20 px-3 py-2.5")}>
      <div className="text-[10px] font-bold text-l3">{zh}</div>
      <div className="text-[9px] text-l4">{en}</div>
      <div className={cn("mt-1 text-[16px] font-extrabold leading-snug", level === "l1" ? "text-l1" : "text-l2")}>
        {value}
      </div>
    </div>
  )
}
