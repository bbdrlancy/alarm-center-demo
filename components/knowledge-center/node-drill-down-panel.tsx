"use client"

import { useState } from "react"
import { ChevronDown, Sparkles, X } from "lucide-react"
import {
  graphragExplainability,
  impactStyles,
  spatialContexts,
  topologyContexts,
  twinNodes,
  type SpatialContext,
} from "@/lib/digital-twin-explorer-data"
import { cn } from "@/lib/utils"

type DetailTab = "spatial" | "topology" | "knowledge"

function SpatialContextView({ ctx }: { ctx: SpatialContext }) {
  const rows: { key: keyof SpatialContext; label: string }[] = [
    { key: "building", label: "Building · 楼栋" },
    { key: "floor", label: "Floor · 楼层" },
    { key: "zone", label: "Zone · 区域" },
    { key: "room", label: "Room · 机房" },
    { key: "rack", label: "Rack · 机架" },
  ]
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between rounded-md border border-border bg-panel px-2.5 py-1.5">
          <span className="text-[10px] text-muted-foreground">{r.label}</span>
          <span className="text-[11px] font-medium text-foreground">{ctx[r.key]}</span>
        </div>
      ))}
    </div>
  )
}

function TopologyContextView({
  upstream,
  downstream,
  current,
}: {
  upstream: string[]
  downstream: string[]
  current: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      {upstream.map((item) => (
        <div
          key={item}
          className="w-full rounded-md border border-border bg-panel px-2.5 py-1.5 text-center text-[10px] text-muted-foreground"
        >
          {item}
        </div>
      ))}
      {upstream.length > 0 ? <ChevronDown className="size-3.5 text-primary" /> : null}
      <div className="w-full rounded-md border border-primary/40 bg-primary/10 px-2.5 py-2 text-center text-[11px] font-semibold text-primary">
        {current}
      </div>
      {downstream.length > 0 ? <ChevronDown className="size-3.5 text-[var(--p2)]" /> : null}
      {downstream.map((item) => (
        <div
          key={item}
          className="w-full rounded-md border border-[var(--p2)]/30 bg-[var(--p2)]/8 px-2.5 py-1.5 text-center text-[10px] text-[var(--p2)]"
        >
          {item}
        </div>
      ))}
    </div>
  )
}

function GraphRagExplain({ nodeId }: { nodeId: string }) {
  const explain = graphragExplainability[nodeId]
  if (!explain) return null
  return (
    <div className="mt-3 rounded-lg border border-primary/25 bg-accent/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground">GraphRAG 可解释性</span>
      </div>
      <p className="mb-2 text-[10px] font-medium text-foreground">{explain.title}</p>
      <div className="space-y-1.5">
        {explain.factors.map((f) => (
          <div key={f.label} className="rounded-md border border-border/60 bg-card px-2 py-1.5">
            <div className="text-[10px] font-semibold text-primary">{f.label}</div>
            <div className="text-[9px] leading-snug text-muted-foreground">{f.detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-md bg-primary/12 px-2.5 py-1.5">
        <span className="text-[10px] text-muted-foreground">最终置信度</span>
        <span className="text-sm font-bold tabular text-primary">{explain.confidence}%</span>
      </div>
    </div>
  )
}

export function NodeDrillDownPanel({
  nodeId,
  onClose,
  onNavigate,
}: {
  nodeId: string
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const [tab, setTab] = useState<DetailTab>("spatial")
  const node = twinNodes[nodeId]
  if (!node) return null

  const s = impactStyles(node.role)
  const d = node.details
  const spatial = spatialContexts[nodeId]
  const topoCtx = topologyContexts[nodeId]

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "spatial", label: "Spatial" },
    { key: "topology", label: "Topology" },
    { key: "knowledge", label: "Knowledge" },
  ]

  return (
    <aside className="flex h-full max-h-[640px] flex-col rounded-lg border border-border bg-card shadow-sm lg:max-h-none">
      <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{node.label}</div>
          <div className="text-[10px] text-muted-foreground">{node.zh}</div>
          <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-medium", s.badge)}>
            {node.kind}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          aria-label="关闭详情"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 px-2 py-2 text-[10px] font-medium transition-colors",
              tab === t.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "spatial" ? (
          spatial ? (
            <SpatialContextView ctx={spatial} />
          ) : (
            <p className="text-[11px] text-muted-foreground">{d.location}</p>
          )
        ) : null}

        {tab === "topology" ? (
          topoCtx ? (
            <TopologyContextView
              upstream={topoCtx.upstream}
              downstream={topoCtx.downstream}
              current={node.label}
            />
          ) : (
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="font-semibold text-muted-foreground">Dependencies · </span>
                {d.dependencies.join(", ") || "—"}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Impacts · </span>
                {d.impacts.join(", ") || "—"}
              </div>
            </div>
          )
        ) : null}

        {tab === "knowledge" ? (
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Graph Neighbors · 关系类型
              </div>
              <div className="space-y-1">
                {d.graphNeighbors.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onNavigate(n.id)}
                    className="flex w-full items-center gap-2 rounded-md border border-border bg-panel px-2 py-1.5 text-left text-[10px] hover:border-primary/40"
                  >
                    <span className="rounded bg-primary/12 px-1 py-0.5 text-[8px] font-medium text-primary">
                      {n.relation}
                    </span>
                    <span className="font-medium text-foreground">{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-[9px] font-semibold text-muted-foreground">Alarm</div>
                <div className="space-y-0.5">
                  {d.relatedAlarms.map((a) => (
                    <div key={a} className="rounded bg-[var(--p1)]/8 px-1.5 py-0.5 text-[9px] text-[var(--p1)]">
                      {a}
                    </div>
                  ))}
                  {d.relatedAlarms.length === 0 ? <span className="text-[9px] text-muted-foreground">—</span> : null}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[9px] font-semibold text-muted-foreground">Incident</div>
                <div className="space-y-0.5">
                  {d.relatedIncidents.map((a) => (
                    <div key={a} className="rounded bg-[var(--p2)]/8 px-1.5 py-0.5 text-[9px] text-[var(--p2)]">
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-semibold text-muted-foreground">Runbook · Change</div>
              <div className="flex flex-wrap gap-1">
                {d.relatedRunbooks.map((r) => (
                  <span key={r} className="rounded border border-border px-1.5 py-0.5 text-[9px]">
                    {r}
                  </span>
                ))}
                <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  CHG-88214
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <GraphRagExplain nodeId={nodeId} />
      </div>
    </aside>
  )
}
