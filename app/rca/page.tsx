"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"
import { IncidentWorkspace } from "@/components/rca/incident-workspace"
import { ScenarioSwitcher } from "@/components/scenario/scenario-switcher"
import { useActiveIncident } from "@/hooks/use-active-incident"
import { getCommandIncident } from "@/lib/incident-command"

function RcaAiPageContent() {
  const { scenario } = useActiveIncident()
  const incident = getCommandIncident(scenario.id)
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <ScenarioSwitcher />

      <RcaPageSwitch current="ai" />

      <IncidentWorkspace incident={incident} />
    </div>
  )
}

export default function RcaPage() {
  return (
    <AppShell
      active="rca-ai"
      title="事故工作台"
      subtitle="Incident Workspace"
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaAiPageContent />
      </Suspense>
    </AppShell>
  )
}
