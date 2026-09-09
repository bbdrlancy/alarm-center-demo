"use client"

import { useEffect, useMemo, useState } from "react"
import { IncidentDetailPane } from "@/components/incident-portfolio/incident-detail-pane"
import { IncidentPortfolioList } from "@/components/incident-portfolio/incident-portfolio-list"
import { PortfolioSummaryBar } from "@/components/incident-portfolio/portfolio-summary"
import { ContinueTo } from "@/components/page-flow"
import {
  defaultCommandKey,
  filterCommandPortfolio,
  getCommandIncident,
  getCommandPortfolio,
  type PortfolioFilter,
} from "@/lib/incident-command"
import { rcaHref, type ScenarioKey } from "@/data/scenarios"

export function IncidentOverviewWorkspace() {
  const portfolio = useMemo(() => getCommandPortfolio(), [])
  const [filter, setFilter] = useState<PortfolioFilter>("all")
  const [selectedKey, setSelectedKey] = useState<ScenarioKey>(() => defaultCommandKey(portfolio))

  const filtered = useMemo(() => filterCommandPortfolio(portfolio, filter), [filter, portfolio])

  useEffect(() => {
    if (filtered.length === 0) return
    if (!filtered.some((item) => item.scenarioKey === selectedKey)) {
      setSelectedKey(defaultCommandKey(filtered))
    }
  }, [filtered, selectedKey])

  const selected = getCommandIncident(selectedKey)

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <PortfolioSummaryBar />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <IncidentPortfolioList
          items={filtered}
          selectedKey={selectedKey}
          filter={filter}
          onFilter={setFilter}
          onSelect={(incident) => setSelectedKey(incident.scenarioKey)}
        />
        <IncidentDetailPane incident={selected} />
      </div>

      <ContinueTo
        label="事故工作台 · Incident Workspace"
        href={rcaHref(selected.incidentId)}
      />
    </div>
  )
}
