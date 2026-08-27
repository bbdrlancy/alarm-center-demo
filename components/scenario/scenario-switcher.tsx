"use client"

import { ChevronDown } from "lucide-react"
import { scenarioSelectOptions } from "@/data/scenarios"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { cn } from "@/lib/utils"

export function ScenarioSwitcher() {
  const { mode, scenario, setScenarioMode } = useDemoScenario()

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="demo-scenario-select">
        Demo Scenario
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: scenario.color }}
          aria-hidden
        />
        <span className="hidden text-[10px] font-semibold text-muted-foreground md:inline">
          Demo Scenario
        </span>
        <div className="relative">
          <select
            id="demo-scenario-select"
            value={mode}
            onChange={(e) => setScenarioMode(e.target.value as typeof mode)}
            className={cn(
              "max-w-[140px] appearance-none rounded-md border border-border bg-panel py-1 pl-2 pr-7",
              "text-[11px] font-semibold text-foreground sm:max-w-none",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
          >
            {scenarioSelectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
