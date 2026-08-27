"use client"

import { Sparkles } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { portfolioExecutiveIntro } from "@/data/scenarios"
import { Panel } from "@/components/primitives"

export function PortfolioExecutiveSummary() {
  const { scenario } = useDemoScenario()
  const { incident, portfolio } = scenario

  const lines = [portfolioExecutiveIntro, ...portfolio.summaryLines]

  return (
    <Panel
      title="Executive Summary"
      subtitle="管理层摘要"
      description={`AI-generated overview · Active scenario: ${scenario.name}`}
      icon={<Sparkles className="size-4" />}
      bodyClassName="p-4"
    >
      <div
        id="portfolio-executive-summary"
        className="rounded-lg border px-4 py-4"
        style={{
          borderColor: `${scenario.color}40`,
          backgroundColor: `${scenario.color}0a`,
        }}
      >
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: scenario.color }}>
          AI Portfolio Brief · {incident.id}
        </div>
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[12px] leading-relaxed text-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
