"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Crosshair,
  LocateFixed,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react"
import { TwinSchematic, type TwinChainFocus } from "@/components/incident-portfolio/twin-schematic"
import { ContinueTo } from "@/components/page-flow"
import { StorylineStrip } from "@/components/page-question-banner"
import { IncidentSelectorBar, LayerRail } from "@/components/scenario/incident-selector"
import {
  digitalTwinHref,
  getScenarioByKey,
  incidentIdToScenarioKey,
  type ScenarioKey,
} from "@/data/scenarios"
import { twinNodes } from "@/lib/digital-twin-topology"
import { getCommandIncident } from "@/lib/incident-command"
import { getImpactTwinHops, type ImpactTwinHop } from "@/lib/impact-twin"
import { cn } from "@/lib/utils"

type TwinLayer = Exclude<TwinChainFocus, "impact">

const LAYERS: { id: TwinLayer; zh: string; en: string }[] = [
  { id: "topology", zh: "拓扑视图", en: "Topology View" },
  { id: "business", zh: "业务视图", en: "Business View" },
  { id: "power", zh: "供电视图", en: "Power View" },
  { id: "cooling", zh: "制冷视图", en: "Cooling View" },
  { id: "network", zh: "网络视图", en: "Network View" },
]

const NODE_LIST = Object.values(twinNodes)
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.2

const OVERLAY_ITEMS = [
  { key: "root" as const, zh: "根因资产", en: "Root Cause Asset" },
  { key: "assets" as const, zh: "受影响资产", en: "Affected Assets" },
  { key: "services" as const, zh: "受影响服务", en: "Affected Services" },
  { key: "path" as const, zh: "传播路径", en: "Propagation Path" },
] as const

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))))
}

function hopLayer(hop: ImpactTwinHop): "root" | "service" | "asset" {
  if (hop.status === "root") return "root"
  if (hop.twinIds.some((id) => id in twinNodes && twinNodes[id as keyof typeof twinNodes].kind === "service")) {
    return "service"
  }
  return "asset"
}

