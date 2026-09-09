"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowDown,
  ChevronDown,
  GitBranch,
  Network,
  Plus,
  Radar,
  Waves,
} from "lucide-react"
import { Panel } from "@/components/primitives"
import type { ScenarioModel } from "@/data/scenarios/types"
import {
  buildTopologyImpactModel,
  candidatesToAdd,
  defaultVisibleIds,
  exploreFromSeed,
  formatImpactClock,
  impactAtCursor,
  LAYER_META,
  type ImpactExplorerNode,
  type ImpactLayer,
  type ScopeBucketKey,
} from "@/lib/topology-impact-explorer"
import { cn } from "@/lib/utils"

type ViewMode = "sankey" | "tree"

export function TopologyImpactExplorer({
  scenario,
  cursorSec,
}: {
  scenario: ScenarioModel
  /** Synced from Event Evolution Timeline playback cursor. */
  cursorSec: number
}) {
  const model = useMemo(() => buildTopologyImpactModel(scenario), [scenario])
  const [seedId, setSeedId] = useState(model.seedDefaults[0] ?? model.nodes[0]?.id ?? "")
  const [visibleIds, setVisibleIds] = useState<string[]>(() => defaultVisibleIds(model, seedId))
  const [view, setView] = useState<ViewMode>("sankey")
  const [explored, setExplored] = useState(true)
  const [openScope, setOpenScope] = useState<ScopeBucketKey | null>(null)
  const [addMenu, setAddMenu] = useState<"upstream" | "downstream" | "related" | null>(null)

  useEffect(() => {
    const nextSeed = model.seedDefaults[0] ?? model.nodes[0]?.id ?? ""
    setSeedId(nextSeed)
    setVisibleIds(defaultVisibleIds(model, nextSeed))
    setExplored(true)
    setOpenScope(null)
    setAddMenu(null)
    setView("sankey")
  }, [model])

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds])
  const exploration = useMemo(() => exploreFromSeed(model, seedId, visibleSet), [model, seedId, visibleSet])
  const snapshot = useMemo(
    () => impactAtCursor(model, seedId, visibleSet, cursorSec),
    [model, seedId, visibleSet, cursorSec],
  )
  const addCandidates = useMemo(
    () => candidatesToAdd(model, seedId, visibleSet),
    [model, seedId, visibleSet],
  )
  const clock = formatImpactClock(model.originAbs, cursorSec)
  const seedOptions = model.nodes.filter((n) => n.kind === "spine" || n.kind === "related")

  function runExplore() {
    setVisibleIds(defaultVisibleIds(model, seedId))
    setExplored(true)
    setAddMenu(null)
    setOpenScope(null)
  }

  function addNode(id: string) {
    setVisibleIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setExplored(true)
    setAddMenu(null)
  }

  const reachedIds = new Set(snapshot.reached.map((n) => n.id))

  return (
    <Panel
      id="topology-impact-explorer"
      title="拓扑影响探索器"
      subtitle="Topology Impact Explorer"
      description="回答「影响了谁？」· 从任意节点探索上下游 · 与时间线 Time Sync 联动"
      bodyClassName="p-0"
    >
      {/* Seed + Explore */}
      <div className="flex flex-wrap items-end gap-2 border-b border-border px-4 py-3">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-[10px] font-semibold text-muted-foreground">
            启动节点 · Seed Node
          </span>
          <select
            value={seedId}
            onChange={(e) => {
              setSeedId(e.target.value)
              setExplored(false)
            }}
            className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-semibold text-foreground"
          >
            {seedOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.labelZh} / {node.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={runExplore}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
        >
          <Radar className="size-3.5" />
          Explore Impact
        </button>
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          <ViewTab active={view === "sankey"} onClick={() => setView("sankey")} icon={<Waves className="size-3" />}>
            Sankey View
          </ViewTab>
          <ViewTab active={view === "tree"} onClick={() => setView("tree")} icon={<GitBranch className="size-3" />}>
            Tree View
          </ViewTab>
        </div>
      </div>

      {/* Time Sync strip */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Network className="size-3.5 text-primary" />
          Time Sync
          <span className="font-normal text-muted-foreground">与 Event Evolution Timeline 联动</span>
        </span>
        <span className="font-mono text-[13px] font-extrabold tabular text-foreground">{clock}</span>
        <span className="text-muted-foreground">
          当前前沿：
          <span className="ml-1 font-semibold text-foreground">
            {snapshot.frontier ? `${snapshot.frontier.labelZh} / ${snapshot.frontier.label}` : "尚未扩散"}
          </span>
        </span>
        <span className="ml-auto text-muted-foreground">
          已达 {snapshot.blast.reachedCount}/{snapshot.blast.totalCount} 节点
        </span>
      </div>

      {!explored ? (
        <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
          选择启动节点后点击 <span className="font-semibold text-foreground">Explore Impact</span> 查看上下游影响路径
        </div>
      ) : (
        <>
          {/* Path views */}
          <div className="border-b border-border px-4 py-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[12px] font-bold text-foreground">
                  Upstream → Seed → Downstream
                </div>
                <div className="text-[10px] text-muted-foreground">
                  上游依赖 · 启动节点 · 下游影响 · 相关资产可追加
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <AddBtn
                  label="Add Upstream"
                  zh="添加上游"
                  disabled={addCandidates.upstream.length === 0}
                  open={addMenu === "upstream"}
                  onToggle={() => setAddMenu((v) => (v === "upstream" ? null : "upstream"))}
                  options={addCandidates.upstream}
                  onPick={addNode}
                />
                <AddBtn
                  label="Add Downstream"
                  zh="添加下游"
                  disabled={addCandidates.downstream.length === 0}
                  open={addMenu === "downstream"}
                  onToggle={() => setAddMenu((v) => (v === "downstream" ? null : "downstream"))}
                  options={addCandidates.downstream}
                  onPick={addNode}
                />
                <AddBtn
                  label="Add Related Asset"
                  zh="添加相关资产"
                  disabled={addCandidates.related.length === 0}
                  open={addMenu === "related"}
                  onToggle={() => setAddMenu((v) => (v === "related" ? null : "related"))}
                  options={addCandidates.related}
                  onPick={addNode}
                />
              </div>
            </div>

            {view === "sankey" ? (
              <SankeyView
                path={exploration.path}
                related={exploration.visible.filter((n) => n.kind === "related")}
                seedId={seedId}
                reachedIds={reachedIds}
              />
            ) : (
              <TreeView
                upstream={exploration.upstream}
                seed={exploration.seed}
                downstream={exploration.downstream}
                related={exploration.visible.filter((n) => n.kind === "related")}
                reachedIds={reachedIds}
              />
            )}
          </div>

          {/* Impact Scope */}
          <div className="border-b border-border px-4 py-3">
            <div className="mb-2 text-[12px] font-bold text-foreground">
              Impact Scope
              <span className="ml-1.5 font-normal text-muted-foreground">影响范围 · 点击数字展开明细</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {snapshot.scope.map((bucket) => {
                const open = openScope === bucket.key
                return (
                  <div key={bucket.key} className="rounded-lg border border-border bg-muted/15">
                    <button
                      type="button"
                      onClick={() => setOpenScope(open ? null : bucket.key)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                    >
                      <div>
                        <div className="text-[10px] font-semibold text-foreground">{bucket.zh}</div>
                        <div className="text-[9px] text-muted-foreground">{bucket.en}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[20px] font-extrabold tabular text-foreground">
                          {bucket.items.length}
                        </span>
                        <ChevronDown className={cn("size-3.5 text-muted-foreground transition", open && "rotate-180")} />
                      </div>
                    </button>
                    {open ? (
                      <ul className="space-y-1.5 border-t border-border/70 px-3 py-2">
                        {bucket.items.length === 0 ? (
                          <li className="text-[11px] text-muted-foreground">当前时刻尚无影响</li>
                        ) : (
                          bucket.items.map((item) => (
                            <li key={item.id} className="rounded-md bg-card/80 px-2 py-1.5">
                              <div className="text-[11px] font-semibold text-foreground">{item.labelZh}</div>
                              <div className="text-[10px] text-muted-foreground">{item.label}</div>
                              <div className="mt-0.5 text-[10px] text-muted-foreground">{item.detailZh}</div>
                            </li>
                          ))
                        )}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Blast Radius */}
          <div className="px-4 py-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="text-[12px] font-bold text-foreground">
                  Blast Radius
                  <span className="ml-1.5 font-normal text-muted-foreground">影响半径 · 随时间轴动态计算</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {snapshot.blast.summaryZh} · {snapshot.blast.summaryEn}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <BlastMeter
                zh="物理影响"
                en="Physical Impact"
                value={snapshot.blast.physical}
                count={snapshot.blast.physicalLabel}
                color="#e53935"
              />
              <BlastMeter
                zh="服务影响"
                en="Service Impact"
                value={snapshot.blast.service}
                count={snapshot.blast.serviceLabel}
                color="#fb8c00"
              />
              <BlastMeter
                zh="业务影响"
                en="Business Impact"
                value={snapshot.blast.business}
                count={snapshot.blast.businessLabel}
                color="#3dcd58"
              />
            </div>
          </div>
        </>
      )}
    </Panel>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function AddBtn({
  label,
  zh,
  disabled,
  open,
  onToggle,
  options,
  onPick,
}: {
  label: string
  zh: string
  disabled: boolean
  open: boolean
  onToggle: () => void
  options: ImpactExplorerNode[]
  onPick: (id: string) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
          disabled
            ? "cursor-not-allowed border-border text-muted-foreground/50"
            : "border-border text-foreground hover:border-primary/40",
          open && "border-primary/40 bg-primary/10 text-primary",
        )}
      >
        <Plus className="size-3" />
        {label}
        <span className="font-normal opacity-70">{zh}</span>
      </button>
      {open && options.length > 0 ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-md border border-border bg-card p-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPick(opt.id)}
              className="flex w-full flex-col rounded px-2 py-1.5 text-left hover:bg-muted/60"
            >
              <span className="text-[11px] font-semibold text-foreground">{opt.labelZh}</span>
              <span className="text-[10px] text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SankeyView({
  path,
  related,
  seedId,
  reachedIds,
}: {
  path: ImpactExplorerNode[]
  related: ImpactExplorerNode[]
  seedId: string
  reachedIds: Set<string>
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        {path.map((node, index) => {
          const reached = reachedIds.has(node.id)
          const isSeed = node.id === seedId
          return (
            <div key={node.id} className="flex min-w-0 flex-1 items-center">
              <div
                className={cn(
                  "min-w-[120px] flex-1 rounded-lg border px-3 py-2.5 transition",
                  isSeed && "ring-2 ring-primary/50",
                  reached
                    ? "border-primary/35 bg-primary/8"
                    : "border-dashed border-border bg-muted/10 opacity-55",
                )}
              >
                <LayerBadge layer={node.layer} />
                <div className="mt-1 text-[12px] font-bold text-foreground">{node.label}</div>
                <div className="text-[10px] text-muted-foreground">{node.labelZh}</div>
                <div className="mt-1 text-[9px] text-muted-foreground">{reached ? "已进入影响" : "尚未到达"}</div>
              </div>
              {index < path.length - 1 ? (
                <div className="relative mx-0.5 flex h-full w-8 shrink-0 items-center justify-center">
                  <div
                    className={cn(
                      "h-2 w-full rounded-full",
                      reachedIds.has(path[index + 1]!.id)
                        ? "bg-gradient-to-r from-primary/70 to-[var(--p2)]/70"
                        : "bg-border",
                    )}
                  />
                  <ArrowDown className="absolute size-3 rotate-[-90deg] text-muted-foreground" />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {related.length > 0 ? (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold text-muted-foreground">Related Assets · 相关资产</div>
          <div className="flex flex-wrap gap-2">
            {related.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "rounded-md border px-2.5 py-1.5",
                  reachedIds.has(node.id) ? "border-border bg-card" : "border-dashed border-border opacity-55",
                )}
              >
                <div className="text-[11px] font-semibold text-foreground">{node.label}</div>
                <div className="text-[9px] text-muted-foreground">{node.labelZh}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TreeView({
  upstream,
  seed,
  downstream,
  related,
  reachedIds,
}: {
  upstream: ImpactExplorerNode[]
  seed: ImpactExplorerNode
  downstream: ImpactExplorerNode[]
  related: ImpactExplorerNode[]
  reachedIds: Set<string>
}) {
  const rows = [...upstream, seed, ...downstream]
  return (
    <div className="mx-auto max-w-md space-y-0">
      {rows.map((node, index) => {
        const reached = reachedIds.has(node.id)
        const isSeed = node.id === seed.id
        return (
          <div key={node.id} className="flex flex-col items-center">
            <div
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-center",
                isSeed && "ring-2 ring-primary/50",
                reached ? "border-primary/35 bg-primary/8" : "border-dashed border-border opacity-55",
              )}
            >
              <LayerBadge layer={node.layer} className="justify-center" />
              <div className="text-[13px] font-bold text-foreground">{node.label}</div>
              <div className="text-[10px] text-muted-foreground">{node.labelZh}</div>
              <div className="mt-0.5 text-[9px] text-muted-foreground">{node.detailZh}</div>
            </div>
            {index < rows.length - 1 ? (
              <ArrowDown
                className={cn(
                  "my-1 size-4",
                  reachedIds.has(rows[index + 1]!.id) ? "text-primary" : "text-muted-foreground/40",
                )}
              />
            ) : null}
          </div>
        )
      })}
      {related.length > 0 ? (
        <div className="mt-3 border-t border-border/70 pt-3">
          <div className="mb-1.5 text-center text-[10px] font-semibold text-muted-foreground">Related</div>
          <div className="flex flex-wrap justify-center gap-2">
            {related.map((node) => (
              <span
                key={node.id}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold",
                  reachedIds.has(node.id) ? "border-border" : "border-dashed opacity-55",
                )}
              >
                {node.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LayerBadge({ layer, className }: { layer: ImpactLayer; className?: string }) {
  const meta = LAYER_META[layer]
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
        {meta.zh} · {meta.en}
      </span>
    </div>
  )
}

function BlastMeter({
  zh,
  en,
  value,
  count,
  color,
}: {
  zh: string
  en: string
  value: number
  count: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-foreground">{zh}</div>
          <div className="text-[9px] text-muted-foreground">{en}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[18px] font-extrabold tabular" style={{ color }}>
            {value}%
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">{count}</div>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(value, value > 0 ? 6 : 0)}%`, background: color }}
        />
      </div>
    </div>
  )
}
