"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Circle,
  ClipboardList,
  Gauge,
  Network,
  ScanSearch,
  Server,
  ShieldAlert,
} from "lucide-react"
import { RootCauseCenter } from "@/components/rca/root-cause-center"
import { getIncidentOverview } from "@/lib/incident-overview"
import {
  DEFAULT_OPEN_STEPS,
  JOURNEY_STEPS,
  getPropagationHops,
  type JourneyStepId,
} from "@/lib/incident-journey"
import type { CommandIncident } from "@/lib/incident-command"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"
import { digitalTwinHref } from "@/data/scenarios"

const ACTION_STATUS_STYLE = {
  Suggested: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-[var(--p2)]/15 text-[var(--p2)] border-[var(--p2)]/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
} as const

const SLA_COPY = {
  High: { zh: "SLA 窗口承压", en: "High SLA risk" },
  Medium: { zh: "SLA 风险上升", en: "Medium SLA risk" },
  Low: { zh: "SLA 已受控", en: "Low SLA risk" },
} as const

const EVIDENCE_LABEL: Record<string, { zh: string; en: string }> = {
  "Earliest Event": { zh: "最早事件", en: "Earliest Event" },
  "Topology Match": { zh: "拓扑匹配", en: "Topology Match" },
  "Disturbance Direction": { zh: "扰动证据", en: "Disturbance Evidence" },
  "Historical Similarity": { zh: "历史相似", en: "Historical Similarity" },
}

