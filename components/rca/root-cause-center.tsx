"use client"

import { useMemo } from "react"
import { Crosshair } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { getRootCauseWorkspace } from "@/lib/root-cause-analysis"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

export function RootCauseCenter() {
  const { scenario } = useDemoScenario()
  const model = useMemo(() => getRootCauseWorkspace(scenario), [scenario])
  const tone = priorityMeta[scenario.incident.severity]
  const maxConfidence = Math.max(...model.ranking.map((item) => item.confidence), 1)

  return (
    <section
      id="root-cause-center"
      className="overflow-hidden rounded-xl border-2 bg-card shadow-card"
      style={{ borderColor: tone.color }}
    >
      <div className="h-1.5" style={{ backgroundColor: tone.color }} />

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="border-b border-border p-4 xl:border-b-0 xl:border-r">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Selected Root Cause</div>
          <div className="mt-1 flex items-start gap-2.5">
            <span
              className="mt-0.5 grid size-8 place-items-center rounded-lg"
              style={{ color: tone.color, backgroundColor: tone.bg }}
            >
              <Crosshair className="size-4" />
            </span>
            <div>
              <div className="text-[16px] font-extrabold leading-snug text-foreground">{model.rootNameZh}</div>
              <div className="text-[12px] text-muted-foreground">{model.rootName}</div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {model.focus.map((card) => (
              <article
                key={card.id}
                className={cn(
                  "rounded-lg border px-3 py-2.5",
                  card.id === "confidence" ? "border-primary/40 bg-primary/8" : "border-border bg-muted/25",
                )}
              >
                <div className="text-[10px] font-semibold text-foreground">{card.zh}</div>
                <div className="text-[9px] text-muted-foreground">{card.en}</div>
                <div
                  className="mt-1 text-[18px] font-extrabold tabular leading-none"
                  style={card.id === "confidence" ? { color: tone.color } : undefined}
                >
                  {card.value}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{card.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Candidate Ranking</div>
          <p className="text-[11px] text-muted-foreground">候选排序 · Root Cause Ranking</p>
          <ol className="mt-3 space-y-2.5">
            {model.ranking.map((item, index) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="w-5 font-mono text-[11px] font-bold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-[12px] font-semibold", item.likelyRoot && "text-primary")}>
                      {item.nameZh}
                    </span>
                    <span className="font-mono text-[11px] font-bold tabular">{item.confidence}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", item.likelyRoot ? "bg-primary" : "bg-muted-foreground/40")}
                      style={{ width: `${Math.round((item.confidence / maxConfidence) * 100)}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-px border-t border-border bg-border lg:grid-cols-2">
        <div className="bg-card p-4">
          <div className="text-[12px] font-bold text-foreground">为何是这个根因</div>
          <div className="text-[10px] text-muted-foreground">Why This Root Cause</div>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-foreground">{model.whyThis.zh}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{model.whyThis.en}</p>
          <ul className="mt-3 space-y-1.5">
            {model.factors.map((factor) => (
              <li key={factor.label} className="rounded-md border border-border bg-muted/25 px-3 py-2">
                <div className="text-[11px] font-semibold text-foreground">{factor.label}</div>
                <div className="text-[11px] text-muted-foreground">{factor.detail}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card p-4">
          <div className="text-[12px] font-bold text-foreground">为何不是其他原因</div>
          <div className="text-[10px] text-muted-foreground">Why Not Others</div>
          <div className="mt-2 space-y-2">
            {model.whyNotOthers.map((item) => (
              <article key={item.name} className="rounded-md border border-border bg-muted/25 px-3 py-2">
                <div className="text-[12px] font-semibold text-foreground">{item.nameZh}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground">{item.zh}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
