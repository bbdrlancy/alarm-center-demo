"use client"

import { useEffect, useMemo, useState } from "react"
import { Filter } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel } from "@/components/primitives"
import { EventExplorer } from "@/components/rca/event-explorer"
import { useDemoStory } from "@/hooks/use-demo-story"
import type { ScenarioModel } from "@/data/scenarios"
import { buildConvergenceFlow, getStageEventRows, type RuleFlowNode } from "@/lib/alarm-convergence"
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
  stageName,
  ruleName,
  input,
  output,
  reduced,
  ratio,
  contribution,
  active,
  isRoot,
  onClick,
}: {
  stageName: string
  ruleName: string
  input: number
  output: number
  reduced: number
  ratio: number
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
        "min-w-[148px] flex-1 rounded-lg border bg-card px-3 py-2.5 text-left transition",
        active && "border-primary shadow-[0_0_0_3px_rgba(61,205,88,0.16)]",
        !active && isRoot && "border-[#e53935]/45",
        !active && !isRoot && "border-border hover:border-primary/40",
      )}
    >
      <div className="text-[11px] font-bold text-l2">{ruleName}</div>
      <div className="text-[10px] uppercase tracking-wide text-l3">{stageName}</div>
      <div
        className="mt-2 font-mono text-[26px] font-extrabold leading-none tabular text-l1"
        style={{ color: isRoot ? "#e53935" : undefined }}
      >
        {input === output ? output : `${input} → ${output}`}
      </div>
      {reduced > 0 ? (
        <dl className="mt-2 space-y-0.5">
          <Metric label="Reduction" value={`-${reduced}`} />
          <Metric label="Reduction Rate" value={`${Math.round(ratio)}%`} />
          <Metric label="Contribution" value={`${Math.round(contribution)}%`} />
        </dl>
      ) : (
        <div className="mt-2 text-[10px] text-l4">Baseline</div>
      )}
    </button>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[10px] text-l3">{label}</dt>
      <dd className="font-mono text-[12px] font-bold tabular text-l2">{value}</dd>
    </div>
  )
}

function LinkedRuleDetail({ rule }: { rule: RuleFlowNode | undefined }) {
  if (!rule) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-[13px] text-l2">本阶段未应用收敛规则。</p>
        <p className="mt-0.5 text-[10px] text-l4">No convergence rule at this stage.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase text-l3">Rule Logic</div>
          <p className="mt-0.5 text-[13px] text-l2">{rule.how}</p>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase text-l3">Rule Reason</div>
          <p className="mt-0.5 text-[13px] text-l2">{rule.reason}</p>
        </div>
      </div>
      {rule.window ? (
        <div className="mt-2 text-[12px] text-l4">时间窗 · {rule.window}</div>
      ) : null}
    </div>
  )
}

export function RcaFunnel({ scenario: scenarioOverride }: { scenario?: ScenarioModel } = {}) {
  const { scenario: demoScenario } = useDemoScenario()
  const scenario = scenarioOverride ?? demoScenario
  const { stage, playing, runId } = useDemoStory()
  const flow = useMemo(() => buildConvergenceFlow(scenario), [scenario])
  const [activeStage, setActiveStage] = useState("cluster")
  const [highlightId, setHighlightId] = useState<string | undefined>()

  useEffect(() => {
    setActiveStage("cluster")
    setHighlightId(undefined)
  }, [scenario.id])

  useEffect(() => {
    if (stage !== 4 || !playing) return
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
  const linkedRule = current.ruleKey
    ? flow.pipelineRules.find((rule) => rule.key === current.ruleKey)
    : undefined
  const rows = useMemo(() => getStageEventRows(flow, current.key), [flow, current.key])

  return (
    <Panel
      title="告警收敛工作台"
      subtitle="Alarm Convergence Workspace"
      description="点击阶段查看规则说明与事件列表"
      icon={<Filter className="size-4" />}
    >
      <div id="correlation-pipeline" className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[12px] font-semibold text-l3">收敛流程</h3>
              <span className="text-[10px] text-l4">Convergence Flow</span>
            </div>
            <span className="text-[10px] text-l4">
              {flow.stages[0]?.count} → {flow.stages[flow.stages.length - 1]?.count}
            </span>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
            {flow.stages.map((item, index) => (
              <div key={item.key} className="flex flex-1 items-stretch">
                <FlowNode
                  stageName={item.en}
                  ruleName={item.ruleName}
                  input={item.input}
                  output={item.output}
                  reduced={item.reduced}
                  ratio={item.ratio}
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
          <LinkedRuleDetail rule={linkedRule} />
        </section>

        <EventExplorer
          key={`${scenario.id}-${current.key}`}
          rows={rows}
          stageKey={current.key}
          stageLabel={`${current.count} ${current.en}`}
          highlightId={highlightId}
        />
      </div>
    </Panel>
  )
}
