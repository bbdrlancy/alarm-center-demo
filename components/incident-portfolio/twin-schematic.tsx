"use client"

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { domainHeatmap, type RiskLevel } from "@/lib/incident-portfolio-data"
import {
  TWIN_EDGE_STYLE,
  twinEdges,
  twinNodes,
  type TwinEdgeKind,
  type TwinHeatDomain,
  type TwinNode,
} from "@/lib/digital-twin-topology"
import { hopForTwin, impactSpine, type ImpactTwinHop } from "@/lib/impact-twin"
import { DIGITAL_TWIN_VERSION } from "@/lib/ui-revision"
import { cn } from "@/lib/utils"

const riskTone: Record<RiskLevel, string> = {
  Critical: "#f87171",
  High: "#fb923c",
  Medium: "#38bdf8",
  Low: "#4ade80",
}

const DOMAIN_ZH: Record<TwinHeatDomain, string> = {
  Power: "电力域",
  Cooling: "制冷域",
  Storage: "存储域",
  Network: "网络域",
}

type NodeId = keyof typeof twinNodes

function heatmapOf(domain: TwinHeatDomain) {
  return domainHeatmap.find((cell) => cell.domain === domain)!
}

export type TwinChainFocus = "topology" | "business" | "impact" | "power" | "cooling" | "network"

const PORTFOLIO_ROLES: Record<string, "root" | "asset" | "service"> = {
  ups: "root",
  crah: "root",
  san: "root",
  coresw: "root",
  pdu: "asset",
  rackA01: "asset",
  rackA02: "asset",
  rackA03: "asset",
  gpu: "asset",
  job: "asset",
  vm: "asset",
  aisleA: "asset",
  aiservice: "service",
  aiplatform: "service",
}

const CHAIN_NODE_IDS: Record<"power" | "cooling" | "network", Set<string>> = {
  power: new Set(["transformer", "ups", "pdu", "rackA01", "rackA02", "rackA03", "rackB01", "rackB02", "rackB03"]),
  cooling: new Set(["chiller", "pump", "crah", "aisleA", "aisleB"]),
  network: new Set(["coresw", "gpu", "san", "aiservice", "aiplatform"]),
}

const BUSINESS_NODE_IDS = new Set(["aiservice", "aiplatform", "job", "vm", "gpu"])

const CHAIN_COLOR: Record<"power" | "cooling" | "network" | "business", string> = {
  power: "#facc15",
  cooling: "#22d3ee",
  network: "#38bdf8",
  business: "#60a5fa",
}

const ROLE_COLOR = {
  root: "#e53935",
  asset: "#fb8c00",
  service: "#60a5fa",
} as const

const ROLE_LABEL = {
  root: "ROOT CAUSE",
  asset: "AFFECTED",
  service: "SERVICE",
} as const

