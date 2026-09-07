"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Share2 } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { graphEdgeLabel, layoutGraphNodes } from "@/lib/scenario-graph-layout"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const groupColor: Record<string, string> = {
  device: "var(--p1)",
  location: "var(--p2)",
  service: "var(--primary)",
  network: "#4aa3ff",
  incident: "#8b6fd4",
}

function neighbors(
  id: string,
  edges: { source: string; target: string }[],
): Set<string> {
  const set = new Set<string>([id])
  for (const e of edges) {
    if (e.source === id) set.add(e.target)
    if (e.target === id) set.add(e.source)
  }
  return set
}

function IncidentMappingStrip() {
  const { scenario } = useDemoScenario()
  const { incident, graph } = scenario

  return (
    <div className="rounded-lg border border-[var(--p1)]/35 bg-[var(--p1)]/5 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[var(--p1)]">
          Current Incident Mapping · {scenario.domain}
        </span>
        <span className="text-[9px] text-muted-foreground">{incident.id}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {graph.mapping.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <span className="rounded-md border border-[var(--p1)] bg-[var(--p1)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--p1)]">
              {label}
            </span>
            {i < graph.mapping.length - 1 ? (
              <ChevronDown className="size-3 rotate-[-90deg] text-[var(--p1)]" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function InstanceRegistry() {
  const { scenario } = useDemoScenario()
  const nodes = useMemo(() => layoutGraphNodes(scenario.graph.nodes), [scenario])
  const highlighted = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes])

  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px]",
            highlighted.has(node.id)
              ? "border-[var(--p1)]/40 bg-[var(--p1)]/5"
              : "border-border bg-card",
          )}
        >
          <span className="font-medium text-foreground">{node.label}</span>
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-medium text-primary">
            instance_of
          </span>
          <span className="text-muted-foreground">{node.category}</span>
        </div>
      ))}
    </div>
  )
}

export function KnowledgeGraph() {
  const { scenario } = useDemoScenario()
  const { graph, incident } = scenario
  const nodes = useMemo(() => layoutGraphNodes(graph.nodes), [graph.nodes])
  const [selected, setSelected] = useState<string | null>(() => nodes[0]?.id ?? null)

  const highlight = useMemo(
    () => (selected ? neighbors(selected, graph.edges) : null),
    [selected, graph.edges],
  )

  return (
    <Panel
      title="知识图谱"
      subtitle="Enterprise Knowledge Graph"
      description="AI 知道了什么？ · 展示具体实例对象及其关联关系"
      icon={<Share2 className="size-4" />}
      action={
        <span className="text-[10px] text-muted-foreground">点击实例 · 高亮邻居</span>
      }
      bodyClassName="space-y-3 p-3 md:p-4"
    >
      <IncidentMappingStrip />

      <div className="overflow-x-auto rounded-lg border border-border bg-panel/50 p-2">
        <svg viewBox="0 0 740 240" className="h-auto w-full min-w-[640px]" role="img" aria-label="Knowledge graph">
          <defs>
            <marker id="kg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--border)" />
            </marker>
          </defs>

          {graph.edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.source)!
            const to = nodes.find((n) => n.id === edge.target)!
            if (!from || !to) return null
            const lit = !highlight || (highlight.has(edge.source) && highlight.has(edge.target))
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            return (
              <g key={i} opacity={lit ? 1 : 0.15}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--border)"
                  strokeWidth={1.5}
                  markerEnd="url(#kg-arrow)"
                />
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[7px]"
                >
                  {graphEdgeLabel(edge.relation)}
                </text>
              </g>
            )
          })}

          {nodes.map((node) => {
            const color = groupColor[node.category] ?? "var(--primary)"
            const lit = !highlight || highlight.has(node.id)
            const isSel = selected === node.id
            const onPath = node.incidentPath
            return (
              <g
                key={node.id}
                opacity={lit ? 1 : 0.25}
                className="cursor-pointer"
                onClick={() => setSelected(node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSel ? 22 : 18}
                  fill={onPath ? "var(--p1)" : "white"}
                  fillOpacity={onPath ? 0.12 : 1}
                  stroke={onPath ? "var(--p1)" : color}
                  strokeWidth={isSel || onPath ? 2.5 : 1.5}
                />
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  className={cn(
                    "fill-foreground text-[8px] font-medium",
                    isSel && "font-bold",
                    onPath && "fill-[var(--p1)]",
                  )}
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + 42}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[6.5px]"
                >
                  {node.category}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          实例对象清单 · Instance Registry
        </div>
        <InstanceRegistry />
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {Object.entries(groupColor).map(([g, c]) => (
          <span key={g} className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: c }} />
            {g}
          </span>
        ))}
      </div>

      <ModuleConclusion>
        {graph.mapping.join("、")} 等实例通过 {graph.edges.map((e) => graphEdgeLabel(e.relation)).join("、")}{" "}
        等关系形成完整推理上下文——GraphRAG 在此图谱上检索路径并完成根因分析（置信度 {incident.confidence}%）。
      </ModuleConclusion>
    </Panel>
  )
}
