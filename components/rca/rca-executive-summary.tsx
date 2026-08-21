import { Target } from "lucide-react"

export function RcaExecutiveSummary() {
  return (
    <section id="rca-executive-summary" className="rounded-lg border border-[var(--p1)]/30 bg-[var(--p1)]/5 px-4 py-3 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <Target className="size-4 text-[var(--p1)]" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">RCA Executive Summary</h2>
          <p className="text-[10px] text-muted-foreground">根因分析执行摘要</p>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-foreground">
        系统通过<strong className="text-[var(--p1)]">告警收敛</strong>、
        <strong>影响链路</strong>、<strong>时间关联</strong>和<strong>变更分析</strong>，
        定位 <strong className="text-[var(--p1)]">UPS-A01 Battery Failure</strong> 为唯一根因。
      </p>
    </section>
  )
}