function DeviceGlyph({ id, color, compact }: { id: NodeId; color: string; compact?: boolean }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.6, strokeLinejoin: "round" as const }
  return (
    <svg viewBox="0 0 48 36" className={compact ? "h-6 w-8" : "h-8 w-11"} aria-hidden>
      {id === "transformer" ? (
        <>
          <rect x="6" y="6" width="36" height="24" rx="3" {...common} />
          <path d="M12 18h6l3-6 4 12 3-6h8" {...common} />
        </>
      ) : id === "ups" ? (
        <>
          <rect x="8" y="8" width="32" height="20" rx="2" {...common} />
          <rect x="12" y="12" width="8" height="12" rx="1" fill={color} opacity="0.25" stroke="none" />
          <rect x="22" y="12" width="8" height="12" rx="1" fill={color} opacity="0.45" stroke="none" />
          <rect x="32" y="12" width="4" height="12" rx="1" {...common} />
        </>
      ) : id === "pdu" ? (
        <>
          <rect x="4" y="12" width="40" height="12" rx="2" {...common} />
          {[10, 18, 26, 34].map((x) => (
            <circle key={x} cx={x} cy="18" r="2.2" fill={color} />
          ))}
        </>
      ) : id === "chiller" ? (
        <>
          <rect x="8" y="6" width="32" height="24" rx="2" {...common} />
          {[14, 20, 26, 32].map((x) => (
            <path key={x} d={`M${x} 10v16`} {...common} />
          ))}
        </>
      ) : id === "pump" ? (
        <>
          <circle cx="24" cy="18" r="11" {...common} />
          <circle cx="24" cy="18" r="3" fill={color} stroke="none" />
          <path d="M24 10v5M24 21v5M16 18h5M27 18h5" {...common} />
        </>
      ) : id === "crah" ? (
        <>
          <rect x="8" y="6" width="32" height="24" rx="2" {...common} />
          <circle cx="24" cy="18" r="7" {...common} />
          <path d="M24 11v14M17 18h14M19 13.5l10 9M29 13.5l-10 9" {...common} />
        </>
      ) : id === "san" ? (
        <>
          <ellipse cx="24" cy="10" rx="14" ry="5" {...common} />
          <path d="M10 10v8c0 2.8 6.3 5 14 5s14-2.2 14-5v-8" {...common} />
          <path d="M10 18v8c0 2.8 6.3 5 14 5s14-2.2 14-5v-8" {...common} />
        </>
      ) : id === "coresw" ? (
        <>
          <rect x="6" y="10" width="36" height="16" rx="2" {...common} />
          {[12, 18, 24, 30, 36].map((x) => (
            <rect key={x} x={x - 2} y="14" width="4" height="8" rx="0.5" fill={color} opacity="0.7" stroke="none" />
          ))}
        </>
      ) : id === "gpu" ? (
        <>
          <rect x="6" y="8" width="36" height="20" rx="2" {...common} />
          <rect x="10" y="12" width="14" height="12" rx="1" fill={color} opacity="0.22" stroke={color} />
          <rect x="26" y="12" width="12" height="12" rx="1" {...common} />
        </>
      ) : id === "vm" ? (
        <>
          <rect x="8" y="6" width="32" height="18" rx="2" {...common} />
          <path d="M18 24h12M24 24v6M16 30h16" {...common} />
        </>
      ) : id === "job" ? (
        <>
          <rect x="12" y="6" width="24" height="24" rx="4" {...common} />
          <path d="M12 14h24M12 22h24" {...common} />
        </>
      ) : id.startsWith("rack") ? (
        <>
          <rect x="10" y="8" width="28" height="20" rx="1.5" {...common} />
          {[13, 18, 23].map((y) => (
            <path key={y} d={`M14 ${y}h20`} {...common} />
          ))}
        </>
      ) : id.startsWith("aisle") ? (
        <>
          <rect x="6" y="8" width="36" height="20" rx="3" strokeDasharray="3 2" {...common} />
          <path d="M14 18h20" {...common} />
        </>
      ) : (
        <>
          <rect x="6" y="8" width="36" height="20" rx="6" {...common} />
          <path d="M16 18h16" {...common} />
        </>
      )}
    </svg>
  )
}

