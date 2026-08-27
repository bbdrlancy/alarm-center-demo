"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react"
import {
  domainTopologies,
  explorerViews,
  getAncestors,
  getBreadcrumb,
  impactLegend,
  incidentAutoExpand,
  isDomainNode,
  kgEdges,
  kgLayout,
  nodeVisibleInView,
  subtreeMatchesView,
  twinNodes,
  viewAutoExpand,
  viewChains,
  type ExplorerView,
  type TwinExplorerNode,
} from "@/lib/digital-twin-explorer-data"
import { CrossLayerView } from "@/components/knowledge-center/cross-layer-view"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { DomainTopologyExplorer } from "@/components/knowledge-center/domain-topology-explorer"
import { NodeDrillDownPanel } from "@/components/knowledge-center/node-drill-down-panel"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

function ViewChainStrip({ view }: { view: Exclude<ExplorerView, "knowledge"> }) {
  const chain = viewChains[view]
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 rounded-md border border-border bg-card px-2.5 py-2">
      <span className="mr-1 text-[9px] font-semibold text-muted-foreground">Quick Map ·</span>
      {chain.map((id, i) => {
        const node = twinNodes[id]
        if (!node) return null
        const s = impactStyles(node.role)
        return (
          <div key={id} className="flex items-center gap-1">
            <span className={cn("rounded border px-2 py-0.5 text-[9px] font-semibold", s.row, s.badge)}>
              {node.label}
            </span>
            {i < chain.length - 1 ? <ChevronRight className="size-3 text-muted-foreground" /> : null}
          </div>
        )
      })}
    </div>
  )
}

function impactStyles(role: "root" | "impacted" | "healthy") {
  if (role === "root")
    return { row: "border-[var(--p1)]/50 bg-[var(--p1)]/8", badge: "bg-[var(--p1)]/15 text-[var(--p1)]" }
  if (role === "impacted")
    return { row: "border-[var(--p2)]/50 bg-[var(--p2)]/8", badge: "bg-[var(--p2)]/15 text-[var(--p2)]" }
  return { row: "border-border bg-card", badge: "bg-primary/12 text-primary" }
}

