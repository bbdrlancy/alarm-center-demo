"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Clock, Crosshair, ShieldAlert } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useCountUp } from "@/hooks/use-count-up"
import { getIncidentOverview, type EvidenceChainStep, type EvidenceHighlight } from "@/lib/incident-overview"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

export function IncidentDecisionBanner() {
  const { scenario } = useDemoScenario()
  const overview = useMemo(() => getIncidentOverview(scenario), [scenario])
  const tone = priorityMeta[overview.severity]
  const [chainOpen, setChainOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setChainOpen(false)
    setActiveId(null)
  }, [scenario.id])

  const openChain = (chainId?: string) => {
    setChainOpen(true)
    if (chainId) setActiveId(chainId)
  }

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
        <div className="grid gap-px bg-border sm:grid-cols-3">
          <DecisionFact index="01" q="What happened?" qZh="发生了什么？" a={overview.whatHappened} />
          <DecisionFact index="02" q="Where is the root cause?" qZh="根因在哪里？" a={overview.whereRootCause} />
          <DecisionFact index="03" q="Why do we believe it?" qZh="为什么这样判断？" a={overview.whyBelieve} />
        </div>

        <div className="border-t border-border px-5 py-3.5">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-l2">Evidence Highlights</div>
              <div className="text-[10px] text-l4">根因证据摘要 · 横向核对关键证据</div>
            </div>
            <button
              type="button"
              onClick={() => setChainOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              View Evidence Chain
              <ChevronDown className={cn("size-3.5 transition-transform", chainOpen && "rotate-180")} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {overview.evidenceHighlights.map((chip) => (
              <EvidenceChip
                key={chip.id}
                chip={chip}
                active={activeId === chip.chainId && chainOpen}
                color={tone.color}
                onClick={() => openChain(chip.chainId)}
              />
            ))}
          </div>
        </div>
      </section>

      {chainOpen ? (
        <EvidenceChainPanel
          steps={overview.evidenceChain}
          activeId={activeId}
          onSelect={setActiveId}
        />
      ) : null}
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

function EvidenceChip({
  chip,
  active,
  color,
  onClick,
}: {
  chip: EvidenceHighlight
  active: boolean
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[168px] shrink-0 rounded-lg border px-3 py-2 text-left transition-colors",
        active ? "bg-primary/8 shadow-sm" : "border-border bg-muted/20 hover:bg-muted/40",
      )}
      style={active ? { borderColor: color } : undefined}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide text-l4">{chip.label}</div>
      <div className="mt-0.5 text-[13px] font-extrabold text-l1">{chip.value}</div>
      <div className="truncate text-[10px] text-l3">{chip.detail}</div>
    </button>
  )
}

function EvidenceChainPanel({
  steps,
  activeId,
  onSelect,
}: {
  steps: EvidenceChainStep[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <section className="mt-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="size-4 text-primary" />
        <div>
          <div className="text-[12px] font-bold text-l1">Evidence Chain</div>
          <div className="text-[10px] text-l4">完整证据链 · 从最早事件到业务影响</div>
        </div>
      </div>

      <ol className="relative flex flex-col gap-2">
        <span className="absolute bottom-3 left-[15px] top-3 w-px bg-border" aria-hidden />
        {steps.map((step, index) => {
          const active = step.id === activeId
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "relative flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  active ? "border-primary/50 bg-primary/8" : "border-transparent hover:bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    step.kind === "root"
                      ? "bg-[var(--p1)] text-white"
                      : step.kind === "history"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-l2",
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-bold text-l1">{step.title}</span>
                    <span className="text-[11px] text-l3">{step.zh}</span>
                    {step.time !== "—" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-l4">
                        <Clock className="size-3" />
                        {step.time}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-l3">{step.detail}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
