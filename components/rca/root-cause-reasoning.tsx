"use client"

import { useMemo } from "react"
import { Ban, GitCompare, ListOrdered, Scale } from "lucide-react"
import { Panel } from "@/components/primitives"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { getRootCauseWorkspace } from "@/lib/root-cause-analysis"
import { cn } from "@/lib/utils"

export function RootCauseReasoning() {
  const { scenario } = useDemoScenario()
  const model = useMemo(() => getRootCauseWorkspace(scenario), [scenario])
  const maxConfidence = Math.max(...model.ranking.map((item) => item.confidence), 1)

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Panel
        title="为何是这个根因"
        subtitle="Why This Root Cause"
        icon={<Scale className="size-4" />}
        bodyClassName="p-4"
      >
        <p className="text-[13px] font-semibold leading-relaxed text-foreground">{model.whyThis.zh}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{model.whyThis.en}</p>
        <ul className="mt-3 space-y-2">
          {model.factors.map((factor) => (
            <li key={factor.label} className="rounded-md border border-border bg-muted/25 px-3 py-2">
              <div className="text-[11px] font-semibold text-foreground">{factor.label}</div>
              <div className="text-[11px] text-muted-foreground">{factor.detail}</div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="为何不是其他原因"
        subtitle="Why Not Others"
        icon={<Ban className="size-4" />}
        bodyClassName="p-4"
      >
        <div className="space-y-2.5">
          {model.whyNotOthers.map((item) => (
            <article key={item.name} className="rounded-md border border-border bg-muted/25 px-3 py-2.5">
              <div className="text-[12px] font-semibold text-foreground">{item.nameZh}</div>
              <div className="text-[10px] text-muted-foreground">{item.name}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground">{item.zh}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{item.en}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        title="候选根因"
        subtitle="Candidate Root Causes"
        icon={<GitCompare className="size-4" />}
        bodyClassName="p-0 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-semibold">候选 · Candidate</th>
                <th className="px-3 py-2 font-semibold">置信度</th>
                <th className="px-3 py-2 font-semibold">告警</th>
                <th className="px-3 py-2 font-semibold">历史相似</th>
                <th className="px-3 py-2 font-semibold">证据</th>
              </tr>
            </thead>
            <tbody>
              {model.candidates.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-t border-border",
                    item.likelyRoot ? "bg-primary/6" : "bg-card",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-foreground">{item.nameZh}</div>
                    <div className="text-[10px] text-muted-foreground">{item.name}</div>
                    {item.likelyRoot ? (
                      <span className="mt-1 inline-flex rounded-md bg-primary/12 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        Selected Root Cause
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold tabular">{item.confidence}%</td>
                  <td className="px-3 py-2.5 font-mono tabular">{item.alarmCount}</td>
                  <td className="px-3 py-2.5 font-mono tabular">{item.historicalSimilarity}%</td>
                  <td className="px-3 py-2.5 font-mono tabular">{item.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="根因排序"
        subtitle="Root Cause Ranking"
        icon={<ListOrdered className="size-4" />}
        bodyClassName="p-4"
      >
        <ol className="space-y-2.5">
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
      </Panel>
    </div>
  )
}
