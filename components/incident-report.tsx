"use client"

import { useState } from "react"
import { Copy, Download, Mail, Send, FileText, Check, ShieldAlert } from "lucide-react"
import { incidentReport, priorityMeta } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

export function IncidentReport() {
  const [copied, setCopied] = useState(false)
  const meta = priorityMeta[incidentReport.priority]

  const plainText =
    `【${incidentReport.priority}】${incidentReport.title}\n事件编号：${incidentReport.id}\n生成时间：${incidentReport.generatedAt}\n\n` +
    incidentReport.body.map((b) => `# ${b.h}\n${b.t}`).join("\n\n")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const actions = [
    { icon: copied ? Check : Copy, label: copied ? "已复制" : "复制", onClick: handleCopy, primary: true },
    { icon: Download, label: "下载" },
    { icon: Mail, label: "邮件" },
    { icon: Send, label: "Teams" },
  ]

  return (
    <Panel
      title="事故报告"
      subtitle="Incident Report"
      description="一键生成可分享的事故快报，支持跨团队协同通报"
      icon={<FileText className="size-4" />}
    >
      {/* Teams-style card */}
      <div className="overflow-hidden rounded-lg border border-border bg-panel/60">
        <div className="flex items-center gap-3 border-b-2 px-4 py-3" style={{ borderColor: meta.color }}>
          <div
            className="grid size-10 shrink-0 place-items-center rounded-md"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ color: meta.color, backgroundColor: meta.bg }}
              >
                {meta.label}
              </span>
              <span className="tabular text-[11px] text-muted-foreground">{incidentReport.id}</span>
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {incidentReport.title}
            </div>
          </div>
          <span className="hidden shrink-0 text-[11px] text-muted-foreground tabular sm:block">
            {incidentReport.generatedAt}
          </span>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          {incidentReport.body.map((b) => (
            <div key={b.h} className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-3">
              <div className="text-[11px] font-semibold text-primary">{b.h}</div>
              <p className="text-[12px] leading-relaxed text-muted-foreground">{b.t}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card/50 px-4 py-3">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={
                a.primary
                  ? "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  : "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              }
            >
              <a.icon className="size-3.5" />
              {a.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            支持复制、下载与 Teams 分享
          </span>
        </div>
      </div>
      <ModuleConclusion>
        事故快报已就绪，可直接分享至 Teams 或邮件，加速跨团队通报与协同处置。
      </ModuleConclusion>
    </Panel>
  )
}
