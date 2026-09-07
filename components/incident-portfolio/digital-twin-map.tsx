"use client"

import { Panel } from "@/components/primitives"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"

export function DigitalTwinMap() {
  return (
    <Panel title="数字孪生" subtitle="Digital Twin" bodyClassName="p-0 overflow-hidden">
      <div id="digital-twin-map">
        <TwinSchematic mode="live" />
      </div>
    </Panel>
  )
}
