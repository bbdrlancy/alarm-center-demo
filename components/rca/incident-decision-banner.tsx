"use client"

import { useMemo } from "react"
import { Crosshair } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useCountUp } from "@/hooks/use-count-up"
import { getIncidentOverview } from "@/lib/incident-overview"
import { priorityMeta } from "@/lib/incident-data"

export function IncidentDecisionBanner() {
  const { scenario } = useDemoScenario()
  const overview = useMemo(() => getIncidentOverview(scenario), [scenario])
  const tone = priorityMeta[overview.severity]

  return (
    <div id="incident-decision-banner">
      <div className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur-md">
        <section
          className="overflow-hidden rounded-xl border-2 bg-card shadow-card"
          style={{ borderColor: tone.color }}
        >
          <div className="h-1.5" style={{ backgroundColor: tone.color }} />

          <div className="grid gap-3 px-5 py-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-md px-2.5 py-1 text-[13px] font-extrabold tabular tracking-wide"
                  style={{ color: tone.color, backgroundColor: tone.bg }}
                >
                  {overview.severity}
                </span>
                <span className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-l2">
                  {overview.status}
                </span>
                <span className="font-mono text-[11px] text-l4">
                  {overview.incidentId} · {overview.domain}
                </span>
              </div>

              <div className="mt-2 flex items-start gap-3">
                <span
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-lg"
                  style={{ color: tone.color, backgroundColor: tone.bg }}
                >
                  <Crosshair className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-l3">
                    Root Cause
                  </div>
                  <h2 className="mt-0.5 text-[26px] font-extrabold leading-[1.15] text-l1 md:text-[32px]">
                    {overview.rootCause}
                  </h2>
                  <p className="mt-0.5 text-[12px] font-medium text-l3">{overview.rootCauseZh}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
                <Meta label="First Detected" value={overview.firstDetectedLabel} />
                <Meta label="Duration" value={overview.duration} />
              </div>
            </div>

            <div className="text-left lg:min-w-[140px] lg:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-l3">Confidence</div>
              <ConfidenceValue confidence={overview.confidence} color={tone.color} />
            </div>
          </div>
        </section>
      </div>

      <section className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-3">
          <div className="text-[12px] font-bold text-foreground">发生了什么</div>
          <div className="text-[10px] text-muted-foreground">What Happened</div>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-3">
          <DecisionFact index="01" q="What happened?" qZh="发生了什么？" a={overview.whatHappened} />
          <DecisionFact index="02" q="Where is the root cause?" qZh="根因在哪里？" a={overview.whereRootCause} />
          <DecisionFact index="03" q="Why do we believe it?" qZh="为什么这样判断？" a={overview.whyBelieve} />
        </div>
      </section>
    </div>
  )
}

function ConfidenceValue({ confidence, color }: { confidence: number; color: string }) {
  const { ref, display } = useCountUp(confidence, { duration: 1200, immediate: true })
  return (
    <div className="mt-1 text-[44px] font-extrabold leading-none tabular" style={{ color }}>
      <span ref={ref}>{display}</span>
      <span className="text-[22px]">%</span>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-l4">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-l1">{value}</span>
    </div>
  )
}

function DecisionFact({
  index,
  q,
  qZh,
  a,
}: {
  index: string
  q: string
  qZh: string
  a: string
}) {
  return (
    <div className="bg-card px-5 py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] font-bold text-primary">{index}</span>
        <span className="text-[11px] font-bold text-l2">{qZh}</span>
      </div>
      <div className="text-[10px] text-l4">{q}</div>
      <p className="mt-1 text-[13px] font-semibold leading-snug text-l1">{a}</p>
    </div>
  )
}
