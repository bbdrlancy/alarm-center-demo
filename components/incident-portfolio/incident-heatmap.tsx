import { domainHeatmap, type RiskLevel } from "@/lib/incident-portfolio-data"
import { Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

const riskColors: Record<RiskLevel, { bg: string; border: string; text: string }> = {
  Critical: { bg: "bg-[var(--p1)]/18", border: "border-[var(--p1)]/45", text: "text-[var(--p1)]" },
  High: { bg: "bg-[var(--p2)]/15", border: "border-[var(--p2)]/40", text: "text-[var(--p2)]" },
  Medium: { bg: "bg-[var(--info)]/12", border: "border-[var(--info)]/35", text: "text-[var(--info)]" },
  Low: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
}

export function IncidentHeatmap() {
  return (
    <Panel
      title="Incident Heatmap"
      subtitle="事故热力图"
      description="Incident count and critical concentration by infrastructure domain"
      bodyClassName="p-4"
    >
      <div id="incident-heatmap" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {domainHeatmap.map((cell) => {
          const colors = riskColors[cell.riskLevel]
          return (
            <div
              key={cell.domain}
              className={cn(
                "rounded-xl border px-4 py-5 text-center transition-shadow hover:shadow-sm",
                colors.bg,
                colors.border,
              )}
            >
              <div className="text-sm font-bold text-foreground">{cell.domain}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Incidents</div>
                  <div className="text-xl font-extrabold tabular text-foreground">
                    {cell.incidentCount}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted-foreground">Critical</div>
                  <div className={cn("text-xl font-extrabold tabular", colors.text)}>
                    {cell.criticalCount}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  colors.bg,
                  colors.text,
                )}
              >
                {cell.riskLevel} Risk
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
