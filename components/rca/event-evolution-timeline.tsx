"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Focus,
  Pause,
  Pin,
  Play,
  Plus,
  RotateCcw,
  Server,
  Sparkles,
  Trash2,
  UserRoundCheck,
} from "lucide-react"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"
import { Panel } from "@/components/primitives"
import {
  buildEventEvolution,
  expandOptionsFor,
  formatEvolutionClock,
  lifecycleForChains,
  playbackStatus,
  twinFocusAtCursor,
  ALARM_CLASS_META,
  type ConvergenceStageDetail,
  type DeviceAlarmBar,
  type DeviceLifecycleDetail,
  type EvolutionLayer,
  type EvolutionNode,
  type EventEvolutionModel,
  type LifecycleBar,
} from "@/lib/event-evolution"
import type { ScenarioModel } from "@/data/scenarios/types"
import { cn } from "@/lib/utils"

export function EventEvolutionTimeline({
  scenario,
  externalAddChainId,
  onExternalAddConsumed,
  cursorSec: controlledCursor,
  onCursorSecChange,
}: {
  scenario: ScenarioModel
  /** Candidate / twin can request adding an asset into the reconstruction timeline. */
  externalAddChainId?: string | null
  onExternalAddConsumed?: () => void
  /** Optional controlled playback cursor (seconds from origin) for Time Sync. */
  cursorSec?: number
  onCursorSecChange?: (sec: number) => void
}) {
  const model = useMemo(() => buildEventEvolution(scenario), [scenario])
  const [internalCursor, setInternalCursor] = useState(0)
  const cursorSec = controlledCursor ?? internalCursor
  const cursorRef = useRef(cursorSec)
  cursorRef.current = cursorSec
  const setCursorSec = (value: number | ((prev: number) => number)) => {
    const next = typeof value === "function" ? value(cursorRef.current) : value
    cursorRef.current = next
    if (controlledCursor === undefined) setInternalCursor(next)
    onCursorSecChange?.(next)
  }
  const [playing, setPlaying] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [chainIds, setChainIds] = useState<string[]>(model.defaultChainIds)
  const [pinned, setPinned] = useState<string[]>([])
  const [focusChainId, setFocusChainId] = useState<string | null>(model.defaultChainIds[0] ?? null)
  const [expandOpen, setExpandOpen] = useState(false)
  const [expandedLifeId, setExpandedLifeId] = useState<string | null>(null)
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null)
  const [alarmChainId, setAlarmChainId] = useState<string | null>(null)
  const [openConvStage, setOpenConvStage] = useState<string | null>("raw")

  useEffect(() => {
    if (controlledCursor === undefined) setInternalCursor(0)
    onCursorSecChange?.(0)
    setPlaying(false)
    setExpandedId(null)
    setChainIds(model.defaultChainIds)
    setPinned([])
    setFocusChainId(model.defaultChainIds[0] ?? null)
    setExpandOpen(false)
    setExpandedLifeId(null)
    setSelectedAlarmId(null)
    setAlarmChainId(null)
    setOpenConvStage("raw")
    // Reset only when scenario / chain defaults change — not on every cursor callback identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, model.defaultChainIds])

  useEffect(() => {
    if (!externalAddChainId) return
    addChain(externalAddChainId)
    onExternalAddConsumed?.()
  }, [externalAddChainId])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setCursorSec((prev) => {
        const next = prev + 3
        if (next >= model.endSec) {
          setPlaying(false)
          return model.endSec
        }
        return next
      })
    }, 140)
    return () => window.clearInterval(timer)
  }, [playing, model.endSec])

  const twinFocus = useMemo(
    () => twinFocusAtCursor(model, cursorSec, expandedId, chainIds, alarmChainId),
    [model, cursorSec, expandedId, chainIds, alarmChainId],
  )
  const status = useMemo(() => playbackStatus(model, cursorSec, chainIds), [model, cursorSec, chainIds])
  const life = useMemo(() => lifecycleForChains(model, chainIds), [model, chainIds])
  const expandOpts = useMemo(() => expandOptionsFor(model, focusChainId), [model, focusChainId])

  const originAbs = useMemo(() => {
    const [h = 0, m = 0, s = 0] = model.originClock.split(":").map(Number)
    return h * 3600 + m * 60 + s
  }, [model.originClock])
  const cursorLabel = formatEvolutionClock(originAbs + cursorSec)

  const ordered = useMemo(
    () =>
      [...model.physical, ...model.convergence, ...model.reasoning, ...model.investigation].sort(
        (a, b) => a.t0 - b.t0,
      ),
    [model],
  )
  const currentIndex = ordered.findIndex((n) => n.t0 > cursorSec) - 1

  function addChain(id: string) {
    setChainIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setFocusChainId(id)
  }

  function removeChain(id: string) {
    if (pinned.includes(id)) return
    setChainIds((prev) => prev.filter((item) => item !== id))
    if (focusChainId === id) setFocusChainId(null)
  }

  function togglePin(id: string) {
    setPinned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function jumpToNode(delta: number) {
    setPlaying(false)
    const idx = Math.max(0, Math.min(ordered.length - 1, Math.max(0, currentIndex) + delta))
    const node = ordered[idx]
    if (!node) return
    setCursorSec(node.t0)
    setExpandedId(node.id)
  }

  const focusAsset = model.topologyCatalog.find((a) => a.chainId === focusChainId)

  return (
    <Panel
      id="event-evolution-timeline"
      title="证据重建工作台"
      subtitle="Evidence Reconstruction Workspace"
      description="查看证据 · 展开收敛 · 扩展拓扑 · 重建传播 · 验证推理 · 确认结论"
      bodyClassName="p-0"
    >
      {/* Playback */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="text-[11px] font-semibold text-foreground">
          Dynamic Propagation Playback
          <span className="ml-1.5 font-normal text-muted-foreground">动态传播回放</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <IconBtn label="Previous" onClick={() => jumpToNode(-1)}>
            <ChevronLeft className="size-3.5" />
          </IconBtn>
          <IconBtn label={playing ? "Pause" : "Play"} primary onClick={() => setPlaying((v) => !v)}>
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </IconBtn>
          <IconBtn label="Next" onClick={() => jumpToNode(1)}>
            <ChevronRight className="size-3.5" />
          </IconBtn>
          <IconBtn
            label="Reset"
            onClick={() => {
              setPlaying(false)
              setCursorSec(0)
              setExpandedId(null)
            }}
          >
            <RotateCcw className="size-3.5" />
          </IconBtn>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-extrabold tabular text-foreground">{cursorLabel}</span>
          <input
            type="range"
            min={0}
            max={model.endSec}
            value={cursorSec}
            onChange={(e) => {
              setPlaying(false)
              setCursorSec(Number(e.target.value))
            }}
            className="h-1.5 min-w-[160px] flex-1 accent-[var(--primary)]"
            aria-label="Time cursor"
          />
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-3">
          <StatusChip zh="当前传播阶段" en="Stage" value={status.stage} />
          <StatusChip zh="影响设备" en="Devices" value={status.devices.join(" · ")} />
          <StatusChip zh="影响服务" en="Service" value={status.service} />
        </div>
      </div>

      {/* Topology Expansion */}
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div>
            <div className="text-[12px] font-semibold text-foreground">拓扑扩展时间线</div>
            <div className="text-[10px] text-muted-foreground">Topology Expansion · Add To Timeline</div>
          </div>
          <button
            type="button"
            onClick={() => setExpandOpen((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:border-primary/40"
          >
            <Plus className="size-3.5" />
            Add To Timeline
            <ChevronDown className={cn("size-3 transition", expandOpen && "rotate-180")} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {chainIds.map((id) => {
            const asset = model.topologyCatalog.find((a) => a.chainId === id)
            if (!asset) return null
            const isFocus = focusChainId === id
            const isPinned = pinned.includes(id)
            return (
              <div
                key={id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px]",
                  isFocus ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-muted/20 text-foreground",
                )}
              >
                <button type="button" onClick={() => setFocusChainId(id)} className="font-semibold">
                  {asset.label}
                </button>
                <button type="button" title="Focus Chain" onClick={() => setFocusChainId(id)} className="text-muted-foreground hover:text-foreground">
                  <Focus className="size-3" />
                </button>
                <button type="button" title="Pin Asset" onClick={() => togglePin(id)} className={cn(isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  <Pin className="size-3" />
                </button>
                <button type="button" title="Remove From Timeline" onClick={() => removeChain(id)} className="text-muted-foreground hover:text-[var(--p1)]">
                  <Trash2 className="size-3" />
                </button>
              </div>
            )
          })}
        </div>

        {expandOpen ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ExpandList
              title="Add Upstream"
              titleZh="添加上游"
              items={expandOpts.upstream.filter((i) => !chainIds.includes(i.chainId))}
              onAdd={addChain}
            />
            <ExpandList
              title="Add Downstream"
              titleZh="添加下游"
              items={expandOpts.downstream.filter((i) => !chainIds.includes(i.chainId))}
              onAdd={addChain}
            />
            <ExpandList
              title="Add Related Asset"
              titleZh="添加相关资产"
              items={expandOpts.related.filter((i) => !chainIds.includes(i.chainId))}
              onAdd={addChain}
            />
          </div>
        ) : null}

        {/* P2 recommendations */}
        <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/15 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            AI Recommended Related Assets
            <span className="font-normal text-muted-foreground">
              {focusAsset ? `for ${focusAsset.label}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {model.recommendations
              .filter((item) => !chainIds.includes(item.chainId))
              .map((item) => (
                <button
                  key={item.chainId}
                  type="button"
                  onClick={() => addChain(item.chainId)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/8 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/15"
                >
                  <Plus className="size-3" />
                  {item.label}
                </button>
              ))}
            {model.recommendations.every((item) => chainIds.includes(item.chainId)) ? (
              <span className="text-[10px] text-muted-foreground">推荐资产已全部加入时间线</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 4-layer timeline */}
      <div className="grid gap-0 border-b border-border lg:grid-cols-2 xl:grid-cols-4">
        <LayerColumn
          id="inv-layer-physical"
          layer="physical"
          titleZh="真实事件"
          titleEn="Physical Event"
          icon={<Server className="size-3.5" />}
          nodes={model.physical}
          cursorSec={cursorSec}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onSeek={(sec, id) => {
            setPlaying(false)
            setCursorSec(sec)
            setExpandedId(id)
          }}
        />
        <LayerColumn
          id="inv-journey-convergence"
          layer="convergence"
          titleZh="AI 收敛"
          titleEn="Convergence Pipeline"
          icon={<Bot className="size-3.5" />}
          nodes={model.convergence}
          cursorSec={cursorSec}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onSeek={(sec, id) => {
            setPlaying(false)
            setCursorSec(sec)
            setExpandedId(id)
          }}
          className="border-t border-border lg:border-l lg:border-t-0"
        />
        <LayerColumn
          id="inv-journey-ai-reasoning"
          layer="reasoning"
          titleZh="AI 推理"
          titleEn="AI Reasoning"
          icon={<Brain className="size-3.5" />}
          nodes={model.reasoning}
          cursorSec={cursorSec}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onSeek={(sec, id) => {
            setPlaying(false)
            setCursorSec(sec)
            setExpandedId(id)
          }}
          className="border-t border-border xl:border-l xl:border-t-0"
        />
        <LayerColumn
          id="inv-journey-verification"
          layer="investigation"
          titleZh="人工核验"
          titleEn="Human Verification"
          icon={<UserRoundCheck className="size-3.5" />}
          nodes={model.investigation}
          cursorSec={cursorSec}
          expandedId={expandedId}
          onToggle={setExpandedId}
          onSeek={(sec, id) => {
            setPlaying(false)
            setCursorSec(sec)
            setExpandedId(id)
          }}
          className="border-t border-border lg:border-l xl:border-t-0"
        />
      </div>

      {/* Lifecycle Gantt */}
      <LifecycleGantt
        model={model}
        bars={life}
        endSec={model.endSec}
        cursorSec={cursorSec}
        expandedLifeId={expandedLifeId}
        selectedAlarmId={selectedAlarmId}
        openConvStage={openConvStage}
        onToggleLife={(chainId) => {
          setExpandedLifeId((prev) => (prev === chainId ? null : chainId))
          setFocusChainId(chainId)
          setSelectedAlarmId(null)
          setAlarmChainId(null)
          setOpenConvStage("raw")
        }}
        onSelectAlarm={(alarm, chainId) => {
          setSelectedAlarmId(alarm.id)
          setAlarmChainId(chainId)
          setFocusChainId(chainId)
          setPlaying(false)
          setCursorSec(alarm.t0)
          // Link Investigation Timeline — open first verification step
          const inv = model.investigation[0]
          if (inv) setExpandedId(inv.id)
        }}
        onOpenConvStage={setOpenConvStage}
      />

      {/* Twin sync */}
      <div className="border-t border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <div className="text-[11px] font-semibold text-foreground">数字孪生同步高亮</div>
            <div className="text-[10px] text-muted-foreground">Twin Sync · 传播路径随游标 / 选中证据联动</div>
          </div>
          <span className="font-mono text-[11px] tabular text-muted-foreground">{cursorLabel}</span>
        </div>
        <TwinSchematic
          mode="impact"
          showDomainHeat={false}
          hops={model.hops.filter((h) => chainIds.includes(h.chainId))}
          selectedHop={twinFocus.selectedHop}
          activeHops={twinFocus.activeHops}
          markSelectedAsAlarm={Boolean(twinFocus.selectedHop)}
          compact
          subtitle={`${model.rootCauseZh} · Evidence Reconstruction`}
        />
      </div>

      <p className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">{model.conclusion}</p>
    </Panel>
  )
}

function StatusChip({ zh, en, value }: { zh: string; en: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
      <div className="text-[9px] text-muted-foreground">
        {zh} · {en}
      </div>
      <div className="truncate text-[11px] font-semibold text-foreground">{value}</div>
    </div>
  )
}

function ExpandList({
  title,
  titleZh,
  items,
  onAdd,
}: {
  title: string
  titleZh: string
  items: { chainId: string; label: string; labelZh: string }[]
  onAdd: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="text-[10px] font-semibold text-foreground">{titleZh}</div>
      <div className="mb-1 text-[9px] text-muted-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="text-[10px] text-muted-foreground">无可添加项</div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={`${title}-${item.chainId}`}>
              <button
                type="button"
                onClick={() => onAdd(item.chainId)}
                className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-left text-[10px] hover:bg-muted/40"
              >
                <span>
                  <span className="font-semibold text-foreground">+ {item.label}</span>
                  <span className="ml-1 text-muted-foreground">{item.labelZh}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LayerColumn({
  id,
  layer,
  titleZh,
  titleEn,
  icon,
  nodes,
  cursorSec,
  expandedId,
  onToggle,
  onSeek,
  className,
}: {
  id?: string
  layer: EvolutionLayer
  titleZh: string
  titleEn: string
  icon: ReactNode
  nodes: EvolutionNode[]
  cursorSec: number
  expandedId: string | null
  onToggle: (id: string | null) => void
  onSeek: (sec: number, id: string) => void
  className?: string
}) {
  const tone =
    layer === "physical"
      ? "bg-[#e53935]"
      : layer === "convergence"
        ? "bg-[#0288d1]"
        : layer === "reasoning"
          ? "bg-[#7b1fa2]"
          : "bg-primary"

  return (
    <section id={id} className={cn("scroll-mt-[88px] bg-card p-3", className)}>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <div className="text-[12px] font-semibold text-foreground">{titleZh}</div>
          <div className="text-[9px] text-muted-foreground">{titleEn}</div>
        </div>
      </div>
      <ol className="relative space-y-2 border-l border-border/80 pl-3">
        {nodes.map((node) => {
          const reached = node.t0 <= cursorSec
          const open = expandedId === node.id
          return (
            <li key={node.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[17px] top-2 size-2.5 rounded-full border-2 border-card",
                  tone,
                  !reached && "opacity-40",
                )}
              />
              <button
                type="button"
                onClick={() => {
                  onSeek(node.t0, node.id)
                  onToggle(open ? null : node.id)
                }}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                  open ? "border-primary/40 bg-primary/5" : "border-border bg-muted/15 hover:border-primary/30",
                  !reached && "opacity-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-[10px] font-bold tabular text-muted-foreground">{node.time}</div>
                  <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
                </div>
                <div className="mt-0.5 text-[12px] font-semibold text-foreground">{node.titleZh}</div>
                <div className="text-[10px] text-muted-foreground">{node.title}</div>
                {node.badge ? (
                  <span className="mt-1.5 inline-flex rounded-md border border-border bg-background px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                    {node.badgeZh ? `${node.badgeZh} · ${node.badge}` : node.badge}
                  </span>
                ) : null}
              </button>
              {open ? <NodeExpand node={node} /> : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function NodeExpand({ node }: { node: EvolutionNode }) {
  if (node.convergence) {
    const c = node.convergence
    return (
      <div className="mt-1.5 space-y-2 rounded-lg border border-border bg-background/90 p-2.5 text-[10px]">
        <div className="font-semibold text-foreground">
          {c.fromCount} {c.kind === "storm" ? "Raw Alarms" : c.kind === "correlation" ? "Candidate Events" : "Candidate Causes"}
        </div>
        <div className="space-y-1 border-y border-dashed border-border py-2">
          {c.samples.map((sample, i) => (
            <div key={`${sample.code}-${i}`} className="flex gap-2">
              <span className="w-[52px] shrink-0 font-mono tabular text-muted-foreground">{sample.time}</span>
              <span className="min-w-0">
                <span className="font-semibold text-foreground">{sample.device}</span>
                <span className="mt-0.5 block truncate text-muted-foreground">{sample.title}</span>
              </span>
            </div>
          ))}
          {c.moreCount > 0 ? (
            <div className="text-muted-foreground">(+{c.moreCount})</div>
          ) : null}
        </div>
        <div>
          <div className="font-bold text-muted-foreground">Collapsed By</div>
          <div className="mt-0.5 text-foreground">{c.collapsedBy.join(" · ")}</div>
        </div>
        <div className="font-semibold text-primary">
          ↓ {c.resultLabelZh}
          <span className="ml-1 font-normal text-muted-foreground">{c.resultLabel}</span>
        </div>
        {c.rootCauseZh ? (
          <div className="rounded-md border border-[#e53935]/30 bg-[#e53935]/8 px-2 py-1.5 text-[#e53935]">
            Root Cause · {c.rootCauseZh}
          </div>
        ) : null}
        {c.candidateCauses && c.kind !== "root" ? (
          <div>
            <div className="font-bold text-muted-foreground">Candidate Causes</div>
            <ul className="mt-1 space-y-0.5">
              {c.candidateCauses.slice(0, 5).map((item) => (
                <li key={item} className="text-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  if (node.physical) {
    const blocks = [
      { zh: "原始告警", en: "Raw Alarms", items: node.physical.rawAlarms },
      { zh: "聚合事件", en: "Aggregated Events", items: node.physical.aggregatedEvents },
      { zh: "影响资产", en: "Affected Assets", items: node.physical.affectedAssets },
      { zh: "相关证据", en: "Related Evidence", items: node.physical.relatedEvidence },
    ]
    return (
      <div className="mt-1.5 space-y-2 rounded-lg border border-border bg-background/90 p-2.5">
        {blocks.map((block) => (
          <div key={block.en}>
            <div className="text-[9px] font-bold text-muted-foreground">
              {block.zh} · {block.en}
            </div>
            <ul className="mt-1 space-y-0.5">
              {block.items.map((item) => (
                <li key={item} className="text-[10px] text-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  if (node.reasoning) {
    return (
      <div className="mt-1.5 space-y-1.5 rounded-lg border border-border bg-background/90 p-2.5 text-[10px]">
        {node.reasoning.confidence != null ? (
          <div className="font-semibold text-foreground">Confidence · {node.reasoning.confidence}%</div>
        ) : null}
        <p className="text-foreground">{node.reasoning.detail}</p>
        <ul className="space-y-0.5">
          {node.reasoning.evidence.map((item) => (
            <li key={item} className="text-muted-foreground">
              · {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (node.investigation) {
    const inv = node.investigation
    return (
      <div className="mt-1.5 space-y-1.5 rounded-lg border border-border bg-background/90 p-2.5 text-[10px]">
        <div className="inline-flex items-center gap-1 font-semibold text-foreground">
          {inv.status === "confirmed" ? (
            <CheckCircle2 className="size-3.5 text-primary" />
          ) : (
            <CircleDashed className="size-3.5 text-[#c9a227]" />
          )}
          {inv.status}
        </div>
        <p className="text-foreground">{inv.finding}</p>
        <p className="text-muted-foreground">Next · {inv.nextAction}</p>
      </div>
    )
  }

  return null
}

function LifecycleGantt({
  model,
  bars,
  endSec,
  cursorSec,
  expandedLifeId,
  selectedAlarmId,
  openConvStage,
  onToggleLife,
  onSelectAlarm,
  onOpenConvStage,
}: {
  model: EventEvolutionModel
  bars: LifecycleBar[]
  endSec: number
  cursorSec: number
  expandedLifeId: string | null
  selectedAlarmId: string | null
  openConvStage: string | null
  onToggleLife: (chainId: string) => void
  onSelectAlarm: (alarm: DeviceAlarmBar, chainId: string) => void
  onOpenConvStage: (id: string | null) => void
}) {
  const span = Math.max(endSec, 1)
  const selectedAlarm =
    expandedLifeId && selectedAlarmId
      ? model.deviceDetails[expandedLifeId]?.alarms.find((a) => a.id === selectedAlarmId)
      : null

  return (
    <div className="border-b border-border px-4 py-3">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-foreground">设备生命周期</div>
          <div className="text-[10px] text-muted-foreground">
            Device Lifecycle · 保留设备生命线 · 展开后按报警码单线条时长
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-5 rounded-sm bg-[#0288d1]" /> 设备生命线
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-px w-5 bg-[#fb8c00]" /> 报警码生命线
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {bars.map((bar) => {
          const left = (bar.startSec / span) * 100
          const width = Math.max(5, ((bar.endSec - bar.startSec) / span) * 100)
          const active = bar.startSec <= cursorSec
          const open = expandedLifeId === bar.chainId
          const detail = model.deviceDetails[bar.chainId]
          return (
            <div key={bar.id} className="rounded-lg border border-border/70 bg-card/40">
              <button
                type="button"
                onClick={() => onToggleLife(bar.chainId)}
                className="grid w-full grid-cols-[110px_minmax(0,1fr)_52px] items-center gap-2 px-2 py-1.5 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
                    <span className="truncate text-[11px] font-semibold text-foreground">{bar.label}</span>
                  </div>
                  <div className="truncate pl-4 text-[9px] text-muted-foreground">{bar.labelZh}</div>
                </div>
                <div className="relative h-7 rounded-md bg-muted/40">
                  <div
                    className={cn(
                      "absolute top-1 flex h-5 items-center overflow-hidden rounded-md px-1.5 text-[9px] font-bold text-white",
                      bar.isRoot ? "bg-[#e53935]" : "bg-[#0288d1]",
                      !active && "opacity-35",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="truncate">Duration {bar.durationMin} min</span>
                  </div>
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 w-px bg-[var(--p1)]"
                    style={{ left: `${(cursorSec / span) * 100}%` }}
                  />
                </div>
                <div className="text-right font-mono text-[10px] tabular text-muted-foreground">{bar.durationMin}m</div>
              </button>

              {open && detail ? (
                <DeviceLifecycleExpand
                  detail={detail}
                  endSec={endSec}
                  cursorSec={cursorSec}
                  selectedAlarmId={selectedAlarmId}
                  openConvStage={openConvStage}
                  onSelectAlarm={(alarm) => onSelectAlarm(alarm, bar.chainId)}
                  onOpenConvStage={onOpenConvStage}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {selectedAlarm && expandedLifeId ? (
        <EvidencePanel
          alarm={selectedAlarm}
          detail={model.deviceDetails[expandedLifeId]!}
          rootCauseZh={model.rootCauseZh}
        />
      ) : null}
    </div>
  )
}

function DeviceLifecycleExpand({
  detail,
  endSec,
  cursorSec,
  selectedAlarmId,
  openConvStage,
  onSelectAlarm,
  onOpenConvStage,
}: {
  detail: DeviceLifecycleDetail
  endSec: number
  cursorSec: number
  selectedAlarmId: string | null
  openConvStage: string | null
  onSelectAlarm: (alarm: DeviceAlarmBar) => void
  onOpenConvStage: (id: string | null) => void
}) {
  const span = Math.max(endSec, 1)
  const codeLanes = useMemo(() => {
    const map = new Map<string, DeviceAlarmBar[]>()
    for (const alarm of detail.alarms) {
      const list = map.get(alarm.code) ?? []
      list.push(alarm)
      map.set(alarm.code, list)
    }
    return [...map.entries()]
      .map(([code, list]) => {
        const sorted = [...list].sort((a, b) => a.t0 - b.t0)
        const startSec = sorted[0]!.t0
        const endSecLane = Math.max(...sorted.map((a) => a.t0 + a.durationSec))
        const primary = sorted[0]!
        return {
          code,
          startSec,
          durationSec: Math.max(20, endSecLane - startSec),
          count: list.length,
          primary,
          classification: primary.classification,
        }
      })
      .sort((a, b) => a.startSec - b.startSec || a.code.localeCompare(b.code))
  }, [detail.alarms])

  return (
    <div className="space-y-3 border-t border-border/70 py-3 pl-5 pr-2 sm:pl-8">
      <div>
        <div className="mb-1.5 px-1 text-[10px] font-semibold text-foreground">
          ▼ 报警码生命线
          <span className="ml-1.5 font-normal text-muted-foreground">
            Alarm Code · 单线条 · 相对设备缩进 · {detail.label}
          </span>
        </div>
        <div className="space-y-1">
          {codeLanes.map((lane) => {
            const meta = ALARM_CLASS_META[lane.classification]
            const left = (lane.startSec / span) * 100
            const width = Math.max(4, (lane.durationSec / span) * 100)
            const selected = selectedAlarmId === lane.primary.id || detail.alarms.some(
              (a) => a.code === lane.code && a.id === selectedAlarmId,
            )
            const durationLabel =
              lane.durationSec >= 60 ? `${Math.round(lane.durationSec / 60)}m` : `${lane.durationSec}s`
            return (
              <button
                key={lane.code}
                type="button"
                onClick={() => onSelectAlarm(lane.primary)}
                className={cn(
                  "grid w-full grid-cols-[148px_minmax(0,1fr)_44px] items-center gap-2 rounded-md px-1 py-1 text-left",
                  selected && "bg-primary/8 ring-1 ring-primary/25",
                )}
              >
                <div className="min-w-0 pl-1">
                  <div className="truncate font-mono text-[10px] font-semibold text-foreground">{lane.code}</div>
                  <div className="font-mono text-[9px] tabular text-muted-foreground">
                    {lane.primary.time}
                    {lane.count > 1 ? ` · ×${lane.count}` : ""}
                  </div>
                </div>
                <div className="relative h-4 rounded-sm bg-muted/25">
                  <div
                    className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: meta.color }}
                    title={`${lane.code} · ${durationLabel} · ${meta.en}`}
                  />
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 w-px bg-[var(--p1)]/70"
                    style={{ left: `${(cursorSec / span) * 100}%` }}
                  />
                </div>
                <div className="text-right font-mono text-[10px] tabular text-muted-foreground">{durationLabel}</div>
              </button>
            )
          })}
        </div>
      </div>

      <ConvergenceExpansion
        stages={detail.convergence}
        openId={openConvStage}
        onToggle={onOpenConvStage}
      />

      <EvidenceTrace steps={detail.evidenceTrace} />
    </div>
  )
}

function ConvergenceExpansion({
  stages,
  openId,
  onToggle,
}: {
  stages: ConvergenceStageDetail[]
  openId: string | null
  onToggle: (id: string | null) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 p-2.5">
      <div className="mb-2 text-[10px] font-semibold text-foreground">
        Convergence Expansion
        <span className="ml-1.5 font-normal text-muted-foreground">收敛展开</span>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-foreground">
        {stages.map((stage, index) => (
          <span key={stage.id} className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggle(openId === stage.id ? null : stage.id)}
              className={cn(
                "rounded-md border px-2 py-1",
                openId === stage.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card",
              )}
            >
              {stage.countLabel}
            </button>
            {index < stages.length - 1 ? <span className="text-muted-foreground">↓</span> : null}
          </span>
        ))}
      </div>
      {stages.map((stage) => {
        if (openId !== stage.id) return null
        return (
          <div key={stage.id} className="rounded-md border border-border bg-card p-2 text-[10px]">
            <div className="font-semibold text-foreground">
              {stage.titleZh} · {stage.title}
            </div>
            <div className="mt-1 text-muted-foreground">Rules · {stage.rules.join(" · ")}</div>
            {stage.filterReasons.length > 0 ? (
              <div className="mt-1">
                <div className="font-bold text-muted-foreground">Filter Reasons</div>
                <ul className="mt-0.5 space-y-0.5">
                  {stage.filterReasons.map((reason) => (
                    <li key={reason} className="text-foreground">
                      · {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-1">
              <div className="font-bold text-muted-foreground">Items</div>
              <ul className="mt-0.5 space-y-0.5">
                {stage.items.map((item) => (
                  <li key={item} className="text-foreground">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EvidenceTrace({ steps }: { steps: DeviceLifecycleDetail["evidenceTrace"] }) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 p-2.5">
      <div className="mb-2 text-[10px] font-semibold text-foreground">
        Evidence Trace
        <span className="ml-1.5 font-normal text-muted-foreground">证据链路</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-start gap-2 text-[10px]">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[9px] font-bold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-foreground">
                {step.labelZh} · {step.label}
              </div>
              <div className="text-muted-foreground">{step.detail}</div>
              {index < steps.length - 1 ? <div className="text-muted-foreground">↓</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function EvidencePanel({
  alarm,
  detail,
  rootCauseZh,
}: {
  alarm: DeviceAlarmBar
  detail: DeviceLifecycleDetail
  rootCauseZh: string
}) {
  const meta = ALARM_CLASS_META[alarm.classification]
  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="mb-1 text-[10px] font-semibold text-foreground">
        Evidence Panel
        <span className="ml-1.5 font-normal text-muted-foreground">已联动 Digital Twin · Investigation Timeline</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: meta.color }}>
          {meta.en}
        </span>
        <span className="font-mono text-[11px] font-bold text-foreground">{alarm.code}</span>
        <span className="text-[10px] text-muted-foreground">{alarm.time}</span>
        <span className="text-[10px] text-muted-foreground">{alarm.device}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-foreground">{alarm.message}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3 text-[10px]">
        <div>
          <div className="font-bold text-muted-foreground">Rules</div>
          <div className="text-foreground">{alarm.rules.join(" · ")}</div>
        </div>
        <div>
          <div className="font-bold text-muted-foreground">Alarm Group</div>
          <div className="text-foreground">{alarm.groupCode ?? alarm.code}</div>
        </div>
        <div>
          <div className="font-bold text-muted-foreground">Root Cause</div>
          <div className="text-foreground">{rootCauseZh}</div>
        </div>
      </div>
      {alarm.filterReason ? (
        <p className="mt-2 text-[10px] text-muted-foreground">Filter · {alarm.filterReason}</p>
      ) : null}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Trace · {detail.evidenceTrace.map((s) => s.labelZh).join(" → ")}
      </p>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  label,
  primary,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md border",
        primary
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

