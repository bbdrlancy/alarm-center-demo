"use client"

import { ChevronDown } from "lucide-react"
import { crossLayerChain, getNodeOrLabel, impactStyles, twinNodes } from "@/lib/digital-twin-explorer-data"
import { cn } from "@/lib/utils"

const layerColors: Record<string, string> = {
  Space: "bg-primary/12 text-primary",
  Topology: "bg-[var(--p2)]/12 text-[var(--p2)]",
  Business: "bg-[var(--info)]/12 text-[var(--info)]",
  Knowledge: "bg-accent text-foreground",
}

export function CrossLayerView({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2">
        <div className="text-[11px] font-semibold text-foreground">Cross Layer View · 跨层关系视图</div>
        <div className="text-[9px] text-muted-foreground">Space → Topology → Business → Knowledge</div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {crossLayerChain.map((item, i) => {
          const s = impactStyles(item.role)
          const isSel = selectedId === item.id
          const clickable = !!twinNodes[item.id]
          return (
            <div key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect(item.id)}
                className={cn(
                  "flex flex-col items-center rounded-md border px-2 py-1.5 text-center transition-all",
                  s.row,
                  isSel && "ring-2 ring-primary ring-offset-1",
                  !clickable && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "mb-0.5 rounded px-1 py-0.5 text-[7px] font-bold uppercase",
                    layerColors[item.layer],
                  )}
                >
                  {item.layer}
                </span>
                <span className={cn("text-[10px] font-semibold leading-tight", s.text)}>{item.label}</span>
              </button>
              {i < crossLayerChain.length - 1 ? (
                <ChevronDown className="size-3 shrink-0 rotate-[-90deg] text-muted-foreground" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