export function DigitalTwinView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedKey, setSelectedKey] = useState<ScenarioKey>("power")
  const [layer, setLayer] = useState<TwinLayer>("topology")
  const [overlay, setOverlay] = useState({
    root: true,
    assets: true,
    services: true,
    path: true,
  })
  const [overlayOn, setOverlayOn] = useState(true)
  const [query, setQuery] = useState("")
  const [searchId, setSearchId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const param = searchParams.get("incident")
    if (!param) return
    setSelectedKey(incidentIdToScenarioKey(param))
  }, [searchParams])

  const scenario = getScenarioByKey(selectedKey)
  const hops = useMemo(() => getImpactTwinHops(scenario), [scenario])
  const events = scenario.timeline.events
  const ticks = events.length
    ? events
    : hops.map((hop, index) => ({ time: `H${index + 1}`, zh: hop.label, title: hop.label }))
  const tickCount = Math.max(ticks.length, 1)

  useEffect(() => {
    setTick(tickCount - 1)
    setPlaying(false)
  }, [selectedKey, tickCount])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return NODE_LIST.filter(
      (node) =>
        node.name.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q),
    ).slice(0, 8)
  }, [query])

  const visibleHops = useMemo(() => {
    if (!overlayOn) return hops
    return hops.filter((hop) => {
      const kind = hopLayer(hop)
      if (kind === "root") return overlay.root
      if (kind === "service") return overlay.services
      return overlay.assets
    })
  }, [hops, overlay, overlayOn])

  const activeHops = useMemo(() => {
    if (!overlayOn) return null
    const count = Math.max(
      1,
      Math.round(((tick + 1) / tickCount) * hops.length),
    )
    const revealed = hops.slice(0, Math.min(hops.length, count)).map((hop) => hop.chainId)
    const allowed = new Set(visibleHops.map((hop) => hop.chainId))
    return new Set(revealed.filter((id) => allowed.has(id)))
  }, [hops, overlayOn, tick, tickCount, visibleHops])

  const selectIncident = useCallback(
    (key: ScenarioKey) => {
      const next = getCommandIncident(key)
      setSelectedKey(key)
      router.replace(digitalTwinHref(next.incidentId), { scroll: false })
    },
    [router],
  )

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setTick((current) => {
        if (current >= tickCount - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [playing, tickCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -0.08 : 0.08
      setZoom((value) => clampZoom(value + delta))
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <div className="mx-auto flex max-w-[1760px] flex-col gap-4">
      <StorylineStrip activeStep={2} />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <IncidentSelectorBar
          className="border-b border-border"
          selectedKey={selectedKey}
          onSelect={selectIncident}
        />

        <div className="flex flex-col border-b border-border bg-muted/15 sm:flex-row">
          <LayerRail zh="视图" en="View" />
          <div className="flex flex-1 flex-wrap items-center gap-2 px-3 py-2">
            <div className="inline-flex flex-wrap rounded-lg border border-border bg-panel p-0.5">
              {LAYERS.map((item) => {
                const active = layer === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLayer(item.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.zh}
                    <span className="ml-1 hidden font-normal opacity-80 lg:inline">{item.en}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col border-b border-border bg-muted/30 sm:flex-row">
          <LayerRail zh="叠加" en="Overlay" />
          <div className="flex flex-1 flex-wrap items-center gap-1.5 px-3 py-2">
            <button
              type="button"
              onClick={() => setOverlayOn((value) => !value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold",
                overlayOn
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <LocateFixed className="size-3.5" />
              {overlayOn ? "叠加开启" : "叠加关闭"}
              <span className="hidden font-normal opacity-80 sm:inline">· Overlay {overlayOn ? "On" : "Off"}</span>
            </button>
            {OVERLAY_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!overlayOn}
                onClick={() => setOverlay((current) => ({ ...current, [item.key]: !current[item.key] }))}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] font-semibold disabled:opacity-40",
                  overlayOn && overlay[item.key]
                    ? "border-[var(--p2)]/40 bg-[var(--p2)]/12 text-[var(--p2)]"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {item.zh}
                <span className="ml-1 hidden opacity-80 xl:inline">{item.en}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative border-b border-border/70 bg-muted/10 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Digital Twin Canvas</h2>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setSearchId(null)
                  }}
                  placeholder="搜索设备 / 机架 / 服务…"
                  className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none xl:w-56"
                />
                {matches.length && !searchId ? (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
                    {matches.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          setSearchId(node.id)
                          setQuery(node.name)
                        }}
                        className="flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-accent"
                      >
                        <span className="text-[11px] font-semibold text-foreground">{node.name}</span>
                        <span className="text-[10px] text-muted-foreground">{node.code}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>
              <div className="inline-flex items-center rounded-md border border-border bg-background">
                <button
                  type="button"
                  aria-label="缩小"
                  onClick={() => setZoom((value) => clampZoom(value - 0.15))}
                  className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-10 text-center font-mono text-[10px] text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="放大"
                  onClick={() => setZoom((value) => clampZoom(value + 0.15))}
                  className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="复位视图"
                  onClick={() => {
                    setZoom(1)
                    setPan({ x: 0, y: 0 })
                  }}
                  className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          id="digital-twin-canvas"
          ref={canvasRef}
          className="relative min-h-[640px] cursor-grab overflow-hidden touch-none active:cursor-grabbing"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button, input, a")) return
            drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
            ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!drag.current) return
            setPan({
              x: drag.current.panX + (event.clientX - drag.current.x),
              y: drag.current.panY + (event.clientY - drag.current.y),
            })
          }}
          onPointerUp={() => {
            drag.current = null
          }}
        >
          <div
            className="origin-center"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <TwinSchematic
              mode={overlayOn ? "impact" : "live"}
              hops={visibleHops}
              activeHops={activeHops}
              chainFocus={layer}
              searchId={searchId}
              showSpine={overlayOn && overlay.path}
              showDomainHeat={!overlayOn}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-3 py-2.5">
          <div className="mr-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <Crosshair className="size-3.5 text-primary" />
            时间轴联动 · Timeline Sync
          </div>
          <button
            type="button"
            onClick={() => {
              if (!overlayOn) setOverlayOn(true)
              if (tick >= tickCount - 1) setTick(0)
              setPlaying((value) => !value)
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent"
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {playing ? "暂停传播" : "播放传播过程"}
          </button>
          {ticks.map((event, index) => {
            const active = overlayOn && index <= tick
            const current = overlayOn && index === tick
            return (
              <button
                key={`${event.time}-${index}`}
                type="button"
                onClick={() => {
                  setOverlayOn(true)
                  setPlaying(false)
                  setTick(index)
                }}
                className={cn(
                  "rounded-md border px-2 py-1 text-left transition-colors",
                  current
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="block font-mono text-[10px] font-semibold">{event.time}</span>
                <span className="block max-w-24 truncate text-[10px]">{event.zh}</span>
              </button>
            )
          })}
          <p className="ml-auto text-[10px] text-muted-foreground">{scenario.timeline.conclusion}</p>
        </div>
      </section>

      <ContinueTo label="事件调查中心 · Investigation Center" href="/rca/manual" />
    </div>
  )
}