function ImpactPathStrip() {
  const { scenario } = useDemoScenario()
  const { incident, impactChain, digitalTwin } = scenario

  return (
    <div className="rounded-lg border border-[var(--p1)]/30 bg-[var(--p1)]/5 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[var(--p1)]">事故传播路径 · Incident Impact Path</span>
        <span className="rounded bg-[var(--p1)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[var(--p1)]">
          Root Cause: {digitalTwin.rootCauseLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {impactChain.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-semibold",
                node.status === "root"
                  ? "border-[var(--p1)] bg-[var(--p1)]/15 text-[var(--p1)]"
                  : "border-[var(--p2)] bg-[var(--p2)]/12 text-[var(--p2)]",
              )}
            >
              {node.label}
            </span>
            {i < impactChain.length - 1 ? (
              <ChevronDown className="size-3 rotate-[-90deg] text-muted-foreground" />
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[9px] text-muted-foreground">{incident.id} · {digitalTwin.focus}</p>
    </div>
  )
}

function KnowledgeGraphView({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const neighbors = useMemo(() => {
    if (!selectedId) return null
    const set = new Set<string>([selectedId])
    for (const e of kgEdges) {
      if (e.from === selectedId) set.add(e.to)
      if (e.to === selectedId) set.add(e.from)
    }
    return set
  }, [selectedId])

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-panel/40 p-3">
      <svg viewBox="0 0 880 220" className="h-auto w-full min-w-[640px]">
        {kgEdges.map((edge, i) => {
          const from = kgLayout.find((n) => n.id === edge.from)
          const to = kgLayout.find((n) => n.id === edge.to)
          if (!from || !to) return null
          const lit = !neighbors || (neighbors.has(edge.from) && neighbors.has(edge.to))
          return (
            <g key={i} opacity={lit ? 1 : 0.25}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--border)" strokeWidth={1.5} />
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 4}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {edge.label}
              </text>
            </g>
          )
        })}
        {kgLayout.map((pos) => {
          const node = twinNodes[pos.id]
          if (!node) return null
          const isSel = selectedId === pos.id
          const lit = !neighbors || neighbors.has(pos.id)
          return (
            <g
              key={pos.id}
              opacity={lit ? 1 : 0.25}
              className="cursor-pointer"
              onClick={() => onSelect(pos.id)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSel ? 24 : 20}
                className="fill-white"
                stroke={node.role === "root" ? "var(--p1)" : node.role === "impacted" ? "var(--p2)" : "var(--primary)"}
                strokeWidth={isSel ? 2.5 : 1.5}
              />
              <text x={pos.x} y={pos.y + 36} textAnchor="middle" className="fill-foreground text-[8px] font-medium">
                {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ExplorerRow({
  node,
  depth,
  view,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  node: TwinExplorerNode
  depth: number
  view: ExplorerView
  expanded: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const isDomain = isDomainNode(node.id)
  const hasTopology = !!domainTopologies[node.id]
  const hasChildren = (node.children?.length ?? 0) > 0
  const canExpand = hasChildren || hasTopology
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const s = impactStyles(node.role)
  const visibleChildren = (node.children ?? []).filter((cid) => subtreeMatchesView(cid, view))

  if (!nodeVisibleInView(node, view) && visibleChildren.length === 0 && !hasTopology) return null

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-md border py-1.5 pr-2 transition-colors",
          s.row,
          isSelected && "ring-2 ring-primary ring-offset-1",
          node.role === "root" && "border-l-[3px] border-l-[var(--p1)]",
        )}
        style={{ marginLeft: depth * 16 }}
      >
        <button
          type="button"
          onClick={() => canExpand && onToggle(node.id)}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-secondary/80",
            !canExpand && "invisible",
          )}
          aria-label={isExpanded ? "折叠" : "展开"}
        >
          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              node.role === "root" ? "bg-[var(--p1)]" : node.role === "impacted" ? "bg-[var(--p2)]" : "bg-primary",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-foreground">{node.label}</div>
            <div className="truncate text-[9px] text-muted-foreground">{node.zh}</div>
          </div>
          <span className={cn("hidden shrink-0 rounded px-1.5 py-0.5 text-[8px] font-medium sm:inline", s.badge)}>
            {isDomain ? "Domain Topology" : node.kind}
          </span>
        </button>
      </div>

      {canExpand && isExpanded ? (
        isDomain && hasTopology ? (
          <DomainTopologyExplorer domainId={node.id} selectedId={selectedId} onSelect={onSelect} />
        ) : (
          <div className="mt-0.5 space-y-0.5 border-l border-border/60 ml-3">
            {visibleChildren.map((cid) => {
              const child = twinNodes[cid]
              if (!child) return null
              return (
                <ExplorerRow
                  key={cid}
                  node={child}
                  depth={depth + 1}
                  view={view}
                  expanded={expanded}
                  selectedId={selectedId}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              )
            })}
          </div>
        )
      ) : null}
    </div>
  )
}

function collectExpandableIds(id: string, view: ExplorerView, out: Set<string>) {
  const node = twinNodes[id]
  if (!node) return
  if (subtreeMatchesView(id, view) || isDomainNode(id)) out.add(id)
  if (node.children) {
    for (const cid of node.children) collectExpandableIds(cid, view, out)
  }
}

export function SpatialModel() {
  const { scenario } = useDemoScenario()
  const [view, setView] = useState<ExplorerView>("spatial")
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(incidentAutoExpand))
  const [selectedId, setSelectedId] = useState<string>("ups-a01")
  const [focusId, setFocusId] = useState<string>("ups-a01")

  const breadcrumb = useMemo(() => getBreadcrumb(focusId), [focusId])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectNode = useCallback((id: string) => {
    if (!twinNodes[id]) return
    setSelectedId(id)
    setFocusId(id)
    const ancestors = getAncestors(id)
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const aid of ancestors) next.add(aid)
      if (isDomainNode(id) || twinNodes[id]?.children?.length) next.add(id)
      const parent = ancestors[ancestors.length - 1]
      if (parent && isDomainNode(parent)) next.add(parent)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const all = new Set<string>()
    collectExpandableIds("dc01", view, all)
    setExpanded(all)
  }, [view])

  const collapseAll = useCallback(() => {
    setExpanded(new Set(["dc01"]))
  }, [])

  const handleViewChange = (v: ExplorerView) => {
    setView(v)
    if (v !== "knowledge") setExpanded(new Set(viewAutoExpand[v]))
  }

  return (
    <Panel
      title="数字孪生"
      subtitle="Digital Twin"
      description={`Digital Twin focus · ${scenario.digitalTwin.focus}`}
      icon={<Building2 className="size-4" />}
      action={
        <div className="flex flex-wrap gap-2 text-[10px]">
          {impactLegend.map((item) => (
            <span key={item.role} className="flex items-center gap-1 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      }
      bodyClassName="space-y-3 p-3 md:p-4"
    >
      <div
        className="rounded-lg border px-3 py-2 text-[11px]"
        style={{
          borderColor: `${scenario.color}40`,
          backgroundColor: `${scenario.color}0a`,
          color: "var(--foreground)",
        }}
      >
        <span className="font-semibold" style={{ color: scenario.color }}>
          {scenario.name}
        </span>
        <span className="text-muted-foreground"> · {scenario.incident.rootCause} · Impact: {scenario.incident.businessImpact}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {explorerViews.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => handleViewChange(v.key)}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-colors",
              view === v.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {v.label}
            <span className="ml-1 opacity-80">{v.en}</span>
          </button>
        ))}
      </div>

      <ImpactPathStrip />
      <CrossLayerView selectedId={selectedId} onSelect={selectNode} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-panel/50 px-3 py-2">
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[10px]">
          <span className="font-semibold text-muted-foreground">Breadcrumb ·</span>
          {breadcrumb.map((node, i) => (
            <span key={node.id} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3 text-border" /> : null}
              <button
                type="button"
                onClick={() => selectNode(node.id)}
                className={cn(
                  "rounded px-1.5 py-0.5 font-medium hover:bg-secondary",
                  focusId === node.id ? "bg-primary/12 text-primary" : "text-foreground",
                )}
              >
                {node.label}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronsUpDown className="size-3" />
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronsDownUp className="size-3" />
            Collapse
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <div className="min-h-[360px] rounded-lg border border-border bg-background/60 p-3">
          {view === "knowledge" ? (
            <KnowledgeGraphView selectedId={selectedId} onSelect={selectNode} />
          ) : (
            <div className="space-y-1">
              <ViewChainStrip view={view} />
              <div className="mb-2 text-[10px] font-semibold text-muted-foreground">
                Level 0 · DC01 — 展开 Domain 查看拓扑链路
              </div>
              <ExplorerRow
                node={twinNodes.dc01}
                depth={0}
                view={view}
                expanded={expanded}
                selectedId={selectedId}
                onToggle={toggleExpand}
                onSelect={selectNode}
              />
            </div>
          )}
        </div>

        {selectedId && twinNodes[selectedId] ? (
          <NodeDrillDownPanel nodeId={selectedId} onClose={() => setSelectedId("")} onNavigate={selectNode} />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-panel/30 p-6 text-center text-[11px] text-muted-foreground">
            点击拓扑节点查看详情
            <br />
            Spatial · Topology · Knowledge Graph Context
          </div>
        )}
      </div>

      <ModuleConclusion>{scenario.digitalTwin.conclusion}</ModuleConclusion>
    </Panel>
  )
}