export function IncidentWorkspace({ incident }: { incident: CommandIncident }) {
  const overview = getIncidentOverview(incident.scenario)
  const tone = priorityMeta[incident.severity]
  const action = overview.recommendedAction
  const hops = useMemo(() => getPropagationHops(incident.scenario), [incident.scenario])
  const [open, setOpen] = useState<Record<JourneyStepId, boolean>>(openMap(DEFAULT_OPEN_STEPS))
  const [visited, setVisited] = useState<Set<JourneyStepId>>(() => new Set(DEFAULT_OPEN_STEPS))
  const [current, setCurrent] = useState<JourneyStepId>("summary")
  const [openHop, setOpenHop] = useState(0)
  const clickLock = useRef(false)

  useEffect(() => {
    setOpen(openMap(DEFAULT_OPEN_STEPS))
    setVisited(new Set(DEFAULT_OPEN_STEPS))
    setCurrent("summary")
    setOpenHop(0)
  }, [incident.incidentId])

  useEffect(() => {
    const syncFromScroll = () => {
      if (clickLock.current) return
      const marker = 140
      const passed = JOURNEY_STEPS.map((step) => {
        const node = document.getElementById(`journey-${step.id}`)
        if (!node) return null
        return { id: step.id, top: node.getBoundingClientRect().top }
      }).filter((item): item is { id: JourneyStepId; top: number } => Boolean(item))
      const active = [...passed].reverse().find((item) => item.top <= marker) ?? passed[0]
      if (!active) return
      setCurrent(active.id)
      setVisited((prev) => withVisited(prev, active.id))
    }
    const unlockOnWheel = () => {
      clickLock.current = false
    }
    window.addEventListener("scroll", syncFromScroll, { passive: true })
    window.addEventListener("wheel", unlockOnWheel, { passive: true })
    return () => {
      window.removeEventListener("scroll", syncFromScroll)
      window.removeEventListener("wheel", unlockOnWheel)
    }
  }, [incident.incidentId])

  const goTo = useCallback((id: JourneyStepId) => {
    clickLock.current = true
    setOpen((prev) => ({ ...prev, [id]: true }))
    setVisited((prev) => withVisited(prev, id))
    setCurrent(id)
    window.setTimeout(() => {
      document.getElementById(`journey-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 40)
  }, [])

  const toggle = (id: JourneyStepId) => {
    setOpen((prev) => {
      const next = !prev[id]
      if (next) {
        setVisited((seen) => withVisited(seen, id))
        setCurrent(id)
      }
      return { ...prev, [id]: next }
    })
  }

  const progress = Math.round((visited.size / JOURNEY_STEPS.length) * 100)
  const evidenceCards = [
    ...incident.evidence.map((card) => ({
      zh: EVIDENCE_LABEL[card.en]?.zh ?? card.zh,
      en: EVIDENCE_LABEL[card.en]?.en ?? card.en,
      value: card.value,
    })),
    { zh: "置信度", en: "Confidence", value: `${incident.confidence}%` },
  ]

  return (
    <div id="incident-journey" className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <JourneyNav current={current} visited={visited} progress={progress} onSelect={goTo} />

      <div className="min-w-0 space-y-3">
        <Chapter
          id="summary"
          open={open.summary}
          current={current === "summary"}
          onToggle={() => toggle("summary")}
        >
          <section
            className="overflow-hidden rounded-xl border-2 bg-card shadow-card"
            style={{ borderColor: tone.color }}
          >
            <div className="h-1.5" style={{ backgroundColor: tone.color }} />
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              <BriefStat label="Root Cause" zh="根因" value={incident.rootCauseZh} detail={incident.rootCause} />
              <BriefStat label="Confidence" zh="置信度" value={`${incident.confidence}%`} />
              <BriefStat
                label="Affected Services"
                zh="受影响服务"
                value={String(incident.impact.services)}
                detail={incident.scenario.incident.businessImpact}
              />
              <BriefStat
                label="Affected Assets"
                zh="受影响资产"
                value={String(incident.impact.devices)}
                detail={incident.scenario.incident.affectedAssets}
              />
              <BriefStat
                label="Current Action"
                zh="当前行动"
                value={incident.nextAction.short}
                detail={incident.nextAction.actionZh}
              />
              <BriefStat label="ETA" zh="预计完成" value={incident.nextAction.etaShort} />
            </div>
          </section>
        </Chapter>

        <Chapter
          id="root-cause"
          open={open["root-cause"]}
          current={current === "root-cause"}
          onToggle={() => toggle("root-cause")}
        >
          <RootCauseCenter />
        </Chapter>

        <Chapter
          id="propagation"
          open={open.propagation}
          current={current === "propagation"}
          onToggle={() => toggle("propagation")}
        >
          <section className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
            <ol className="relative">
              <span className="absolute bottom-4 left-[15px] top-4 w-px bg-border" aria-hidden />
              {hops.map((hop, index) => {
                const expanded = openHop === index
                return (
                  <li key={`${hop.time}-${hop.title}`} className="relative flex gap-3 py-2">
                    <span
                      className={cn(
                        "relative z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full",
                        hop.role === "root" && "bg-[var(--p1)] text-white",
                        hop.role === "cascade" && "bg-muted text-foreground",
                        hop.role === "business" && "bg-primary text-primary-foreground",
                      )}
                    >
                      <ArrowDown className="size-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenHop(expanded ? -1 : index)}
                      className={cn(
                        "min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        expanded ? "border-primary/35 bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/35",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[12px] font-bold tabular text-foreground">{hop.clock}</span>
                        <ChevronDown
                          className={cn("size-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")}
                        />
                      </div>
                      <div className="mt-0.5 text-[14px] font-bold text-foreground">{hop.title}</div>
                      <div className="text-[12px] text-muted-foreground">{hop.zh}</div>
                      {expanded ? (
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                          <HopFact label="Affected Asset" zh="受影响资产" value={hop.asset} />
                          <HopFact label="Affected Service" zh="受影响服务" value={hop.service} />
                          <HopFact label="Evidence" zh="证据" value={hop.evidence} />
                        </dl>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        </Chapter>

        <Chapter id="impact" open={open.impact} current={current === "impact"} onToggle={() => toggle("impact")}>
          <section className="grid gap-3 sm:grid-cols-2">
            <ImpactCard
              icon={<Building2 className="size-3.5" />}
              zh="业务影响"
              en="Business Impact"
              heading={incident.impactBreakdown.business.title}
              detail={incident.impactBreakdown.business.detail}
            />
            <ImpactCard
              icon={<ShieldAlert className="size-3.5" />}
              zh="服务影响"
              en="Service Impact"
              heading={incident.impactBreakdown.service.title}
              detail={incident.impactBreakdown.service.detail}
            />
            <ImpactCard
              icon={<Server className="size-3.5" />}
              zh="资产影响"
              en="Asset Impact"
              heading={incident.impactBreakdown.asset.title}
              detail={incident.impactBreakdown.asset.detail}
            />
            <ImpactCard
              icon={<Gauge className="size-3.5" />}
              zh="SLA 影响"
              en="SLA Impact"
              heading={`${incident.impact.slaRisk} · ${SLA_COPY[incident.impact.slaRisk].zh}`}
              detail={`${SLA_COPY[incident.impact.slaRisk].en} · ${incident.duration} · ${incident.impact.customers} customer window`}
            />
          </section>
        </Chapter>

        <Chapter
          id="mitigation"
          open={open.mitigation}
          current={current === "mitigation"}
          onToggle={() => toggle("mitigation")}
        >
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-primary">
                  <ClipboardList className="size-4" />
                </span>
                <div>
                  <div className="text-[15px] font-bold leading-snug text-foreground">{action.actionZh}</div>
                  <p className="text-[12px] text-muted-foreground">{action.action}</p>
                </div>
              </div>
              <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", ACTION_STATUS_STYLE[action.status])}>
                {action.status}
              </span>
            </header>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <BriefStat label="Current Action" zh="当前行动" value={incident.nextAction.short} />
              <BriefStat label="Owner" zh="负责人" value={action.ownerTeam} />
              <BriefStat label="ETA" zh="预计完成" value={action.eta} />
              <BriefStat label="Risk Reduction" zh="风险下降" value={`-${action.riskReduction}%`} />
            </div>
            <div className="border-t border-border px-4 py-3">
              <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                <span className="font-semibold text-foreground">恢复进度 · Recovery Progress</span>
                <span className="font-mono font-bold tabular">{incident.recoveryPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${incident.recoveryPercent}%` }} />
              </div>
            </div>
            <ol className="space-y-1.5 border-t border-border px-4 py-3">
              <div className="text-[11px] font-semibold text-muted-foreground">Recommended Steps</div>
              {action.steps.map((step, index) => (
                <li key={step.zh} className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] font-bold text-muted-foreground">{index + 1}</span>
                  <span className="text-[12px] font-semibold text-foreground">{step.zh}</span>
                  <span className="text-[11px] text-muted-foreground">{step.team}</span>
                </li>
              ))}
            </ol>
          </section>
        </Chapter>

        <Chapter
          id="evidence"
          open={open.evidence}
          current={current === "evidence"}
          onToggle={() => toggle("evidence")}
        >
          <section id="workspace-evidence" className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {evidenceCards.map((card) => (
                <article key={card.en} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <div className="text-[10px] font-semibold text-foreground">{card.zh}</div>
                  <div className="text-[9px] text-muted-foreground">{card.en}</div>
                  <div className="mt-1.5 font-mono text-[15px] font-extrabold tabular leading-none text-foreground">
                    {card.value}
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <EvidenceLink
                href={digitalTwinHref(incident.incidentId)}
                zh="打开数字孪生"
                en="Open Digital Twin"
                icon={<Network className="size-3.5" />}
              />
              <EvidenceLink
                href="/rca/manual"
                zh="打开事件调查中心"
                en="Open Investigation Center"
                icon={<ScanSearch className="size-3.5" />}
              />
              <EvidenceLink href="/rca/manual" zh="查看更多证据" en="View More Evidence" />
            </div>
          </section>
        </Chapter>
      </div>
    </div>
  )
}

function JourneyNav({
  current,
  visited,
  progress,
  onSelect,
}: {
  current: JourneyStepId
  visited: Set<JourneyStepId>
  progress: number
  onSelect: (id: JourneyStepId) => void
}) {
  return (
    <aside
      id="journey-nav"
      className="mb-3 rounded-xl border border-border bg-card p-3 shadow-card lg:sticky lg:top-[72px] lg:mb-0 lg:self-start"
    >
      <div className="text-[11px] font-bold text-foreground">事故分析旅程</div>
      <div className="text-[10px] text-muted-foreground">Incident Journey</div>
      <div className="mt-3">
        <div className="mb-1 flex items-baseline justify-between text-[10px]">
          <span className="font-semibold text-muted-foreground">Investigation Progress</span>
          <span className="font-mono font-bold tabular text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <nav className="mt-3 flex gap-1 overflow-x-auto lg:block lg:space-y-0.5 lg:overflow-visible" aria-label="Incident Journey">
        {JOURNEY_STEPS.map((step, index) => {
          const done = visited.has(step.id) && current !== step.id
          const active = current === step.id
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={cn(
                "flex min-w-[148px] items-start gap-2 rounded-lg px-2 py-1.5 text-left lg:min-w-0",
                active && "bg-primary/10",
                !active && "hover:bg-muted/50",
              )}
            >
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center">
                {done ? (
                  <Check className="size-3.5 text-primary" />
                ) : active ? (
                  <ArrowRight className="size-3.5 text-primary" />
                ) : (
                  <Circle className="size-3 text-muted-foreground/50" />
                )}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[12px] font-semibold", active ? "text-primary" : "text-foreground")}>
                  {step.label}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  <span className="mr-1 font-mono opacity-60">{String(index + 1).padStart(2, "0")}</span>
                  {step.question}
                </span>
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function Chapter({
  id,
  open,
  current,
  onToggle,
  children,
}: {
  id: JourneyStepId
  open: boolean
  current: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const step = JOURNEY_STEPS.find((item) => item.id === id)!
  const index = JOURNEY_STEPS.findIndex((item) => item.id === id)
  return (
    <section id={`journey-${id}`} className="scroll-mt-[88px]">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left shadow-card",
          current ? "border-primary/40" : "border-border",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 className="text-[15px] font-bold text-foreground">{step.label}</h2>
            <span className="text-[12px] text-muted-foreground">{step.zh}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{step.question}</p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/70">{String(index + 1).padStart(2, "0")}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </section>
  )
}

function BriefStat({
  label,
  zh,
  value,
  detail,
}: {
  label: string
  zh: string
  value: string
  detail?: string
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {zh} · {label}
      </div>
      <div className="mt-1 text-[15px] font-extrabold leading-snug text-foreground">{value}</div>
      {detail ? <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{detail}</div> : null}
    </div>
  )
}

function ImpactCard({
  icon,
  zh,
  en,
  heading,
  detail,
}: {
  icon: ReactNode
  zh: string
  en: string
  heading: string
  detail: string
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <div>
          <div className="text-[12px] font-semibold text-foreground">{zh}</div>
          <div className="text-[10px] text-muted-foreground">{en}</div>
        </div>
      </div>
      <div className="text-[14px] font-bold leading-snug text-foreground">{heading}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  )
}

function HopFact({ label, zh, value }: { label: string; zh: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <dt className="text-[10px] text-muted-foreground">
        {zh} · {label}
      </dt>
      <dd className="mt-0.5 text-[12px] font-semibold leading-snug text-foreground">{value}</dd>
    </div>
  )
}

function EvidenceLink({
  href,
  zh,
  en,
  icon,
}: {
  href: string
  zh: string
  en: string
  icon?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/8 px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/15"
    >
      {icon}
      {zh}
      <span className="hidden font-normal opacity-80 sm:inline">{en}</span>
      <ArrowRight className="size-3.5" />
    </Link>
  )
}

function openMap(ids: JourneyStepId[]): Record<JourneyStepId, boolean> {
  return {
    summary: ids.includes("summary"),
    "root-cause": ids.includes("root-cause"),
    propagation: ids.includes("propagation"),
    impact: ids.includes("impact"),
    mitigation: ids.includes("mitigation"),
    evidence: ids.includes("evidence"),
  }
}

function withVisited(prev: Set<JourneyStepId>, id: JourneyStepId) {
  if (prev.has(id)) return prev
  const next = new Set(prev)
  next.add(id)
  return next
}
