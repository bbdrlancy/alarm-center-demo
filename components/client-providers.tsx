"use client"

import { AiopsCopilot } from "@/components/aiops-copilot"
import { DemoStoryMode } from "@/components/demo-story-mode"
import { ScenarioProvider } from "@/components/scenario/scenario-provider"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      {children}
      <AiopsCopilot />
      <DemoStoryMode />
    </ScenarioProvider>
  )
}
