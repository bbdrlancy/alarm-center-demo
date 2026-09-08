import { powerScenario } from "@/data/scenarios/power"
import { rcaHref } from "@/data/scenarios"

export type DemoStoryStageConfig = {
  stage: number
  label: string
  subtitle: string
  href: string
  highlightId?: string
  action?: string
  durationMs: number
}

const defaultIncident = powerScenario.incident

/** 5-stage demo · total ~31s (under 60s) */
export const demoStoryStages: DemoStoryStageConfig[] = [
  {
    stage: 1,
    label: "Incident Center",
    subtitle: "12 Open · 2 P1 · ¥12.3M Risk",
    href: "/",
    highlightId: "digital-twin-map",
    durationMs: 5500,
  },
  {
    stage: 2,
    label: "Recommended Actions",
    subtitle: `Select ${defaultIncident.id} · ${defaultIncident.title}`,
    href: "/",
    highlightId: "recommended-actions",
    durationMs: 5500,
  },
  {
    stage: 3,
    label: "Incident Workspace · Alarm Reduction",
    subtitle: defaultIncident.alarmReduction.replace(" → ", " → … → "),
    href: rcaHref(defaultIncident.id),
    highlightId: "correlation-pipeline",
    action: "play-alarm-reduction",
    durationMs: 7500,
  },
  {
    stage: 4,
    label: "Impact Chain",
    subtitle: "故障影响链路动画",
    href: rcaHref(defaultIncident.id),
    highlightId: "incident-overview",
    action: "play-impact-chain",
    durationMs: 6000,
  },
  {
    stage: 5,
    label: "Demo Complete",
    subtitle: "Center → Workspace → Investigation → Copilot",
    href: rcaHref(defaultIncident.id),
    action: "show-summary",
    durationMs: 6000,
  },
]

export const DEMO_STORY_STAGE = "demo-story-stage"
export const DEMO_STORY_START = "demo-story-start"
export const DEMO_STORY_EXIT = "demo-story-exit"
export const DEMO_STORY_PAUSE = "demo-story-pause"
export const DEMO_STORY_RESUME = "demo-story-resume"

export type DemoStoryDetail = {
  stage: number
  action?: string
  playing: boolean
  runId: number
}

export function emitDemoStory(detail: DemoStoryDetail) {
  window.dispatchEvent(new CustomEvent(DEMO_STORY_STAGE, { detail }))
}

export function clearDemoHighlight() {
  document.querySelectorAll(".demo-story-highlight").forEach((el) => {
    el.classList.remove("demo-story-highlight")
  })
}

export function highlightElement(id?: string) {
  clearDemoHighlight()
  if (!id) return
  document.getElementById(id)?.classList.add("demo-story-highlight")
}
