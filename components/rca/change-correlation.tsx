"use client"

import { GitBranch, Wrench, Settings, Cpu, CalendarClock } from "lucide-react"
import { changeRecords, type ChangeRecord } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

const typeIcon: Record<string, typeof Wrench> = {
  Maintenance: Wrench,
  Config: Settings,
  Firmware: Cpu,
  Window: CalendarClock,
}

function riskColor(p: number) {
  if (p >= 70) return "var(--p1)"
  if (p >= 40) return "var(--p2)"
  return "var(--p3)"
}

function statusStyle(status: ChangeRecord["status"]) {
  switch (status) {
    case "已完成":
      return { color: "var(--ok)", bg: "rgba(61,205,88,0.14)" }
    case "进行中":
      return { color: "var(--p2)", bg: "rgba(251,140,0,0.14)" }
    case "已回滚":
      return { color: "var(--muted-foreground)", bg: "var(--secondary)" }
  }
}

export function ChangeCorrelation() {
  return (
    <Panel
      title="变更关联分析"
      subtitle="Change Correlation Analysis"
      description="识别与故障高度相关的近期变更，辅助根因验证"
      icon={<GitBranch className="size-4" />}
      action={
        <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          {changeRecords.length} 项变更
        </span>
      }
    >
      <div className="flex flex-col gap-2.5">
        {changeRecords
          .slice()
          .sort((a, b) => b.probability - a.probability)
          .map((c) => {
            const Icon = typeIcon[c.type] ?? Wrench
            const color = riskColor(c.probability)
            const st = statusStyle(c.status)
            const isTop = c.probability >= 70
            return (
              <div
                key={c.id}
                className={[
                  "rounded-lg border px-3 py-3 transition-colors",
                  isTop ? "border-[var(--p1)]/40 bg-[var(--p1)]/6" : "border-border bg-background/60",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary" style={{ color }}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{c.title}</span>
                      {isTop ? (
                        <span className="shrink-0 rounded bg-[var(--p1)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--p1)]">
                          最可能诱因
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{c.id}</span>
                      <span>· {c.en}</span>
                      <span>· {c.owner}</span>
                      <span>· {c.window}</span>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.color, backgroundColor: st.bg }}
                  >
                    {c.status}
                  </span>
                </div>

                {/* risk score bar */}
                <div className="mt-2.5 flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[10px] text-muted-foreground">相关概率</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.probability}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-bold tabular" style={{ color }}>
                    {c.probability}%
                  </span>
                </div>
              </div>
            )
          })}
      </div>
      <ModuleConclusion>
        UPS 计划性维护（CHG-88214）与故障相关性最高（87%），建议优先核查电池模组更换记录。
      </ModuleConclusion>
    </Panel>
  )
}
