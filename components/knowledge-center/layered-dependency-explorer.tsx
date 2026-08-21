"use client"

import { useState } from "react"
import { ChevronDown, GitCompare, Layers, X } from "lucide-react"
import {
  getNodeOrLabel,
  impactPathIds,
  impactPathLabels,
  impactStyles,
  layeredDependencyColumns,
  twinNodes,
} from "@/lib/digital-twin-explorer-data"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const globalImpactPath = new Set(impactPathIds)

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <span key={item} className="rounded border border-border bg-panel px-2 py-0.5 text-[10px]">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground">—</span>
      )}
    </div>
  )
}

function TopologyNodeDetail({
  nodeId,
  onClose,
}: {
  nodeId: string
  onClose: () => void
}) {
  const node = twinNodes[nodeId]
  if (!node) return null
  const s = impactStyles(node.role)
  const d = node.details

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-foreground">{node.label}</div>
          <div className="text-[10px] text-muted-foreground">{node.zh}</div>
          <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium", s.badge)}>
            {node.kind}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="关闭详情"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DetailBlock title="Location · 位置" items={[d.location]} />
        <DetailBlock title="Dependencies · 依赖" items={d.dependencies} />
        <DetailBlock title="Impacts · 影响" items={d.impacts} />
        <DetailBlock title="Alarms · 告警" items={d.relatedAlarms} />
        <DetailBlock title="Incident · 故障" items={d.relatedIncidents} />
        <DetailBlock title="Runbooks · 手册" items={d.relatedRunbooks} />
        <div className="sm:col-span-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Graph Neighbors · 图谱邻居
          </div>
          <div className="flex flex-wrap gap-1">
            {d.graphNeighbors.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1 rounded border border-border bg-panel px-2 py-0.5 text-[10px]"
              >
                <span className="rounded bg-primary/12 px-1 py-0.5 text-[8px] font-medium text-primary">
                  {n.relation}
                </span>
                {n.label}
              </span>
            ))}
            {d.graphNeighbors.length === 0 ? (
              <span className="text-[10px] text-muted-foreground">—</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function DependencyColumn({
  column,
  selectedId,
  onSelect,
}: {
  column: (typeof layeredDependencyColumns)[number]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const columnImpact = new Set(column.impactPath ?? [])

  return (
    <div className="flex flex-col rounded-lg border border-border bg-background/70 p-3">
      <div className="mb-3 border-b border-border/60 pb-2 text-center">
        <div className="text-[12px] font-semibold text-foreground">{column.title}</div>
        <div className="text-[10px] text-muted-foreground">{column.subtitle}</div>
        <p className="mt-1 text-[9px] leading-snug text-muted-foreground">{column.description}</p>
      </div>

      <div className="flex flex-col items-center gap-0">
        {column.chain.map((nodeId, i) => {
          const node = twinNodes[nodeId]
          const meta = node ?? getNodeOrLabel(nodeId)
          const role = node?.role ?? meta.role
          const s = impactStyles(role)
          const isSelected = selectedId === nodeId
          const onImpact = globalImpactPath.has(nodeId) || columnImpact.has(nodeId)
          const isLast = i === column.chain.length - 1

          return (
            <div key={`${column.key}-${nodeId}`} className="flex w-full max-w-[200px] flex-col items-center">
              <button
                type="button"
                onClick={() => node && onSelect(nodeId)}
                disabled={!node}
                className={cn(
                  "relative flex h-[52px] w-full flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center transition-all",
                  s.row,
                  isSelected && "ring-2 ring-primary ring-offset-1",
                  onImpact && "border-l-[3px] border-l-[var(--p1)]",
                  !node && "cursor-default opacity-70",
                )}
              >
                <span className={cn("absolute left-2 top-2 size-1.5 rounded-full", s.dot)} />
                <span className="max-w-full truncate text-[11px] font-semibold leading-tight text-foreground">
                  {meta.label}
                </span>
                {onImpact ? (
                  <span className="mt-0.5 text-[7px] font-medium text-[var(--p1)]">传播路径</span>
                ) : null}
              </button>
              {!isLast ? (
                <div className="flex flex-col items-center py-0.5">
                  <div
                    className={cn("h-2.5 w-px", onImpact && globalImpactPath.has(nodeId) ? "bg-[var(--p1)]" : "bg-border")}
                  />
                  <ChevronDown
                    className={cn(
                      "size-3.5",
                      onImpact && globalImpactPath.has(nodeId) ? "text-[var(--p1)]" : "text-muted-foreground",
                    )}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IncidentImpactOverlay() {
  return (
    <div className="rounded-lg border border-[var(--p1)]/35 bg-[var(--p1)]/5 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[var(--p1)]">
          Incident Impact Overlay · 事故影响叠加
        </span>
        <span className="rounded bg-[var(--p1)]/15 px-1.5 py-0.5 text-[9px] font-medium text-[var(--p1)]">
          Root Cause: UPS-A01
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {impactPathLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-semibold",
                i === 0
                  ? "border-[var(--p1)] bg-[var(--p1)]/15 text-[var(--p1)]"
                  : "border-[var(--p2)] bg-[var(--p2)]/12 text-[var(--p2)]",
              )}
            >
              {label}
            </span>
            {i < impactPathLabels.length - 1 ? (
              <ChevronDown className="size-3 rotate-[-90deg] text-[var(--p1)]" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LayeredDependencyExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>("ups-a01")

  return (
    <Panel
      title="分层依赖探索器"
      subtitle="Layered Dependency Explorer"
      description="Topology Compare View · 三列并排对比供电、制冷与业务依赖链"
      icon={<Layers className="size-4" />}
      action={
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-2 py-1 text-[10px] font-medium text-primary">
          <GitCompare className="size-3" />
          Compare View
        </span>
      }
      bodyClassName="space-y-3 p-3 md:p-4"
    >
      <IncidentImpactOverlay />

      <div className="grid gap-3 lg:grid-cols-3">
        {layeredDependencyColumns.map((col) => (
          <DependencyColumn
            key={col.key}
            column={col}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {selectedId && twinNodes[selectedId] ? (
        <TopologyNodeDetail nodeId={selectedId} onClose={() => setSelectedId(null)} />
      ) : (
        <p className="text-center text-[10px] text-muted-foreground">
          点击任意节点查看 Location · Dependencies · Impacts · Alarms · Incident · Runbooks · Graph Neighbors
        </p>
      )}

      <ModuleConclusion>
        三列依赖链统一垂直展示：供电与制冷从基础设施向下支撑 GPU，业务链展示服务如何依赖底层算力；UPS-A01 根因沿三条链共同影响 AI Training Service。
      </ModuleConclusion>
    </Panel>
  )
}
