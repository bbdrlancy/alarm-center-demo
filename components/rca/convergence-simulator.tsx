"use client"

import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { ROLE_HINT, type TaggedAlarm } from "@/lib/alarm-convergence"
import type { AlarmSeverity } from "@/lib/incident-data"
import type { InventoryEventRow } from "@/lib/manual-event-inventory"
import {
  DEFAULT_PIPELINE_METHODS,
  PIPELINE_BRANCHES,
  PIPELINE_METHODS,
  PIPELINE_PRESETS,
  sameMethods,
  simulatePipeline,
  type PipelineMethodKey,
  type SimulatorContribution,
  type SimulatorGroup,
  type SimulatorIncident,
  type SimulatorResult,
} from "@/lib/convergence-simulator"
import { cn } from "@/lib/utils"

function PulseArrow({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex h-8 items-center justify-center text-[12px] text-cyan-300/80 lg:hidden" aria-hidden>
        ↓
      </div>
    )
  }
  return (
    <div className="conv-pulse-edge mx-1" aria-hidden>
      <div className="conv-pulse-track" />
      <div className="conv-pulse-particle" />
      <span className="conv-pulse-head">▶</span>
    </div>
  )
}

function toggleMethod(current: PipelineMethodKey[], key: PipelineMethodKey) {
  return current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
}

export function ConvergenceSimulator({
  selectedRows,
  onLocate,
}: {
  selectedRows: InventoryEventRow[]
  onLocate: (row: InventoryEventRow) => void
}) {
  const [methods, setMethods] = useState<PipelineMethodKey[]>(DEFAULT_PIPELINE_METHODS)
  const [openRule, setOpenRule] = useState<string | null>(null)
  const [lineageId, setLineageId] = useState<string | null>(null)

  const result = useMemo(() => simulatePipeline(selectedRows, methods), [selectedRows, methods])
  const lineage = result.incidents.find((item) => item.id === lineageId) ?? null
  const selectedCount = methods.length

  if (selectedRows.length === 0) return null

  const applyMethods = (next: PipelineMethodKey[]) => {
    setMethods(next)
    setLineageId(null)
    setOpenRule(null)
  }

  return (
    <section className="mt-3 overflow-hidden rounded-xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(11,18,36,0.96),rgba(8,13,26,0.94))] text-cyan-50 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/15 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">Convergence Simulator</div>
          <h3 className="text-[15px] font-semibold text-cyan-50">收敛模拟器</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 font-mono text-[12px] font-bold text-cyan-100">
            Selected {selectedRows.length} Alarms
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[12px] text-cyan-100/80">
            {selectedCount} methods
          </div>
        </div>
      </header>

      <PipelinePicker
        methods={methods}
        inputCount={selectedRows.length}
        correlatedCount={result.correlatedCount}
        outputCount={result.incidentCount}
        onToggle={(key) => applyMethods(toggleMethod(methods, key))}
        onPreset={applyMethods}
      />

      {methods.length === 0 ? (
        <p className="px-4 py-6 text-[12px] text-cyan-200/55">请在上方管道中勾选至少一种收敛方法，模拟器将按管道路径只跑所选节点。</p>
      ) : (
        <>
          <Funnel result={result} />
          <PathSummary result={result} />
          <Contribution result={result} openRule={openRule} onToggle={setOpenRule} />
          <IncidentLineage
            result={result}
            lineage={lineage}
            selectedRows={selectedRows}
            onOpen={setLineageId}
            onLocate={onLocate}
          />
        </>
      )}
    </section>
  )
}

const BRANCH_TONE = {
  denoise: {
    frame: "border-cyan-300/40 bg-cyan-400/8",
    head: "border-cyan-300/55 bg-[#083044] text-cyan-50",
  },
  relation: {
    frame: "border-amber-300/35 bg-amber-400/8",
    head: "border-amber-300/50 bg-[#3a2a12] text-amber-50",
  },
  scenario: {
    frame: "border-[#7dff9a]/35 bg-[#3dcd58]/8",
    head: "border-[#7dff9a]/45 bg-[#12301c] text-[#d8ffe4]",
  },
} as const

