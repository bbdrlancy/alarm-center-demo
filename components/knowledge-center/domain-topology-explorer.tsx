"use client"

import { ChevronDown } from "lucide-react"
import {
  domainTopologies,
  getNodeOrLabel,
  impactPathIds,
  impactStyles,
  twinNodes,
} from "@/lib/digital-twin-explorer-data"
import { cn } from "@/lib/utils"

export function DomainTopologyExplorer({
  domainId,
  selectedId,
  onSelect,
}: {
  domainId: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const topo = domainTopologies[domainId]
  if (!topo) return null

  const impactSet = new Set(topo.impactPath ?? impactPathIds)

  return (
    <div className="my-2 ml-4 rounded-lg border border-primary/20 bg-accent/30 p-3">
      <div className="mb-3 border-b border-border/60 pb-2">
        <div className="text-[11px] font-semibold text-foreground">{topo.title}</div>
        <div className="text-[9px] text-muted-foreground">{topo.subtitle}</div>
      </div>

      <div className="flex flex-col items-center gap-0">
        {topo.chain.map((nodeId, i) => {
          const node = twinNodes[nodeId]
          const meta = node ?? getNodeOrLabel(nodeId)
          const role = node?.role ?? meta.role
          const s = impactStyles(role)
          const isSelected = selectedId === nodeId
          const onImpactPath = impactSet.has(nodeId)
          const isLast = i === topo.chain.length - 1

          return (
            <div key={`${domainId}-${nodeId}-${i}`} className="flex w-full max-w-[280px] flex-col items-center">
              <button
                type="button"
                onClick={() => onSelect(nodeId)}
                className={cn(
                  "relative w-full rounded-lg border px-3 py-2.5 text-center transition-all",
                  s.row,
                  isSelected && "ring-2 ring-primary ring-offset-1",
                  onImpactPath && "border-l-[3px] border-l-[var(--p1)]",
                )}
              >
                <span className={cn("absolute left-2 top-2 size-1.5 rounded-full", s.dot)} />
                <div className={cn("text-[12px] font-semibold", s.text)}>{meta.label}</div>
                {"zh" in meta && meta.zh ? (
                  <div className="text-[9px] text-muted-foreground">{meta.zh}</div>
                ) : null}
                {onImpactPath ? (
                  <span className="mt-1 inline-block rounded bg-[var(--p1)]/12 px-1.5 py-0.5 text-[8px] font-medium text-[var(--p1)]">
                    传播路径
                  </span>
                ) : null}
              </button>
              {!isLast ? (
                <div className="flex flex-col items-center py-0.5">
                  <div className={cn("h-3 w-px", onImpactPath ? "bg-[var(--p1)]" : "bg-border")} />
                  <ChevronDown
                    className={cn("size-3.5", onImpactPath ? "text-[var(--p1)]" : "text-muted-foreground")}
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
