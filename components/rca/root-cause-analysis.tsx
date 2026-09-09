"use client"

import { useMemo } from "react"
import { Crosshair } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { getRootCauseWorkspace } from "@/lib/root-cause-analysis"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

export function RootCauseAnalysis() {
  const { scenario } = useDemoScenario()
  const model = useMemo(() => getRootCauseWorkspace(scenario), [scenario])
  const tone = priorityMeta[scenario.incident.severity]

  return (
    <section
      id="root-cause-analysis"
      className="overflow-hidden rounded-xl border-2 bg-card shadow-card"
      style={{ borderColor: tone.color }}
    >
      <div className="h-1.5" style={{ backgroundColor: tone.color }} />
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid size-9 place-items-center rounded-lg"
            style={{ color: tone.color, backgroundColor: tone.bg }}
          >
            <Crosshair className="size-5" />
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">重点区域 · Key Area</div>
            <h2 className="mt-0.5 text-[18px] font-extrabold text-foreground">根因分析</h2>
            <p className="text-[12px] text-muted-foreground">Root Cause Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Selected Root Cause</div>
          <div className="text-[14px] font-bold text-foreground">{model.rootNameZh}</div>
          <div className="text-[11px] text-muted-foreground">{model.rootName}</div>
        </div>
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        {model.focus.map((card) => (
          <article
            key={card.id}
            className={cn(
              "rounded-lg border px-3 py-3",
              card.id === "confidence"
                ? "border-primary/40 bg-primary/8"
                : "border-border bg-muted/25",
            )}
          >
            <div className="text-[11px] font-semibold text-foreground">{card.zh}</div>
            <div className="text-[10px] text-muted-foreground">{card.en}</div>
            <div
              className="mt-2 text-[22px] font-extrabold tabular leading-none"
              style={card.id === "confidence" ? { color: tone.color } : undefined}
            >
              {card.value}
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
