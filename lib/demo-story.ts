import { powerScenario } from "@/data/scenarios/power"
import { digitalTwinHref, rcaHref } from "@/data/scenarios"

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
    label: "Incident Overview",
    subtitle: "What incidents exist?",
    href: "/",
    highlightId: "incident-portfolio-list",
    durationMs: 5500,
  },
  {
    stage: 2,
    label: "Incident Workspace · Journey",
    subtitle: "What → Why → How it spread → Impact → Action",
    href: rcaHref(defaultIncident.id),
    highlightId: "incident-journey",
    durationMs: 7000,
  },
  {
    stage: 3,
    label: "Digital Twin View",
    subtitle: "Where happened · How does it propagate?",
    href: digitalTwinHref(defaultIncident.id),
    highlightId: "digital-twin-canvas",
    durationMs: 6500,
  },
  {
    stage: 4,
    label: "Incident Investigation",
    subtitle: "Validate conclusion · Alarm Convergence",
    href: "/rca/manual",
    highlightId: "event-evolution-timeline",
    action: "play-alarm-reduction",
    durationMs: 5500,
  },
  {
    stage: 5,
    label: "Demo Complete",
    subtitle: "Overview → Workspace → Twin → Investigation",
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
