"use client"

import { ChevronDown } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { cn } from "@/lib/utils"
import type { ImpactChainNode } from "@/data/scenarios"

const statusStyle: Record<
  ImpactChainNode["status"],
  { ring: string; bg: string; label: string }
> = {
  root: { ring: "border-[var(--p1)]/60", bg: "bg-[var(--p1)]/15", label: "根因" },
  impacted: { ring: "border-[var(--p2)]/50", bg: "bg-[var(--p2)]/12", label: "受影响" },
  normal: { ring: "border-primary/40", bg: "bg-primary/10", label: "正常" },
}

export function ScenarioImpactChain({ compact = false }: { compact?: boolean }) {
  const { scenario } = useDemoScenario()

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {scenario.impactChain.map((node, i) => {
        const s = statusStyle[node.status]
        return (
          <div key={node.id} className="flex items-center gap-1.5">
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-center",
                s.ring,
                s.bg,
                compact ? "min-w-[88px]" : "min-w-[100px]",
              )}
            >
              <div
                className={cn(
                  "font-semibold",
                  node.status === "root" ? "text-[var(--p1)]" : "text-foreground",
                  compact ? "text-[11px]" : "text-[12px]",
                )}
              >
                {node.label}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{node.sub}</div>
            </div>
            {i < scenario.impactChain.length - 1 ? (
              <ChevronDown className="size-4 shrink-0 rotate-[-90deg] text-primary" aria-hidden />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
