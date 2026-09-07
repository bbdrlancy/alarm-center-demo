"use client"

import { Panel } from "@/components/primitives"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"

export function DigitalTwinMap() {
  return (
    <Panel title="Digital Twin" subtitle="数字孪生" bodyClassName="p-0 overflow-hidden">
      <div id="digital-twin-map">
        <TwinSchematic mode="live" />
      </div>
    </Panel>
  )
}