function TwinUnit({
  node,
  color,
  dimmed,
  hop,
  isRoot,
  localize,
  alarmMark,
  active,
  onClick,
  compact,
  hideNames,
  roleLabel,
}: {
  node: TwinNode
  color: string
  dimmed?: boolean
  hop?: number
  isRoot?: boolean
  localize?: boolean
  alarmMark?: boolean
  active?: boolean
  onClick?: () => void
  compact?: boolean
  hideNames?: boolean
  roleLabel?: string
}) {
  const body = (
    <>
      <div
        className={cn(
          "twin-breathe relative grid place-items-center rounded-md border",
          compact ? "h-8 w-[52px]" : "h-12 w-[72px]",
          isRoot && "twin-impact-root",
        )}
        style={{
          borderColor: `${color}88`,
          background: `${color}14`,
          boxShadow: active
            ? `0 0 0 2px ${color}, 0 0 18px ${color}66`
            : `0 0 14px ${color}40, inset 0 0 10px ${color}18`,
        }}
      >
        {hop != null ? (
          <span
            className="absolute -left-1.5 -top-1.5 grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: isRoot ? "#e53935" : "#fb8c00" }}
          >
            {hop}
          </span>
        ) : null}
        <DeviceGlyph id={node.id as NodeId} color={color} compact={compact} />
      </div>
      {hideNames ? (
        roleLabel && !dimmed ? (
          <div className="text-center text-[8px] font-bold uppercase tracking-wide" style={{ color }}>
            {roleLabel}
          </div>
        ) : null
      ) : (
        <div className="text-center leading-tight">
          <div className="text-[11px] font-semibold text-cyan-50">{node.name}</div>
          <div className="font-mono text-[9px] text-cyan-200/60">{node.code}</div>
          {isRoot ? (
            <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#ff8a80]">
              {alarmMark ? "ALARM" : localize ? "FAULT SOURCE" : "ROOT CAUSE"}
            </div>
          ) : hop != null ? (
            <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#ffcc80]">IMPACTED</div>
          ) : roleLabel ? (
            <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide" style={{ color }}>
              {roleLabel}
            </div>
          ) : null}
        </div>
      )}
    </>
  )

  const className = cn(
    "flex flex-col items-center gap-1",
    compact ? "w-[72px]" : "w-[108px]",
    dimmed && "opacity-28",
  )

  if (onClick) {
    return (
      <button type="button" data-twin-id={node.id} onClick={onClick} className={className}>
        {body}
      </button>
    )
  }

  return (
    <div data-twin-id={node.id} className={className}>
      {body}
    </div>
  )
}

function HeatChip({ domain }: { domain: TwinHeatDomain }) {
  const cell = heatmapOf(domain)
  const color = riskTone[cell.riskLevel]
  return (
    <div
      className="rounded-md border px-2 py-1 backdrop-blur-sm"
      style={{
        borderColor: `${color}99`,
        background: `${color}18`,
        boxShadow: `0 0 14px ${color}33`,
      }}
    >
      <div className="text-[10px] font-bold text-white">
        {DOMAIN_ZH[domain]} · {domain}
      </div>
      <div className="mt-0.5 flex gap-2 text-[10px] text-cyan-50/90">
        <span>{cell.incidentCount} 起事故</span>
        <span style={{ color }}>{cell.criticalCount} 严重</span>
      </div>
      <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color }}>
        {cell.riskLevel} RISK
      </div>
    </div>
  )
}

function Layer({
  title,
  subtitle,
  children,
  accent,
  compact,
}: {
  title: string
  subtitle: string
  children: ReactNode
  accent: string
  compact?: boolean
}) {
  return (
    <section
      className={cn("relative rounded-xl border", compact ? "px-2 py-1.5" : "px-3 py-2.5")}
      style={{
        borderColor: `${accent}55`,
        background: "linear-gradient(180deg, rgba(14,23,48,0.92) 0%, rgba(11,16,33,0.72) 100%)",
        boxShadow: `inset 0 0 0 1px ${accent}22, 0 0 24px ${accent}14`,
      }}
    >
      {compact ? (
        <div className="mb-1 text-[10px] font-semibold text-cyan-50/80">{title}</div>
      ) : (
        <div className="mb-2 flex items-baseline gap-2">
          <h3 className="text-[12px] font-semibold text-cyan-50">{title}</h3>
          <span className="text-[10px] text-cyan-200/55">{subtitle}</span>
        </div>
      )}
      {children}
    </section>
  )
}

