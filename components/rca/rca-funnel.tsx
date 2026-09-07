"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Filter } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel } from "@/components/primitives"
import { EventExplorer } from "@/components/rca/event-explorer"
import { useDemoStory } from "@/hooks/use-demo-story"
import {
  buildConvergenceFlow,
  getStageEventRows,
  type EvidenceBranch,
  type RuleFlowNode,
} from "@/lib/alarm-convergence"
import { cn } from "@/lib/utils"

function PulseFlowArrow() {
  return (
    <div className="conv-pulse-edge" aria-hidden>
      <div className="conv-pulse-track" />
      <div className="conv-pulse-particle" />
      <span className="conv-pulse-head">▶</span>
    </div>
  )
}

function FlowNode({
  count,
  name,
  description,
  reduced,
  contribution,
  active,
  isRoot,
  onClick,
}: {
  count: number
  name: string
  description: string
  reduced: number
  contribution: number
  active: boolean
  isRoot: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[128px] flex-1 rounded-lg border bg-card px-3 py-2.5 text-left transition",
        active && "border-primary shadow-[0_0_0_3px_rgba(61,205,88,0.16)]",
        !active && isRoot && "border-[#e53935]/45",
        !active && !isRoot && "border-border hover:border-primary/40",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{name}</div>
      <div
        className="mt-1 font-mono text-[28px] font-bold leading-none tabular underline decoration-dotted underline-offset-4"
        style={{ color: isRoot ? "#e53935" : undefined }}
      >
        {count}
      </div>
      {reduced > 0 ? (
        <div className="mt-1.5 text-[10px] font-semibold tabular text-[#fb8c00]">
          Reduction −{reduced} · {contribution}%
        </div>
      ) : (
        <div className="mt-1.5 text-[10px] text-muted-foreground">Reduction — · baseline</div>
      )}
      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{description}</p>
    </button>
  )
}

