"use client"

import { useState } from "react"
import { Clock, ChevronRight } from "lucide-react"
import { evidenceTimeline, type AlarmSeverity } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

const sevColor: Record<AlarmSeverity, string> = {
  Critical: "var(--p1)",
  Major: "var(--p2)",
  Minor: "var(--p3)",
  Warning: "#4aa3ff",
}

export function EvidenceTimeline() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Panel
      title="事件还原"
      subtitle="Event Reconstruction"
      description="按时间顺序还原故障发生过程，帮助理解「发生了什么」"
      icon={<Clock className="size-4" />}
    >
      <ol className="relative flex flex-col">
        {/* vertical axis */}
        <span className="absolute bottom-4 left-[7px] top-2 w-px bg-border" aria-hidden />
        {evidenceTimeline.map((ev, i) => {
          const color = sevColor[ev.severity]
          const isOpen = open === i
          return (
            <li key={ev.time} className="relative pl-7 pb-3 last:pb-0">
              <span
                className="absolute left-0 top-1.5 size-3.5 rounded-full border-2"
                style={{ borderColor: color, backgroundColor: isOpen ? color : "var(--card)" }}
              />
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary/50"
              >
                <span className="tabular text-xs font-semibold" style={{ color }}>
                  {ev.time}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{ev.title}</span>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{ev.zh}</span>
                <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>
              {isOpen ? (
                <div className="ml-2 mt-2 rounded-md border border-border bg-background/60 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">{ev.device}</span>
                    <span
                      className="rounded px-1.5 py-0.5 font-semibold"
                      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
                    >
                      {ev.severity}
                    </span>
                  </div>
                  <p className="mb-2.5 text-[12px] leading-relaxed text-muted-foreground">{ev.detail}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {ev.metrics.map((m) => (
                      <div key={m.label} className="rounded-md border border-border bg-card px-2.5 py-1.5">
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        <div className="text-xs font-semibold tabular text-foreground">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <ModuleConclusion>
        事件从 UPS 故障到业务中断历时约 4 分钟，完整还原过程有助于快速复盘与改进。
      </ModuleConclusion>
    </Panel>
  )
}
