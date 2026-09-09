"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { DigitalTwinView } from "@/components/digital-twin/digital-twin-view"

function DigitalTwinPageContent() {
  return <DigitalTwinView />
}

export default function DigitalTwinPage() {
  return (
    <AppShell
      active="digital-twin"
      title="数字孪生视图"
      subtitle="Digital Twin View"
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <DigitalTwinPageContent />
      </Suspense>
    </AppShell>
  )
}