function RuleCards({
  rules,
  selected,
  onSelect,
}: {
  rules: RuleFlowNode[]
  selected: string | null
  onSelect: (key: string) => void
}) {
  const open = rules.find((rule) => rule.key === selected)
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {rules.map((rule) => {
          const active = selected === rule.key
          return (
            <button
              key={rule.key}
              type="button"
              onClick={() => onSelect(rule.key)}
              className={cn(
                "rounded-lg border bg-card px-3 py-2.5 text-left transition",
                active ? "border-primary shadow-[0_0_0_3px_rgba(61,205,88,0.14)]" : "border-border hover:border-primary/40",
              )}
            >
              <div className="text-[12px] font-semibold text-foreground">{rule.en}</div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
                <span>In {rule.input}</span>
                <span>Out {rule.output}</span>
                <span className="text-[#fb8c00]">−{rule.reduced}</span>
                <span className="text-primary">{rule.contribution}%</span>
              </div>
            </button>
          )
        })}
      </div>
      {open ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <div className="text-[12px] font-semibold text-foreground">{open.en} · Rule Details</div>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Rule Logic</div>
              <p className="mt-0.5 text-[12px] text-foreground">{open.how}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Matching Condition</div>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[12px] text-foreground">
                {open.conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
                {open.window ? <li>Time window: {open.window}</li> : null}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Before</div>
              <p className="mt-0.5 font-mono text-[12px]">{open.input} events enter this rule</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">After</div>
              <p className="mt-0.5 font-mono text-[12px]">
                {open.output} remain · −{open.reduced} reduced · {open.contribution}% contribution
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">Affected Events</div>
            <p className="mt-1 text-[12px] leading-snug text-foreground">
              这些是本条规则实际处理过的告警。「说明」用白话解释每条告警在现场意味着什么，不必先读告警码。
            </p>
            <div className="mt-1 overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold">Time</th>
                    <th className="px-2 py-1.5 font-semibold">Device</th>
                    <th className="px-2 py-1.5 font-semibold">说明</th>
                    <th className="px-2 py-1.5 font-semibold">Code</th>
                    <th className="px-2 py-1.5 font-semibold">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {open.affected.slice(0, 12).map((alarm) => (
                    <tr key={alarm.id} className="border-t border-border/70">
                      <td className="whitespace-nowrap px-2 py-1 font-mono">{alarm.timestamp}</td>
                      <td className="whitespace-nowrap px-2 py-1">{alarm.device}</td>
                      <td className="px-2 py-1 text-foreground">{alarm.message}</td>
                      <td className="whitespace-nowrap px-2 py-1 font-mono">{alarm.code}</td>
                      <td className="whitespace-nowrap px-2 py-1">{alarm.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {open.affected.length > 12 ? (
                <div className="border-t border-border px-2 py-1 text-[10px] text-muted-foreground">
                  +{open.affected.length - 12} more affected events
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EvidenceTree({
  branches,
  onLeaf,
}: {
  branches: EvidenceBranch[]
  onLeaf: (alarmId?: string) => void
}) {
  const [open, setOpen] = useState<string[]>(["direct", "cascade"])
  return (
    <ul className="space-y-1 font-mono text-[11px]">
      {branches.map((branch) => {
        const expanded = open.includes(branch.id)
        return (
          <li key={branch.id}>
            <button
              type="button"
              onClick={() =>
                setOpen((current) =>
                  current.includes(branch.id) ? current.filter((id) => id !== branch.id) : [...current, branch.id],
                )
              }
              className="flex w-full items-center gap-1.5 text-left font-semibold text-foreground"
            >
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition", expanded && "rotate-180")} />
              ├─ {branch.label}
              {branch.count != null ? <span className="text-muted-foreground">({branch.count})</span> : null}
            </button>
            {expanded ? (
              <ul className="ml-5 mt-0.5 space-y-0.5 text-muted-foreground">
                {branch.leaves.map((leaf) => (
                  <li key={leaf.id}>
                    <button
                      type="button"
                      onClick={() => onLeaf(leaf.alarmId)}
                      className={cn("text-left", leaf.alarmId && "underline decoration-dotted hover:text-foreground")}
                    >
                      │  {leaf.label}
                      {leaf.detail ? <span className="ml-1 text-[10px]">· {leaf.detail}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function RcaFunnel() {
  const { scenario } = useDemoScenario()
  const { stage, playing, runId } = useDemoStory()
  const flow = useMemo(() => buildConvergenceFlow(scenario), [scenario])
  const [activeStage, setActiveStage] = useState("cluster")
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [showSupport, setShowSupport] = useState(false)
  const [explainWhy, setExplainWhy] = useState(false)
  const [highlightId, setHighlightId] = useState<string | undefined>()

  useEffect(() => {
    setActiveStage("cluster")
    setSelectedRule(null)
    setShowSupport(false)
    setExplainWhy(false)
    setHighlightId(undefined)
  }, [scenario.id])

  useEffect(() => {
    if (stage !== 3 || !playing) return
    const keys = ["raw", "noise", "cluster", "topology", "causal"] as const
    let i = 0
    setActiveStage("raw")
    setHighlightId(undefined)
    const timer = window.setInterval(() => {
      i += 1
      const key = keys[Math.min(i, keys.length - 1)]!
      setActiveStage(key)
      if (i >= keys.length - 1) window.clearInterval(timer)
    }, 1400)
    return () => window.clearInterval(timer)
  }, [stage, playing, runId])

  const current = flow.stages.find((item) => item.key === activeStage) ?? flow.stages[0]!
  const rows = useMemo(() => getStageEventRows(flow, current.key), [flow, current.key])
  const rootColor = scenario.incident.severity === "P1" ? "#e53935" : "#fb8c00"
  const evidenceCount = flow.evidence.direct.length + flow.evidence.cascadedCount

  return (
    <Panel
      title="告警收敛工作台"
      subtitle="Alarm Convergence Workspace · Explainable AI · Alarm Lineage"
      description="Click a stage to refresh Event Explorer in place · Root Cause → Candidate → Aggregated → Raw"
      icon={<Filter className="size-4" />}
    >
      <div id="correlation-pipeline" className="space-y-5">
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-[12px] font-semibold text-foreground">Convergence Flow</h3>
              <span className="text-[10px] text-muted-foreground">Pulse Flow · event compression 40 → 1</span>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
              {flow.stages.map((item, index) => (
                <div key={item.key} className="flex flex-1 items-stretch">
                  <FlowNode
                    count={item.count}
                    name={item.en}
                    description={item.description}
                    reduced={item.reduced}
                    contribution={item.contribution}
                    active={activeStage === item.key}
                    isRoot={item.key === "causal"}
                    onClick={() => {
                      setActiveStage(item.key)
                      setHighlightId(undefined)
                    }}
                  />
                  {index < flow.stages.length - 1 ? <PulseFlowArrow /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-card" style={{ borderColor: `${rootColor}55` }}>
            <div className="px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: rootColor }}>
                Root Cause Card
              </div>
              <div className="mt-1 text-[15px] font-bold leading-snug text-foreground">{flow.root.title}</div>
              <div className="text-[12px] text-muted-foreground">{scenario.incident.rootCauseZh}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Confidence</div>
                  <div className="text-[16px] font-bold" style={{ color: rootColor }}>{scenario.incident.confidence}%</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Evidence Count</div>
                  <div className="text-[16px] font-bold tabular">{evidenceCount}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Affected Assets</div>
                  <div className="text-[12px] font-semibold">{scenario.incident.affectedAssets}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Business Impact</div>
                  <div className="text-[12px] font-semibold">{scenario.incident.businessImpact}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExplainWhy((value) => !value)}
                className="mt-3 rounded-full px-3 py-1 text-[11px] font-bold text-white"
                style={{ backgroundColor: rootColor }}
              >
                {explainWhy ? "Hide Explain Why" : "Explain Why"}
              </button>
            </div>
            {explainWhy ? (
              <div className="border-t border-border/70 px-4 py-3">
                <div className="mb-2 text-[11px] font-semibold text-foreground">Alarm Lineage · Why this root</div>
                <EvidenceTree
                  branches={flow.evidenceTree}
                  onLeaf={(alarmId) => {
                    if (alarmId) {
                      setActiveStage("raw")
                      setHighlightId(alarmId)
                    }
                  }}
                />
              </div>
            ) : null}
          </section>
        </div>

        <EventExplorer
          key={`${scenario.id}-${current.key}`}
          rows={rows}
          stageKey={current.key}
          stageLabel={`${current.count} ${current.en}`}
          highlightId={highlightId}
        />

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[12px] font-semibold text-foreground">Convergence Rules</h3>
            <span className="text-[10px] text-muted-foreground">Rule Transparency · click a card for logic and affected events</span>
          </div>
          <RuleCards
            rules={flow.pipelineRules}
            selected={selectedRule}
            onSelect={(key) => setSelectedRule((current) => (current === key ? null : key))}
          />
          <button
            type="button"
            onClick={() => setShowSupport((value) => !value)}
            className="text-[11px] font-semibold text-muted-foreground"
          >
            {showSupport ? "Hide supporting lenses" : `Show ${flow.supportingRules.length} supporting lenses`}
          </button>
          {showSupport ? (
            <RuleCards
              rules={flow.supportingRules}
              selected={selectedRule}
              onSelect={(key) => setSelectedRule((current) => (current === key ? null : key))}
            />
          ) : null}
        </section>
      </div>
    </Panel>
  )
}
