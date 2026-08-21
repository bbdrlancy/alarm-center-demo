"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Share2 } from "lucide-react"
import {
  incidentInstanceMapping,
  knowledgeGraphEdges,
  knowledgeGraphNodes,
} from "@/lib/knowledge-center-data"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const groupColor: Record<string, string> = {
  device: "var(--p1)",
  location: "var(--p2)",
  service: "var(--primary)",
  process: "#4aa3ff",
  knowledge: "#8b6fd4",
}

const incidentPathIds = new Set(incidentInstanceMapping.map((n) => n.id))

function neighbors(id: string): Set<string> {
  const set = new Set<string>([id])
  for (const e of knowledgeGraphEdges) {
    if (e.from === id) set.add(e.to)
    if (e.to === id) set.add(e.from)
  }
  return set
}

function IncidentMappingStrip() {
  return (
    <div className="rounded-lg border border-[var(--p1)]/35 bg-[var(--p1)]/5 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[var(--p1)]">
          Current Incident Mapping · 当前事故实例映射
        </span>
        <span className="text-[9px] text-muted-foreground">实例对象在本体概念上的具体映射</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {incidentInstanceMapping.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1">
            <span className="rounded-md border border-[var(--p1)] bg-[var(--p1)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--p1)]">
              {node.label}
            </span>
            {i < incidentInstanceMapping.length - 1 ? (
              <ChevronDown className="size-3 rotate-[-90deg] text-[var(--p1)]" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function InstanceRegistry() {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {knowledgeGraphNodes.map((node) => (
        <div
          key={node.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px]",
            incidentPathIds.has(node.id)
              ? "border-[var(--p1)]/40 bg-[var(--p1)]/5"
              : "border-border bg-card",
          )}
        >
          <span className="font-medium text-foreground">{node.label}</span>
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-medium text-primary">
            instance_of
          </span>
          <span className="text-muted-foreground">{node.concept}</span>
        </div>
      ))}
    </div>
  )
}

export function KnowledgeGraph() {
  const [selected, setSelected] = useState<string | null>("ups")

  const highlight = useMemo(() => (selected ? neighbors(selected) : null), [selected])

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

          {knowledgeGraphEdges.map((edge, i) => {
            const from = knowledgeGraphNodes.find((n) => n.id === edge.from)!
            const to = knowledgeGraphNodes.find((n) => n.id === edge.to)!
            const lit = !highlight || (highlight.has(edge.from) && highlight.has(edge.to))
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
                  {edge.label}
                </text>
              </g>
            )
          })}

          {knowledgeGraphNodes.map((node) => {
            const color = groupColor[node.group]
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
                  {node.concept}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Instance Registry · 实例对象清单
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
        UPS-A01、UPS-BAT-001、INC-20260820 等实例通过 powered_by、generates、impacts 等关系形成完整推理上下文——GraphRAG
        在此图谱上检索路径并完成根因分析。
      </ModuleConclusion>
    </Panel>
  )
}
