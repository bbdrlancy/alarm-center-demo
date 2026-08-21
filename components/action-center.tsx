"use client"

import { ClipboardList, BookOpen, Users, CheckCircle2, Circle, Loader } from "lucide-react"
import { actions, actionColumns, priorityMeta } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

const statusMeta = {
  pending: { icon: Circle, color: "var(--muted-foreground)", label: "待处理" },
  "in-progress": { icon: Loader, color: "var(--info)", label: "处理中" },
  done: { icon: CheckCircle2, color: "var(--ok)", label: "已完成" },
} as const

export function ActionCenter() {
  return (
    <Panel
      title="推荐处置动作"
      subtitle="Action Center"
      description="按责任团队自动分派可执行处置任务，加速故障恢复"
      icon={<ClipboardList className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          {actions.length} 项待执行
        </span>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        {actionColumns.map((col) => {
          const items = actions.filter((a) => a.status === col.key)
          const cm = statusMeta[col.key]
          return (
            <div key={col.key} className="flex flex-col rounded-lg border border-border bg-panel">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <cm.icon className="size-3.5" style={{ color: cm.color }} />
                  {col.label}
                  <span className="text-muted-foreground">{col.en}</span>
                </span>
                <span className="rounded bg-card px-1.5 text-[10px] text-muted-foreground tabular">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2.5">
                {items.length === 0 ? (
                  <div className="grid flex-1 place-items-center py-6 text-[11px] text-muted-foreground/60">
                    暂无任务
                  </div>
                ) : (
                  items.map((a) => {
                    const meta = priorityMeta[a.priority]
                    return (
                      <div
                        key={a.id}
                        className="rounded-md border border-border bg-card p-2.5 transition-colors hover:border-primary/40"
                      >
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="tabular text-[10px] text-muted-foreground">{a.id}</span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                          >
                            {a.priority}
                          </span>
                        </div>
                        <div className="text-[12px] font-medium leading-snug text-foreground">
                          {a.name}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="size-3 text-primary" />
                            {a.team}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="size-3 text-primary" />
                            {a.runbook}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ModuleConclusion>
        已生成 5 项分团队处置动作，覆盖供电隔离、业务迁移与设备更换，缩短跨团队协同时间。
      </ModuleConclusion>
    </Panel>
  )
}
