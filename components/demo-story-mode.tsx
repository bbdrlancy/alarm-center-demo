"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Pause, Play, X } from "lucide-react"
import {
  clearDemoHighlight,
  demoStoryStages,
  DEMO_STORY_EXIT,
  DEMO_STORY_PAUSE,
  DEMO_STORY_RESUME,
  DEMO_STORY_START,
  emitDemoStory,
  highlightElement,
} from "@/lib/demo-story"
import { DemoStorySummary } from "@/components/demo-story-summary"
import { cn } from "@/lib/utils"

export function DemoStoryMode() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [runId, setRunId] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = demoStoryStages[stageIdx]

  const scrollToTarget = useCallback((id?: string) => {
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [])

  const emitStage = useCallback(
    (idx: number, playingState: boolean, id: number) => {
      const step = demoStoryStages[idx]
      if (!step) return
      emitDemoStory({
        stage: step.stage,
        action: step.action,
        playing: playingState,
        runId: id,
      })
    },
    [],
  )

  const exitDemo = useCallback(() => {
    setPlaying(false)
    setActive(false)
    setShowSummary(false)
    setStageIdx(0)
    clearDemoHighlight()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
    window.dispatchEvent(new CustomEvent(DEMO_STORY_EXIT))
  }, [])

  const goToStage = useCallback(
    (idx: number, id: number, playingState: boolean) => {
      const step = demoStoryStages[idx]
      if (!step) return

      setStageIdx(idx)

      if (step.action === "show-summary") {
        setShowSummary(true)
        clearDemoHighlight()
        emitStage(idx, playingState, id)
        return
      }

      setShowSummary(false)

      const afterNav = () => {
        highlightElement(step.highlightId)
        scrollToTarget(step.highlightId)
        emitStage(idx, playingState, id)
      }

      if (pathname !== step.href) {
        router.push(step.href)
        navigateTimerRef.current = setTimeout(afterNav, 650)
      } else {
        afterNav()
      }
    },
    [emitStage, pathname, router, scrollToTarget],
  )

  const startDemo = useCallback(() => {
    const id = runId + 1
    setRunId(id)
    setActive(true)
    setPlaying(true)
    setStageIdx(0)
    setShowSummary(false)
    goToStage(0, id, true)
  }, [goToStage, runId])

  useEffect(() => {
    const onStart = () => startDemo()
    const onPause = () => setPlaying(false)
    const onResume = () => setPlaying(true)

    window.addEventListener(DEMO_STORY_START, onStart)
    window.addEventListener(DEMO_STORY_PAUSE, onPause)
    window.addEventListener(DEMO_STORY_RESUME, onResume)
    return () => {
      window.removeEventListener(DEMO_STORY_START, onStart)
      window.removeEventListener(DEMO_STORY_PAUSE, onPause)
      window.removeEventListener(DEMO_STORY_RESUME, onResume)
    }
  }, [startDemo])

  useEffect(() => {
    if (!active || !playing || !current) return

    timerRef.current = setTimeout(() => {
      const next = stageIdx + 1
      if (next >= demoStoryStages.length) {
        setPlaying(false)
        return
      }
      goToStage(next, runId, true)
    }, current.durationMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, playing, stageIdx, current, goToStage, runId])

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current)
    }
  }, [])

  if (!active) return null

  return (
    <>
      {showSummary ? <DemoStorySummary onClose={exitDemo} /> : null}

      <div className="fixed bottom-6 right-6 z-[90] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-primary/30 bg-card shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-primary/8 px-3 py-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-primary">Demo Story Mode</div>
            <div className="truncate text-[10px] text-muted-foreground">
              Stage {stageIdx + 1}/{demoStoryStages.length} · ~43s
            </div>
          </div>
          <button
            type="button"
            onClick={exitDemo}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Exit Demo"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="text-sm font-semibold text-foreground">{current.label}</div>
          <div className="text-[11px] text-muted-foreground">{current.subtitle}</div>

          <div className="mt-3 flex gap-0.5">
            {demoStoryStages.map((s, i) => (
              <div
                key={s.stage}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= stageIdx ? "bg-primary" : "bg-border",
                )}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !playing
                setPlaying(next)
                window.dispatchEvent(new CustomEvent(next ? DEMO_STORY_RESUME : DEMO_STORY_PAUSE))
                if (next) {
                  emitStage(stageIdx, true, runId)
                } else {
                  emitDemoStory({
                    stage: current.stage,
                    action: current.action,
                    playing: false,
                    runId,
                  })
                }
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground"
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {playing ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={exitDemo}
              className="rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/** Header trigger — mount in AppShell */
export function DemoStoryStartButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(DEMO_STORY_START))}
      className="hidden items-center gap-1.5 rounded-md border border-primary/40 bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:inline-flex"
    >
      <Play className="size-3.5" />
      Start Demo
    </button>
  )
}