function PipelinePicker({
  methods,
  inputCount,
  correlatedCount,
  outputCount,
  onToggle,
  onPreset,
}: {
  methods: PipelineMethodKey[]
  inputCount: number
  correlatedCount: number
  outputCount: number
  onToggle: (key: PipelineMethodKey) => void
  onPreset: (methods: PipelineMethodKey[]) => void
}) {
  const rcaOn = methods.includes("rca")
  const branchOn = PIPELINE_BRANCHES.map((branch) =>
    PIPELINE_METHODS.some((item) => item.branch === branch.key && methods.includes(item.key)),
  )
  return (
    <div className="border-b border-cyan-400/10 px-4 py-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">Built-in Pipeline</div>
          <div className="text-[13px] font-semibold">报警收敛流程图</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PIPELINE_PRESETS.map((preset) => {
            const on = sameMethods(methods, preset.methods)
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onPreset(preset.methods)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                  on ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-50" : "border-white/10 bg-white/4 text-cyan-200/70 hover:border-cyan-300/30",
                )}
              >
                {preset.zh}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pipeline-board rounded-xl border border-cyan-400/15 bg-[#07101f]/80 px-3 py-4 sm:px-5">
        <p className="mx-auto mb-3 max-w-2xl text-center text-[12px] leading-relaxed text-cyan-100/75">
          从原始告警出发，同时走三条分析路径，再汇成事件集、判断根因。
          <span className="text-cyan-200/55"> 点击方框即可开关该方法，灰线表示本轮未选用。</span>
        </p>

        <FlowTerminator
          step="1"
          title="原始告警事件"
          hint="先把选中的告警收进来"
          count={inputCount}
          unit="条"
        />

        <FlowCaption>同时分三条路分析</FlowCaption>
        <ForkJoin lines={branchOn} />

        <div className="grid items-stretch gap-3 lg:grid-cols-3">
          {PIPELINE_BRANCHES.map((branch) => {
            const items = PIPELINE_METHODS.filter((item) => item.branch === branch.key)
            const enabled = items.filter((item) => methods.includes(item.key)).length
            const tone = BRANCH_TONE[branch.key]
            return (
              <div key={branch.key} className={cn("flex flex-col rounded-xl border px-2.5 py-2.5", tone.frame)}>
                <div className={cn("mb-2 rounded-md border px-2.5 py-2 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]", tone.head)}>
                  <div className="text-[13px] font-bold">{branch.zh}</div>
                  <div className="text-[11px] opacity-75">{branch.plain}</div>
                  <div className="mt-1 text-[10px] opacity-60">
                    {enabled}/{items.length} 已启用
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {items.map((item) => (
                    <FlowProcess
                      key={item.key}
                      title={item.zh}
                      hint={item.hint}
                      on={methods.includes(item.key)}
                      onToggle={() => onToggle(item.key)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <ForkJoin lines={branchOn} merge />
        <FlowCaption>三条路的结果汇到一起</FlowCaption>

        <FlowProcess
          step="2"
          title="关联事件集"
          hint="收敛后剩下的事件组，供根因判断使用"
          count={correlatedCount}
          unit="组"
          staticNode
          on={methods.length > 0}
        />

        <FlowSpine on={rcaOn} label="判断真正源头" />

        <FlowDecision
          title="RCA 根因分析"
          hint="从关联事件里找出真正源头"
          on={rcaOn}
          onToggle={() => onToggle("rca")}
        />

        <FlowSpine on={methods.length > 0} />

        <FlowTerminator
          step="3"
          title={rcaOn ? "根因事件" : "输出事件"}
          hint={rcaOn ? "最终定位到的源头" : "未做 RCA，输出关联事件"}
          count={outputCount}
          unit="条"
          accent
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-cyan-200/50">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-6 border-t-2 border-dashed border-cyan-300" />
          亮线 / 实框 = 本轮启用
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-6 border-t-2 border-dashed border-white/25" />
          灰线 / 虚框 = 未选用，将被跳过
        </span>
      </div>
    </div>
  )
}

function FlowCaption({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center py-1.5">
      <span className="rounded-full border border-white/10 bg-[#07101f]/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-200/65">
        {children}
      </span>
    </div>
  )
}

function ForkJoin({ lines, merge = false }: { lines: boolean[]; merge?: boolean }) {
  const [left, mid, right] = lines
  return (
    <div className="hidden h-10 lg:block" aria-hidden>
      <svg viewBox="0 0 100 20" className="h-full w-full" preserveAspectRatio="none">
        {merge ? (
          <>
            <path d="M16.6 0 V8 H50 V20" className={cn("pipeline-line", left ? "pipeline-line-on" : "pipeline-line-off")} />
            <path d="M50 0 V20" className={cn("pipeline-line", mid ? "pipeline-line-on" : "pipeline-line-off")} />
            <path d="M83.4 0 V8 H50 V20" className={cn("pipeline-line", right ? "pipeline-line-on" : "pipeline-line-off")} />
          </>
        ) : (
          <>
            <path d="M50 0 V8 H16.6 V20" className={cn("pipeline-line", left ? "pipeline-line-on" : "pipeline-line-off")} />
            <path d="M50 0 V20" className={cn("pipeline-line", mid ? "pipeline-line-on" : "pipeline-line-off")} />
            <path d="M50 0 V8 H83.4 V20" className={cn("pipeline-line", right ? "pipeline-line-on" : "pipeline-line-off")} />
          </>
        )}
      </svg>
    </div>
  )
}

function FlowSpine({ on, label }: { on: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <svg viewBox="0 0 8 22" className="h-6 w-3">
        <path d="M4 0 V18" className={cn("pipeline-line", on ? "pipeline-line-on" : "pipeline-line-off")} />
        <path d="M1.2 14.5 L4 19 L6.8 14.5" className={cn("pipeline-line", on ? "pipeline-line-on" : "pipeline-line-off")} />
      </svg>
      {label ? <span className="text-[10px] text-cyan-200/50">{label}</span> : null}
    </div>
  )
}

function FlowTerminator({
  step,
  title,
  hint,
  count,
  unit,
  accent = false,
}: {
  step: string
  title: string
  hint: string
  count: number
  unit: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-sm items-center justify-between rounded-full border-2 px-5 py-2.5 shadow-[0_0_20px_rgba(34,211,238,0.08)]",
        accent ? "border-[#ff8a80]/70 bg-[#3a1214]" : "border-cyan-300/60 bg-[#083044]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-[11px] font-black",
            accent ? "bg-[#ff8a80] text-[#3a1214]" : "bg-cyan-300 text-[#083044]",
          )}
        >
          {step}
        </span>
        <div>
          <div className="text-[13px] font-bold">{title}</div>
          <div className="text-[10px] text-cyan-100/55">{hint}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("font-mono text-[22px] font-extrabold leading-none tabular", accent ? "text-[#ff8a80]" : "text-cyan-50")}>
          {count}
        </div>
        <div className="text-[10px] text-cyan-200/45">{unit}</div>
      </div>
    </div>
  )
}

function FlowProcess({
  step,
  title,
  hint,
  on,
  onToggle,
  count,
  unit,
  staticNode = false,
}: {
  step?: string
  title: string
  hint: string
  on: boolean
  onToggle?: () => void
  count?: number
  unit?: string
  staticNode?: boolean
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {step ? (
              <span className="inline-flex size-5 items-center justify-center rounded-sm bg-cyan-300 text-[10px] font-black text-[#083044]">
                {step}
              </span>
            ) : null}
            <span className="text-[12px] font-bold text-cyan-50">{title}</span>
          </div>
          <div className="mt-0.5 text-[10px] leading-snug text-cyan-200/55">{hint}</div>
        </div>
        {count != null ? (
          <div className="text-right">
            <div className="font-mono text-[18px] font-extrabold leading-none tabular">{count}</div>
            {unit ? <div className="text-[10px] text-cyan-200/45">{unit}</div> : null}
          </div>
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold",
              on ? "bg-cyan-300/20 text-cyan-100" : "bg-white/5 text-cyan-200/40",
            )}
          >
            {on ? "启用" : "跳过"}
          </span>
        )}
      </div>
    </>
  )
  const className = cn(
    "w-full rounded-md border-2 px-2.5 py-2 text-left transition",
    on ? "border-cyan-300/55 bg-[#0a1a2e] shadow-[0_0_0_1px_rgba(103,232,249,0.15)]" : "border-dashed border-white/20 bg-[#07101f]/70 text-cyan-100/70",
    !staticNode && "hover:border-cyan-300/40",
    staticNode && "mx-auto max-w-sm",
  )
  if (staticNode) return <div className={className}>{body}</div>
  return (
    <button type="button" onClick={onToggle} className={className}>
      {body}
    </button>
  )
}

function FlowDecision({
  title,
  hint,
  on,
  onToggle,
}: {
  title: string
  hint: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button type="button" onClick={onToggle} className="mx-auto block w-full max-w-sm">
      <div
        className={cn(
          "relative px-8 py-3 text-center",
          on ? "text-cyan-50" : "text-cyan-100/60",
        )}
        style={{
          clipPath: "polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)",
          background: on ? "linear-gradient(180deg,#155e75,#0b3a4a)" : "#0b1524",
          boxShadow: on ? "0 0 0 2px rgba(103,232,249,0.55)" : "0 0 0 2px rgba(255,255,255,0.16)",
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">判断</div>
        <div className="text-[13px] font-bold">{title}</div>
        <div className="text-[10px] text-cyan-200/55">{hint}</div>
        <div className={cn("mt-1 text-[9px] font-bold", on ? "text-[#7dff9a]" : "text-cyan-200/35")}>{on ? "启用" : "跳过"}</div>
      </div>
    </button>
  )
}

function Funnel({ result }: { result: SimulatorResult }) {
  const max = Math.max(1, ...result.stages.map((stage) => stage.count))
  return (
    <div className="border-b border-cyan-400/10 px-4 py-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">Convergence Funnel</div>
          <div className="text-[13px] font-semibold">收敛漏斗</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-cyan-200/55">Reduction Rate</div>
          <div className="font-mono text-[22px] font-extrabold text-[#7dff9a]">{result.reductionRate}%</div>
        </div>
      </div>
      <div className="flex flex-col items-stretch lg:flex-row lg:items-center">
        {result.stages.map((stage, index) => (
          <div key={`${stage.key}-${index}`} className="flex flex-1 flex-col lg:flex-row lg:items-center">
            <div className="w-full rounded-lg border border-cyan-400/20 bg-[#07101f]/80 px-3 py-2.5 text-left">
              <div className="text-[10px] text-cyan-200/50">{stage.en}</div>
              <div className="text-[12px] font-semibold text-cyan-50">{stage.zh}</div>
              <div className="mt-1 font-mono text-[26px] font-extrabold leading-none tabular">{stage.count}</div>
              {stage.dropped > 0 ? (
                <div className="mt-1 text-[10px] text-[#fb8c00]">−{stage.dropped} removed</div>
              ) : (
                <div className="mt-1 text-[10px] text-cyan-200/40">passthrough</div>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="sankey-band h-full rounded-full bg-gradient-to-r from-cyan-400 to-[#3dcd58]"
                  style={{ width: `${Math.max(8, (stage.count / max) * 100)}%` }}
                />
              </div>
            </div>
            {index < result.stages.length - 1 ? (
              <>
                <PulseArrow vertical />
                <PulseArrow />
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function PathSummary({ result }: { result: SimulatorResult }) {
  return (
    <div className="border-b border-cyan-400/10 px-4 py-4">
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">Selected Path Effect</div>
        <div className="text-[13px] font-semibold">当前路径效果</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <SummaryCard label="Incidents" value={String(result.incidentCount)} hint="输出事件数" />
        <SummaryCard label="Reduction %" value={`${result.reductionRate}%`} hint={`${result.inputCount} → ${result.incidentCount}`} />
        <SummaryCard label="Confidence %" value={`${result.confidence}%`} hint="按所选方法覆盖度估算" />
      </div>
      <p className="mt-2 text-[11px] text-cyan-200/55">
        当前路径：{result.methods.map((key) => PIPELINE_METHODS.find((item) => item.key === key)?.zh).join(" → ") || "未选择"}
      </p>
    </div>
  )
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/4 px-3 py-3">
      <div className="text-[10px] text-cyan-200/45">{label}</div>
      <div className="font-mono text-[22px] font-extrabold tabular text-cyan-50">{value}</div>
      <div className="text-[10px] text-cyan-200/40">{hint}</div>
    </div>
  )
}

function describeFinding(item: SimulatorContribution) {
  if (item.key === "flap") {
    return item.reduced > 0
      ? { verdict: "已过滤", tone: "warn", sentence: `识别出 ${item.reduced} 条闪断 / 噪声，不再进入后面的分析。` }
      : { verdict: "无变化", tone: "mute", sentence: "没有识别到需要去掉的震荡告警。" }
  }
  if (item.key === "rca") {
    return { verdict: "已定位", tone: "accent", sentence: `从 ${item.input} 组关联事件里，判断出 ${item.output} 条根因。` }
  }
  if (item.reduced === 0) {
    return { verdict: "无变化", tone: "mute", sentence: `检查了 ${item.input} 条，没有可合并对象，原样进入下一步。` }
  }
  return {
    verdict: "已合并",
    tone: "ok",
    sentence: `把 ${item.input} 条收成 ${item.output} 组，少了 ${item.reduced} 条。`,
  }
}

function Contribution({
  result,
  openRule,
  onToggle,
}: {
  result: SimulatorResult
  openRule: string | null
  onToggle: (key: string | null) => void
}) {
  const sections = [
    ...PIPELINE_BRANCHES.map((branch) => ({
      key: branch.key,
      zh: branch.zh,
      plain: branch.plain,
      items: result.contributions.filter((item) => PIPELINE_METHODS.find((method) => method.key === item.key)?.branch === branch.key),
    })),
    {
      key: "rca",
      zh: "根因判断",
      plain: "从关联事件里找出真正源头",
      items: result.contributions.filter((item) => item.key === "rca"),
    },
  ].filter((section) => section.items.length > 0)

  return (
    <div className="border-b border-cyan-400/10 px-4 py-4">
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">What Each Method Found</div>
        <div className="text-[13px] font-semibold">规则识别结果</div>
        <p className="mt-1 text-[11px] text-cyan-200/50">按流程图的三条路径说明：每种方法识别到了什么、收成几组、少了多少。点开卡片可看具体告警。</p>
      </div>
      {sections.length === 0 ? (
        <p className="text-[11px] text-cyan-200/45">当前路径没有识别结果。</p>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.key}>
              <div className="mb-2 flex items-baseline gap-2">
                <h4 className="text-[12px] font-bold text-cyan-50">{section.zh}</h4>
                <span className="text-[10px] text-cyan-200/45">{section.plain}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const open = openRule === item.key
                  const finding = describeFinding(item)
                  const max = Math.max(item.input, item.output, 1)
                  return (
                    <article key={item.key} className="rounded-lg border border-white/10 bg-[#07101f]/70">
                      <button type="button" onClick={() => onToggle(open ? null : item.key)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
                        <ChevronDown className={cn("mt-1 size-3.5 shrink-0 text-cyan-200/50 transition", open && "rotate-180")} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-bold text-cyan-50">{item.zh}</span>
                            <span
                              className={cn(
                                "rounded-sm px-1.5 py-0.5 text-[9px] font-bold",
                                finding.tone === "ok" && "bg-[#3dcd58]/15 text-[#7dff9a]",
                                finding.tone === "warn" && "bg-[#fb8c00]/15 text-[#ffb74d]",
                                finding.tone === "accent" && "bg-[#e53935]/15 text-[#ff8a80]",
                                finding.tone === "mute" && "bg-white/5 text-cyan-200/45",
                              )}
                            >
                              {finding.verdict}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-cyan-100/80">{finding.sentence}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <CountPair input={item.input} output={item.output} filter={item.key === "flap"} />
                            <div className="min-w-[120px] flex-1">
                              <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-[#3dcd58]"
                                  style={{ width: `${Math.max(10, (item.output / max) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          {item.groups.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.groups.slice(0, 6).map((group) => (
                                <span key={group.id} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-cyan-100/80">
                                  {group.title} · {group.merged} 条
                                </span>
                              ))}
                              {item.groups.length > 6 ? (
                                <span className="text-[10px] text-cyan-200/45">+{item.groups.length - 6} 组</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </button>
                      {open ? (
                        <div className="border-t border-white/8 px-3 py-2.5">
                          {item.groups.length === 0 ? (
                            <div className="text-[11px] text-cyan-200/45">这一步没有形成具体识别组。</div>
                          ) : (
                            <FindingTables groups={item.groups} />
                          )}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function CountPair({ input, output, filter }: { input: number; output: number; filter?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold tabular">
      <span className="text-cyan-50">{input}</span>
      <span className="text-[10px] font-medium text-cyan-200/40">条</span>
      <span className="text-cyan-300/70">→</span>
      <span className={output < input ? "text-[#7dff9a]" : "text-cyan-50"}>{output}</span>
      <span className="text-[10px] font-medium text-cyan-200/40">{filter ? "条留下" : "组"}</span>
    </div>
  )
}

const CATEGORY_EN: Record<TaggedAlarm["role"], string> = {
  "root-symptom": "Root Symptom",
  cascade: "Cascade",
  secondary: "Secondary",
  noise: "Noise",
}

const SEVERITY_TONE: Record<AlarmSeverity, { color: string; bg: string }> = {
  Critical: { color: "#e53935", bg: "rgba(229,57,53,0.14)" },
  Major: { color: "#fb8c00", bg: "rgba(251,140,0,0.14)" },
  Minor: { color: "#c9a227", bg: "rgba(201,162,39,0.16)" },
  Warning: { color: "#22d3ee", bg: "rgba(34,211,238,0.14)" },
}

const DEVICE_PALETTE = [
  { stripe: "#22d3ee", fill: "rgba(34,211,238,0.16)", text: "#a5f3fc" },
  { stripe: "#fbbf24", fill: "rgba(251,191,36,0.16)", text: "#fde68a" },
  { stripe: "#a78bfa", fill: "rgba(167,139,250,0.18)", text: "#ddd6fe" },
  { stripe: "#34d399", fill: "rgba(52,211,153,0.16)", text: "#a7f3d0" },
  { stripe: "#fb7185", fill: "rgba(251,113,133,0.18)", text: "#fecdd3" },
  { stripe: "#60a5fa", fill: "rgba(96,165,250,0.18)", text: "#bfdbfe" },
  { stripe: "#fb923c", fill: "rgba(251,146,60,0.16)", text: "#fed7aa" },
  { stripe: "#2dd4bf", fill: "rgba(45,212,191,0.16)", text: "#99f6e4" },
] as const

function deviceTone(device: string) {
  let hash = 0
  for (let i = 0; i < device.length; i += 1) hash = (hash * 31 + device.charCodeAt(i)) >>> 0
  return DEVICE_PALETTE[hash % DEVICE_PALETTE.length]!
}

function FindingTables({ groups }: { groups: SimulatorGroup[] }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-cyan-200/45">同设备用同一色条标识，行已按设备 + 时间排列，便于核对震荡 / 重复。</p>
      {groups.map((group) => (
        <div key={group.id} className="overflow-hidden rounded-md border border-white/10">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/8 bg-white/5 px-2.5 py-1.5">
            <div>
              <span className="text-[11px] font-semibold text-cyan-50">{group.title}</span>
              {group.device !== "—" ? <span className="ml-1.5 text-[10px] text-cyan-200/50">{group.device}</span> : null}
            </div>
            <div className="text-[10px] text-cyan-200/45">
              {group.detail} · {group.merged} 条
            </div>
          </div>
          <FindingAlarmTable alarms={group.members} />
        </div>
      ))}
    </div>
  )
}

function FindingAlarmTable({ alarms }: { alarms: TaggedAlarm[] }) {
  const rows = [...alarms].sort((a, b) => {
    const device = a.device.localeCompare(b.device)
    return device !== 0 ? device : a.timestamp.localeCompare(b.timestamp)
  })
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[11px]">
        <thead className="bg-[#061018] text-[10px] uppercase tracking-wide text-cyan-200/50">
          <tr>
            <th className="px-2 py-1.5 font-semibold">Timestamp</th>
            <th className="px-2 py-1.5 font-semibold">Severity</th>
            <th className="px-2 py-1.5 font-semibold">Device</th>
            <th className="px-2 py-1.5 font-semibold">说明</th>
            <th className="px-2 py-1.5 font-semibold">Alarm Code</th>
            <th className="px-2 py-1.5 font-semibold">Category</th>
            <th className="px-2 py-1.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((alarm) => {
            const tone = deviceTone(alarm.device)
            const severity = SEVERITY_TONE[alarm.severity]
            return (
              <tr key={alarm.id} className="border-t border-white/8" style={{ background: tone.fill }}>
                <td className="px-2 py-1.5 font-mono text-cyan-100/80" style={{ boxShadow: `inset 3px 0 0 ${tone.stripe}` }}>
                  {alarm.timestamp}
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ color: severity.color, background: severity.bg }}
                  >
                    {alarm.severity}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className="inline-flex rounded px-1.5 py-0.5 font-semibold"
                    style={{ color: tone.text, background: "rgba(0,0,0,0.22)", boxShadow: `inset 0 0 0 1px ${tone.stripe}` }}
                  >
                    {alarm.device}
                  </span>
                </td>
                <td className="max-w-[240px] truncate px-2 py-1.5 text-cyan-50" title={alarm.message}>
                  {alarm.message}
                </td>
                <td className="px-2 py-1.5 font-mono font-semibold text-cyan-100">{alarm.code}</td>
                <td className="px-2 py-1.5 text-cyan-100/80">
                  {CATEGORY_EN[alarm.role]}
                  <span className="ml-1 text-[10px] text-cyan-200/40">{ROLE_HINT[alarm.role]}</span>
                </td>
                <td className="px-2 py-1.5 text-cyan-100/70">{alarm.status}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function IncidentLineage({
  result,
  lineage,
  selectedRows,
  onOpen,
  onLocate,
}: {
  result: SimulatorResult
  lineage: SimulatorIncident | null
  selectedRows: InventoryEventRow[]
  onOpen: (id: string | null) => void
  onLocate: (row: InventoryEventRow) => void
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-cyan-200/55">Alarm Lineage View</div>
        <div className="text-[13px] font-semibold">告警血缘</div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {result.incidents.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onOpen(lineage?.id === item.id ? null : item.id)
              const match = selectedRows.find((row) => item.members.some((alarm) => alarm.id === row.alarmId || alarm.device === row.device))
              if (match) onLocate(match)
            }}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left",
              lineage?.id === item.id ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-white/4 hover:border-cyan-300/25",
            )}
          >
            <div className="text-[12px] font-bold text-cyan-50">{item.titleZh}</div>
            <div className="text-[10px] text-cyan-200/50">{item.title}</div>
            <div className="mt-1 font-mono text-[11px] text-cyan-100/80">
              {item.incidentId} · {item.device} · {item.merged} alarms · {item.confidence}%
            </div>
          </button>
        ))}
      </div>

      {lineage ? (
        <div className="mt-3 rounded-lg border border-cyan-400/20 bg-[#07101f]/80 px-3 py-3">
          <div className="text-[10px] font-bold uppercase text-cyan-200/50">Original Alarms → Selected Pipeline → Incident</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {lineage.members.slice(0, 16).map((alarm) => (
              <span key={alarm.id} className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-100/80">
                {alarm.device} {alarm.code}
              </span>
            ))}
            {lineage.members.length > 16 ? (
              <span className="text-[10px] text-cyan-200/45">+{lineage.members.length - 16}</span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            {lineage.rules.map((rule, index) => (
              <span key={rule.key} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5">
                  {rule.zh} · {rule.en}
                </span>
                {index < lineage.rules.length - 1 ? <span className="text-cyan-300/70">→</span> : null}
              </span>
            ))}
            <span className="text-cyan-300/70">→</span>
            <span className="rounded-full border border-[#e53935]/40 bg-[#e53935]/15 px-2 py-0.5 font-semibold text-[#ff8a80]">
              {lineage.titleZh}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-cyan-200/45">点击上方收敛结果，查看从原始告警到当前路径输出的追溯链路。</p>
      )}
    </div>
  )
}
