"use client"

import { useMemo, useState } from "react"
import { Download, FileText, Loader2, X } from "lucide-react"
import type { CommandIncident } from "@/lib/incident-command"
import { buildIncidentReport, downloadTextFile } from "@/lib/incident-report"
import { cn } from "@/lib/utils"

export function IncidentReportButton({
  incident,
  className,
  compact = false,
}: {
  incident: CommandIncident
  className?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const report = useMemo(() => (open ? buildIncidentReport(incident) : null), [open, incident])

  function handleGenerate() {
    setBusy(true)
    // Allow UI to paint loader before sync build on large payloads.
    window.setTimeout(() => {
      setOpen(true)
      setBusy(false)
    }, 180)
  }

  function handleDownload() {
    const doc = report ?? buildIncidentReport(incident)
    downloadTextFile(doc.fileName, doc.markdown)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60",
          compact ? "px-2.5 py-1.5 text-[11px]" : "w-full px-3 py-2 text-[12px]",
          className,
        )}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
        {busy ? "生成中…" : "生成事故报告"}
        {!compact ? <span className="font-normal opacity-80">Generate Report</span> : null}
      </button>

      {open && report ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-report-title"
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 id="incident-report-title" className="text-sm font-semibold text-foreground">
                  事故分析报告
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {report.titleZh} · {report.incidentId} · {report.generatedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed text-foreground">
                {report.markdown}
              </pre>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
              >
                <Download className="size-3.5" />
                下载 Markdown
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  )
}
