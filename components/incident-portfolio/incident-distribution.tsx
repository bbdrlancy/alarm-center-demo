import { incidentDistribution } from "@/lib/incident-portfolio-data"
import { Panel } from "@/components/primitives"

const total = incidentDistribution.reduce((s, d) => s + d.count, 0)

function PieChart() {
  let cumulative = 0
  const segments = incidentDistribution.map((d) => {
    const start = cumulative
    cumulative += d.count / total
    return { ...d, start, end: cumulative }
  })

  function arcPath(start: number, end: number) {
    const x1 = Math.cos(2 * Math.PI * start - Math.PI / 2)
    const y1 = Math.sin(2 * Math.PI * start - Math.PI / 2)
    const x2 = Math.cos(2 * Math.PI * end - Math.PI / 2)
    const y2 = Math.sin(2 * Math.PI * end - Math.PI / 2)
    const large = end - start > 0.5 ? 1 : 0
    return `M 0 0 L ${x1} ${y1} A 1 1 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <svg viewBox="-1.1 -1.1 2.2 2.2" className="mx-auto size-44 sm:size-52">
      {segments.map((seg) => (
        <path key={seg.domain} d={arcPath(seg.start, seg.end)} fill={seg.color} stroke="white" strokeWidth="0.02" />
      ))}
      <circle r="0.45" fill="var(--card)" />
      <text y="0.05" textAnchor="middle" className="fill-foreground text-[0.22px] font-bold">
        {total}
      </text>
      <text y="0.22" textAnchor="middle" className="fill-muted-foreground text-[0.12px]">
        Total
      </text>
    </svg>
  )
}

export function IncidentDistribution() {
  return (
    <Panel
      title="Incident Distribution"
      subtitle="事故分布"
      description="Share of active incidents by domain"
      bodyClassName="p-4"
    >
      <div id="incident-distribution" className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <PieChart />
        <div className="grid w-full max-w-xs gap-2">
          {incidentDistribution.map((d) => (
            <div
              key={d.domain}
              className="flex items-center justify-between rounded-lg border border-border bg-panel px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-[12px] font-medium text-foreground">{d.domain}</span>
              </div>
              <span className="text-[12px] font-bold tabular text-muted-foreground">
                {d.count}{" "}
                <span className="text-[10px] font-normal">
                  ({Math.round((d.count / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
