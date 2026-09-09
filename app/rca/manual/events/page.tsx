"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { EventExplorationWorkspace } from "@/components/rca/event-exploration-workspace"
import { InvestigationSubnav } from "@/components/rca/investigation-subnav"

function EventExplorationPageContent() {
  return (
    <div className="mx-auto flex max-w-[1760px] flex-col gap-4">
      <InvestigationSubnav current="events" />
      <EventExplorationWorkspace />
    </div>
  )
}

export default function EventExplorationPage() {
  return (
    <AppShell
      active="investigation-events"
      title="事件探索"
      subtitle="Event Exploration"
      hideDemoControls
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <EventExplorationPageContent />
      </Suspense>
    </AppShell>
  )
}
