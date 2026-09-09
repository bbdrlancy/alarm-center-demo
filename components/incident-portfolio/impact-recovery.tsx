"use client"

import type { ReactNode } from "react"
import { ArrowDown, Building2, GitBranch, Server, ShieldAlert } from "lucide-react"
import { Panel } from "@/components/primitives"
import type { CommandIncident } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

function BreakdownCard({
  icon,
  title,
  subtitle,
  heading,
  detail,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  heading: string
  detail: string
}) {
  return (
    <article className="rounded-lg border border-border bg-muted/25 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <div>
          <div className="text-[12px] font-semibold text-foreground">{title}</div>
          <div className="text-[10px] text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="text-[13px] font-semibold leading-snug text-foreground">{heading}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  )
}

export function ImpactRecovery({
  incident,
  className,
  stacked,
}: {
  incident: CommandIncident
  className?: string
  stacked?: boolean
}) {
  return (
    <Panel
      title="影响分析"
      subtitle="Impact Analysis"
      icon={<GitBranch className="size-4" />}
      className={cn("bg-card", className)}
      bodyClassName="p-3"
    >
      <div className={cn("grid gap-3", !stacked && "xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]")}>
        <div>
          <div className="mb-2 text-[11px] font-semibold text-foreground">影响拆解 · Impact Breakdown</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <BreakdownCard
              icon={<Building2 className="size-3.5" />}
              title="业务影响"
              subtitle="Business Impact"
              heading={incident.impactBreakdown.business.title}
              detail={incident.impactBreakdown.business.detail}
            />
            <BreakdownCard
              icon={<ShieldAlert className="size-3.5" />}
              title="服务影响"
              subtitle="Service Impact"
              heading={incident.impactBreakdown.service.title}
              detail={incident.impactBreakdown.service.detail}
            />
            <BreakdownCard
              icon={<Server className="size-3.5" />}
              title="资产影响"
              subtitle="Asset Impact"
              heading={incident.impactBreakdown.asset.title}
              detail={incident.impactBreakdown.asset.detail}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold text-foreground">传播路径 · Propagation Path</div>
          <ol className="rounded-lg border border-border bg-card px-3 py-3">
            {incident.propagationPath.map((node, index) => (
              <li key={node} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-center text-[12px] font-semibold",
                    index === 0
                      ? "bg-[var(--p1)]/12 text-[var(--p1)]"
                      : index === incident.propagationPath.length - 1
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-foreground",
                  )}
                >
                  {node}
                </div>
                {index < incident.propagationPath.length - 1 ? (
                  <ArrowDown className="my-1 size-3.5 text-muted-foreground" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Panel>
  )
}