export function TwinSchematic({
  mode = "live",
  hops = [],
  selectedHop = null,
  activeHops = null,
  onSelectHop,
  subtitle,
  localize = false,
  markSelectedAsAlarm = false,
  showDomainHeat = true,
  compact = false,
  chainFocus,
  searchId = null,
  showSpine = true,
}: {
  mode?: "live" | "impact"
  hops?: ImpactTwinHop[]
  selectedHop?: string | null
  activeHops?: Set<string> | null
  onSelectHop?: (chainId: string) => void
  subtitle?: string
  localize?: boolean
  markSelectedAsAlarm?: boolean
  showDomainHeat?: boolean
  compact?: boolean
  chainFocus?: TwinChainFocus
  searchId?: string | null
  showSpine?: boolean
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [links, setLinks] = useState<{ d: string; kind: TwinEdgeKind | "impact"; active: boolean }[]>([])
  const edgeKinds = useMemo(
    () => Object.entries(TWIN_EDGE_STYLE) as [TwinEdgeKind, (typeof TWIN_EDGE_STYLE)[TwinEdgeKind]][],
    [],
  )
  const impact = mode === "impact"
  const showHeat = showDomainHeat && !impact && !compact
  const hideNames = compact
  const spine = useMemo(
    () => (impact && showSpine ? impactSpine(hops) : []),
    [impact, hops, showSpine],
  )

  function withSearch<T extends { active?: boolean; dimmed?: boolean }>(id: NodeId, props: T): T {
    if (searchId === id) return { ...props, active: true, dimmed: false }
    return props
  }

  function unitProps(id: NodeId, fallback: string) {
    const chrome = { compact, hideNames }

    if (impact) {
      const hop = hopForTwin(id, hops)
      if (!hop) return withSearch(id, { ...chrome, color: "#64748b", dimmed: true })
      const isLocation = selectedHop === hop.chainId
      const inFocus = !activeHops || activeHops.has(hop.chainId)
      const isRoot = markSelectedAsAlarm ? isLocation : hop.status === "root" && inFocus
      return withSearch(id, {
        ...chrome,
        color: isLocation ? "#e53935" : inFocus ? "#fb8c00" : "#64748b",
        dimmed: !inFocus,
        hop: inFocus ? hop.hop : undefined,
        isRoot,
        localize,
        alarmMark: markSelectedAsAlarm && isLocation,
        active: isLocation || (localize && isRoot),
        onClick: () => onSelectHop?.(hop.chainId),
      })
    }

    if (chainFocus === "impact") {
      const role = PORTFOLIO_ROLES[id]
      if (!role) return withSearch(id, { ...chrome, color: "#64748b", dimmed: true })
      return withSearch(id, {
        ...chrome,
        color: ROLE_COLOR[role],
        isRoot: role === "root",
        active: role === "root",
        roleLabel: ROLE_LABEL[role],
      })
    }

    if (chainFocus === "power" || chainFocus === "cooling" || chainFocus === "network") {
      const inChain = CHAIN_NODE_IDS[chainFocus].has(id)
      return withSearch(id, {
        ...chrome,
        color: inChain ? CHAIN_COLOR[chainFocus] : "#64748b",
        dimmed: !inChain,
        active: inChain,
      })
    }

    if (chainFocus === "business") {
      const inChain = BUSINESS_NODE_IDS.has(id)
      return withSearch(id, {
        ...chrome,
        color: inChain ? CHAIN_COLOR.business : "#64748b",
        dimmed: !inChain,
        active: inChain,
      })
    }

    return withSearch(id, { ...chrome, color: fallback })
  }

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const draw = () => {
      const origin = stage.getBoundingClientRect()
      const scaleX = origin.width / (stage.offsetWidth || origin.width) || 1
      const scaleY = origin.height / (stage.offsetHeight || origin.height) || 1
      const centerOf = (id: string) => {
        const el = stage.querySelector(`[data-twin-id="${id}"]`)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          x: (r.left + r.width / 2 - origin.left) / scaleX,
          y: (r.top + r.height / 2 - origin.top) / scaleY,
        }
      }

      const background = twinEdges.flatMap((edge) => {
        if (edge.kind === "spatial") return []
        if (chainFocus === "power" && edge.kind !== "power") return []
        if (chainFocus === "cooling" && edge.kind !== "cooling") return []
        if (chainFocus === "network" && edge.kind !== "data") return []
        if (chainFocus === "business" && edge.kind !== "business") return []
        if (chainFocus === "impact") {
          if (!PORTFOLIO_ROLES[edge.from] || !PORTFOLIO_ROLES[edge.to]) return []
        }
        const from = centerOf(edge.from)
        const to = centerOf(edge.to)
        if (!from || !to) return []
        const lift = Math.max(18, Math.abs(from.y - to.y) * 0.28)
        const d = `M ${from.x} ${from.y} C ${from.x} ${from.y - lift}, ${to.x} ${to.y - lift}, ${to.x} ${to.y}`
        return [{ d, kind: chainFocus === "impact" ? ("impact" as const) : edge.kind, active: !impact || Boolean(chainFocus) }]
      })

      const overlay = spine.flatMap((edge) => {
        const from = centerOf(edge.from)
        const to = centerOf(edge.to)
        if (!from || !to) return []
        const fromHop = hopForTwin(edge.from, hops)
        const toHop = hopForTwin(edge.to, hops)
        const active = !activeHops || Boolean(fromHop && toHop && activeHops.has(fromHop.chainId) && activeHops.has(toHop.chainId))
        const lift = Math.max(22, Math.abs(from.y - to.y) * 0.34)
        const d = `M ${from.x} ${from.y} C ${from.x} ${from.y - lift}, ${to.x} ${to.y - lift}, ${to.x} ${to.y}`
        return [{ d, kind: "impact" as const, active }]
      })

      const next = [...background, ...overlay]
      setLinks((current) => {
        if (
          current.length === next.length &&
          current.every((link, index) => {
            const item = next[index]
            return item && link.d === item.d && link.kind === item.kind && link.active === item.active
          })
        ) {
          return current
        }
        return next
      })
    }

    draw()
    const frame = requestAnimationFrame(draw)
    const ro = new ResizeObserver(draw)
    ro.observe(stage)
    window.addEventListener("resize", draw)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener("resize", draw)
    }
  }, [activeHops, chainFocus, compact, hops, impact, searchId, spine])

  return (
    <div
      ref={stageRef}
      className={cn(
        "twin-space relative overflow-hidden px-3 py-3 text-cyan-50",
        compact ? "min-h-0 px-2 py-2" : "min-h-[560px] px-3 py-3",
      )}
    >
      <div className="twin-particles pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      <div className={cn("relative z-10 mb-2 flex items-center justify-between px-1", compact && "mb-1")}>
        <div>
          <div className={cn("font-semibold tracking-wide text-cyan-50", compact ? "text-[11px]" : "text-[13px]")}>
            DC01 数据中心 · A 栋
          </div>
          {compact ? null : (
            <div className="text-[10px] text-cyan-200/55">
              {subtitle ?? (localize ? "数字孪生 · 故障定位" : impact ? "数字孪生 · 影响链路叠加" : "实时数字孪生 · 二维拓扑动线")}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-cyan-200/45">{DIGITAL_TWIN_VERSION}</span>
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-200">
            {localize
              ? "LOCALIZE"
              : markSelectedAsAlarm
                ? "ALARM PATH"
                : impact
                  ? "IMPACT PATH"
                  : chainFocus === "impact"
                    ? "IMPACT PATH"
                  : chainFocus === "power"
                    ? "POWER CHAIN"
                    : chainFocus === "cooling"
                      ? "COOLING CHAIN"
                      : chainFocus === "network"
                        ? "NETWORK CHAIN"
                        : chainFocus === "business"
                          ? "BUSINESS VIEW"
                          : chainFocus === "topology"
                            ? "TOPOLOGY"
                            : "LIVE"}
          </div>
        </div>
      </div>

      <div className={cn("relative z-10 flex flex-col", compact ? "gap-1.5" : "gap-2.5")}>
        {compact ? (
          <>
            <div
              className="flex flex-wrap items-center justify-center gap-3 rounded-xl border px-2 py-2"
              style={{ borderColor: "#60a5fa55", background: "rgba(11,16,33,0.72)" }}
            >
              <TwinUnit node={twinNodes.aiservice} {...unitProps("aiservice", "#60a5fa")} />
              <TwinUnit node={twinNodes.aiplatform} {...unitProps("aiplatform", "#60a5fa")} />
              <TwinUnit node={twinNodes.gpu} {...unitProps("gpu", "#34d399")} />
              <TwinUnit node={twinNodes.san} {...unitProps("san", "#c084fc")} />
              <TwinUnit node={twinNodes.coresw} {...unitProps("coresw", "#38bdf8")} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 px-2 py-2">
                <TwinUnit node={twinNodes.ups} {...unitProps("ups", "#facc15")} />
                <TwinUnit node={twinNodes.pdu} {...unitProps("pdu", "#facc15")} />
                <TwinUnit node={twinNodes.transformer} {...unitProps("transformer", "#facc15")} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-2 py-2">
                <TwinUnit node={twinNodes.crah} {...unitProps("crah", "#22d3ee")} />
                <TwinUnit node={twinNodes.chiller} {...unitProps("chiller", "#22d3ee")} />
                <TwinUnit node={twinNodes.pump} {...unitProps("pump", "#22d3ee")} />
              </div>
            </div>
          </>
        ) : (
          <>
        <Layer title="业务逻辑层" subtitle="Business Domain" accent="#60a5fa">
          <div className="flex flex-wrap items-center justify-center gap-10 py-1">
            <TwinUnit node={twinNodes.aiservice} {...unitProps("aiservice", "#60a5fa")} />
            <TwinUnit node={twinNodes.aiplatform} {...unitProps("aiplatform", "#60a5fa")} />
          </div>
        </Layer>

        <Layer title="IT 负载层 · 二层大厅" subtitle="Floor 2 · IT Hall A" accent="#38bdf8">
            <div className="grid gap-3 lg:grid-cols-[1.05fr_1.35fr]">
              <div className="rounded-lg border border-slate-500/30 bg-[#0b1021]/40 p-2">
                <div className="mb-2 text-[10px] font-semibold text-slate-300">空间布局</div>
                <div className="space-y-2">
                  <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2">
                    <TwinUnit node={twinNodes.aisleA} {...unitProps("aisleA", "#67e8f9")} />
                    <div className="mt-1 flex justify-center gap-1">
                      <TwinUnit node={twinNodes.rackA01} {...unitProps("rackA01", "#4ade80")} />
                      <TwinUnit node={twinNodes.rackA02} {...unitProps("rackA02", "#4ade80")} />
                      <TwinUnit node={twinNodes.rackA03} {...unitProps("rackA03", "#4ade80")} />
                    </div>
                  </div>
                  <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2">
                    <TwinUnit node={twinNodes.aisleB} {...unitProps("aisleB", "#67e8f9")} />
                    <div className="mt-1 flex justify-center gap-1">
                      <TwinUnit node={twinNodes.rackB01} {...unitProps("rackB01", "#4ade80")} />
                      <TwinUnit node={twinNodes.rackB02} {...unitProps("rackB02", "#4ade80")} />
                      <TwinUnit node={twinNodes.rackB03} {...unitProps("rackB03", "#4ade80")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-500/30 bg-[#0b1021]/40 p-2">
                <div className="mb-2 text-[10px] font-semibold text-slate-300">IT 基础设施域</div>
                <div className="rounded-md border border-emerald-400/25 bg-emerald-400/5 p-2">
                  <div className="mb-1 text-[10px] text-emerald-200/80">计算域</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <TwinUnit node={twinNodes.job} {...unitProps("job", "#34d399")} />
                    <TwinUnit node={twinNodes.vm} {...unitProps("vm", "#34d399")} />
                    <TwinUnit node={twinNodes.gpu} {...unitProps("gpu", "#34d399")} />
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-violet-400/30 bg-violet-400/5 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-violet-200/80">存储域</span>
                      {showHeat ? <HeatChip domain="Storage" /> : null}
                    </div>
                    <TwinUnit node={twinNodes.san} {...unitProps("san", "#c084fc")} />
                  </div>
                  <div className="rounded-md border border-sky-400/30 bg-sky-400/5 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-sky-200/80">网络域</span>
                      {showHeat ? <HeatChip domain="Network" /> : null}
                    </div>
                    <TwinUnit node={twinNodes.coresw} {...unitProps("coresw", "#38bdf8")} />
                  </div>
                </div>
              </div>
            </div>
        </Layer>

        <Layer title="基础设施层 · 一层" subtitle="Floor 1 · Facility Infrastructure" accent="#fbbf24">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-amber-100">电力域</span>
                {showHeat ? <HeatChip domain="Power" /> : null}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <TwinUnit node={twinNodes.transformer} {...unitProps("transformer", "#facc15")} />
                <TwinUnit node={twinNodes.ups} {...unitProps("ups", "#facc15")} />
                <TwinUnit node={twinNodes.pdu} {...unitProps("pdu", "#facc15")} />
              </div>
            </div>
            <div className="rounded-md border border-cyan-400/30 bg-cyan-400/5 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-cyan-100">制冷域</span>
                {showHeat ? <HeatChip domain="Cooling" /> : null}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <TwinUnit node={twinNodes.chiller} {...unitProps("chiller", "#22d3ee")} />
                <TwinUnit node={twinNodes.pump} {...unitProps("pump", "#22d3ee")} />
                <TwinUnit node={twinNodes.crah} {...unitProps("crah", "#22d3ee")} />
              </div>
            </div>
          </div>
        </Layer>
          </>
        )}
      </div>

      <div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-cyan-100/70">
        {localize ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#e53935", boxShadow: "0 0 8px #e53935" }} />
              故障定位位置
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-400/50" />
              其余节点降对比
            </span>
          </>
        ) : markSelectedAsAlarm ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#e53935", boxShadow: "0 0 8px #e53935" }} />
              告警位置
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#fb8c00", boxShadow: "0 0 8px #fb8c00" }} />
              可能影响节点
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[#e53935]" />
              可能影响路径
            </span>
          </>
        ) : impact || chainFocus === "impact" ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#e53935", boxShadow: "0 0 8px #e53935" }} />
              根因资产 · Root Cause Asset
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#fb8c00", boxShadow: "0 0 8px #fb8c00" }} />
              受影响资产 · Affected Assets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "#60a5fa", boxShadow: "0 0 8px #60a5fa" }} />
              受影响服务 · Affected Services
            </span>
          </>
        ) : chainFocus === "power" || chainFocus === "cooling" || chainFocus === "network" ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: CHAIN_COLOR[chainFocus], boxShadow: `0 0 8px ${CHAIN_COLOR[chainFocus]}` }} />
            {chainFocus === "power" ? "供电链路 · Power Chain" : chainFocus === "cooling" ? "制冷链路 · Cooling Chain" : "网络链路 · Network Chain"}
          </span>
        ) : (
          edgeKinds
            .filter(([kind]) => kind !== "spatial")
            .map(([kind, meta]) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                {meta.label}
              </span>
            ))
        )}
      </div>

      <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible">
        {links.map((link, i) => {
          if (link.kind === "impact") {
            return (
              <path
                key={`impact-${i}`}
                d={link.d}
                className="impact-twin-flow"
                stroke={link.active ? "#e53935" : "#fb8c00"}
                strokeWidth={link.active ? 3.2 : 1.6}
                opacity={link.active ? 0.95 : 0.22}
                style={{ filter: link.active ? "drop-shadow(0 0 6px #e53935)" : undefined }}
              />
            )
          }
          return (
            <path
              key={`${link.kind}-${i}`}
              d={link.d}
              className="twin-flow"
              stroke={TWIN_EDGE_STYLE[link.kind].color}
              strokeWidth={impact ? 1.1 : 1.8}
              opacity={impact ? 0.22 : 0.92}
              style={{ filter: impact ? undefined : `drop-shadow(0 0 4px ${TWIN_EDGE_STYLE[link.kind].color})` }}
            />
          )
        })}
      </svg>
    </div>
  )
}
