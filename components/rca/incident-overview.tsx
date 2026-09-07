"use client"

import { useEffect, useMemo, useState } from "react"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useDemoStory } from "@/hooks/use-demo-story"
import { getIncidentOverview } from "@/lib/incident-overview"
import { downstreamChainIds, getImpactTwinHops, impactChainSentence } from "@/lib/impact-twin"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

const ACTION_STATUS_STYLE = {
  Suggested: "bg-muted text-muted-foreground border-border",
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <article
          className="overflow-hidden rounded-xl border bg-card shadow-card"
          style={{ borderColor: `${tone.color}55` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Root Cause Summary
              </div>
              <div className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                {overview.incidentId} · {overview.domain} Domain · {overview.status}
              </div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ color: tone.color, backgroundColor: tone.bg }}
            >
              {tone.label}
            </span>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Root Cause</div>
              <h2 className="mt-1 text-[24px] font-extrabold leading-tight text-foreground">{overview.rootCause}</h2>
              <p className="mt-1 text-[15px] font-semibold text-muted-foreground">{overview.rootCauseZh}</p>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground">{overview.summaryZh}</p>
            <p className="text-[12px] text-muted-foreground">{overview.conclusionZh}</p>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Business Impact</div>
              <p className="mt-1 text-[16px] font-bold leading-snug" style={{ color: tone.color }}>
                {overview.businessImpactZh}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{overview.businessImpact}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Confidence" value={`${overview.confidence}%`} accent={tone.color} />
              <Kpi label="Duration" value={overview.duration} />
              <Kpi label="Affected Assets" value={overview.affectedAssets} />
              <Kpi label="Affected Alarms" value={overview.affectedAlarms} />
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recommended Action
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">建议行动 · {action.ownerTeam}</div>
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
            <div>
              <h3 className="text-[20px] font-extrabold leading-snug text-foreground">{action.actionZh}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{action.action}</p>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground">{action.rationaleZh}</p>
            <div className="grid grid-cols-3 gap-2">
              <Kpi label="Owner" value={action.ownerTeam} />
              <Kpi label="ETA" value={action.eta} />
              <Kpi label="Risk ↓" value={`${action.riskReduction}%`} accent={tone.color} />
            </div>
            <ol className="space-y-2">
              {action.steps.map((step, index) => (
                <li
                  key={step.zh}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <span className="mt-0.5 font-mono text-[11px] font-bold text-muted-foreground">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-snug text-foreground">{step.zh}</div>
                    <div className="text-[11px] text-muted-foreground">{step.team}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>

      <section id="topology-graph" className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Root Cause Propagation Path
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {scenario.domain} · {impactChainSentence(scenario.impactChain)} · 数字孪生叠加
          </p>
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
          subtitle={`${scenario.domain} · ${impactChainSentence(scenario.impactChain)}`}
        />
      </section>

      <section className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Incident Story</div>
        <ol className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {overview.story.map((beat, index) => {
            const color = priorityMeta[beat.priority].color
            return (
              <li key={`${beat.time}-${beat.title}`} className="flex flex-1 items-stretch">
                <button
                  type="button"
                  onClick={() => setActiveBeat(index)}
                  className={cn(
                    "min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-left",
                    activeBeat === index && "border-primary shadow-[0_0_0_2px_rgba(61,205,88,0.16)]",
                  )}
                >
                  <div className="font-mono text-[11px] font-semibold" style={{ color }}>
                    {beat.time}
                  </div>
                  <div className="mt-1 text-[13px] font-bold leading-snug text-foreground">{beat.title}</div>
                </button>
                {index < overview.story.length - 1 ? (
                  <div className="flex w-7 shrink-0 items-center justify-center text-[14px] text-muted-foreground lg:w-8">
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline">→</span>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Why This Root Cause
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {overview.evidence.map((card) => (
            <article key={card.title} className="rounded-lg border border-border bg-muted/20 px-3 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{card.title}</div>
              <div className="mt-1.5 text-[14px] font-bold leading-snug text-foreground">{card.value}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{card.detail}</div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-[16px] font-extrabold leading-snug text-foreground" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}
