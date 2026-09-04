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
import { Panel } from "@/components/primitives"
import { DIGITAL_TWIN_VERSION } from "@/lib/ui-revision"

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

function DeviceGlyph({ id, color }: { id: NodeId; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.6, strokeLinejoin: "round" as const }
  return (
    <svg viewBox="0 0 48 36" className="h-8 w-11" aria-hidden>
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

function TwinUnit({ node, color }: { node: TwinNode; color: string }) {
  return (
    <div data-twin-id={node.id} className="flex w-[108px] flex-col items-center gap-1">
      <div
        className="twin-breathe grid h-12 w-[72px] place-items-center rounded-md border"
        style={{
          borderColor: `${color}88`,
          background: `${color}14`,
          boxShadow: `0 0 14px ${color}40, inset 0 0 10px ${color}18`,
        }}
      >
        <DeviceGlyph id={node.id as NodeId} color={color} />
      </div>
      <div className="text-center leading-tight">
        <div className="text-[11px] font-semibold text-cyan-50">{node.name}</div>
        <div className="font-mono text-[9px] text-cyan-200/60">{node.code}</div>
      </div>
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
}: {
  title: string
  subtitle: string
  children: ReactNode
  accent: string
}) {
  return (
    <section
      className="relative rounded-xl border px-3 py-2.5"
      style={{
        borderColor: `${accent}55`,
        background: "linear-gradient(180deg, rgba(14,23,48,0.92) 0%, rgba(11,16,33,0.72) 100%)",
        boxShadow: `inset 0 0 0 1px ${accent}22, 0 0 24px ${accent}14`,
      }}
    >
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-[12px] font-semibold text-cyan-50">{title}</h3>
        <span className="text-[10px] text-cyan-200/55">{subtitle}</span>
      </div>
      {children}
    </section>
  )
}

export function DigitalTwinMap() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [links, setLinks] = useState<{ d: string; kind: TwinEdgeKind }[]>([])
  const edgeKinds = useMemo(
    () => Object.entries(TWIN_EDGE_STYLE) as [TwinEdgeKind, (typeof TWIN_EDGE_STYLE)[TwinEdgeKind]][],
    [],
  )

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const draw = () => {
      const origin = stage.getBoundingClientRect()
      const centerOf = (id: string) => {
        const el = stage.querySelector(`[data-twin-id="${id}"]`)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return {
          x: r.left + r.width / 2 - origin.left,
          y: r.top + r.height / 2 - origin.top,
        }
      }

      const next = twinEdges.flatMap((edge) => {
        if (edge.kind === "spatial") return []
        const from = centerOf(edge.from)
        const to = centerOf(edge.to)
        if (!from || !to) return []
        const lift = Math.max(18, Math.abs(from.y - to.y) * 0.28)
        const d = `M ${from.x} ${from.y} C ${from.x} ${from.y - lift}, ${to.x} ${to.y - lift}, ${to.x} ${to.y}`
        return [{ d, kind: edge.kind }]
      })
      setLinks(next)
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
  }, [])

  return (
    <Panel title="Digital Twin" subtitle="数字孪生" bodyClassName="p-0 overflow-hidden">
      <div
        id="digital-twin-map"
        ref={stageRef}
        className="twin-space relative min-h-[560px] overflow-hidden px-3 py-3 text-cyan-50"
      >
        <div className="twin-particles pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

        <div className="relative z-10 mb-2 flex items-center justify-between px-1">
          <div>
            <div className="text-[13px] font-semibold tracking-wide text-cyan-50">DC01 数据中心 · A 栋</div>
            <div className="text-[10px] text-cyan-200/55">实时数字孪生 · 二维拓扑动线</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-cyan-200/45">{DIGITAL_TWIN_VERSION}</span>
            <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-200">
              LIVE
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-2.5">
          <Layer title="业务逻辑层" subtitle="Business Domain" accent="#60a5fa">
            <div className="flex flex-wrap items-center justify-center gap-10 py-1">
              <TwinUnit node={twinNodes.aiservice} color="#60a5fa" />
              <TwinUnit node={twinNodes.aiplatform} color="#60a5fa" />
            </div>
          </Layer>

          <Layer title="IT 负载层 · 二层大厅" subtitle="Floor 2 · IT Hall A" accent="#38bdf8">
            <div className="grid gap-3 lg:grid-cols-[1.05fr_1.35fr]">
              <div className="rounded-lg border border-slate-500/30 bg-[#0b1021]/40 p-2">
                <div className="mb-2 text-[10px] font-semibold text-slate-300">空间布局</div>
                <div className="space-y-2">
                  <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2">
                    <TwinUnit node={twinNodes.aisleA} color="#67e8f9" />
                    <div className="mt-1 flex justify-center gap-1">
                      <TwinUnit node={twinNodes.rackA01} color="#4ade80" />
                      <TwinUnit node={twinNodes.rackA02} color="#4ade80" />
                      <TwinUnit node={twinNodes.rackA03} color="#4ade80" />
                    </div>
                  </div>
                  <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2">
                    <TwinUnit node={twinNodes.aisleB} color="#67e8f9" />
                    <div className="mt-1 flex justify-center gap-1">
                      <TwinUnit node={twinNodes.rackB01} color="#4ade80" />
                      <TwinUnit node={twinNodes.rackB02} color="#4ade80" />
                      <TwinUnit node={twinNodes.rackB03} color="#4ade80" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-500/30 bg-[#0b1021]/40 p-2">
                <div className="mb-2 text-[10px] font-semibold text-slate-300">IT 基础设施域</div>
                <div className="rounded-md border border-emerald-400/25 bg-emerald-400/5 p-2">
                  <div className="mb-1 text-[10px] text-emerald-200/80">计算域</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <TwinUnit node={twinNodes.job} color="#34d399" />
                    <TwinUnit node={twinNodes.vm} color="#34d399" />
                    <TwinUnit node={twinNodes.gpu} color="#34d399" />
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-violet-400/30 bg-violet-400/5 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-violet-200/80">存储域</span>
                      <HeatChip domain="Storage" />
                    </div>
                    <TwinUnit node={twinNodes.san} color="#c084fc" />
                  </div>
                  <div className="rounded-md border border-sky-400/30 bg-sky-400/5 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-sky-200/80">网络域</span>
                      <HeatChip domain="Network" />
                    </div>
                    <TwinUnit node={twinNodes.coresw} color="#38bdf8" />
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
                  <HeatChip domain="Power" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <TwinUnit node={twinNodes.transformer} color="#facc15" />
                  <TwinUnit node={twinNodes.ups} color="#facc15" />
                  <TwinUnit node={twinNodes.pdu} color="#facc15" />
                </div>
              </div>
              <div className="rounded-md border border-cyan-400/30 bg-cyan-400/5 p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-cyan-100">制冷域</span>
                  <HeatChip domain="Cooling" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <TwinUnit node={twinNodes.chiller} color="#22d3ee" />
                  <TwinUnit node={twinNodes.pump} color="#22d3ee" />
                  <TwinUnit node={twinNodes.crah} color="#22d3ee" />
                </div>
              </div>
            </div>
          </Layer>
        </div>

        <div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-cyan-100/70">
          {edgeKinds
            .filter(([kind]) => kind !== "spatial")
            .map(([kind, meta]) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                {meta.label}
              </span>
            ))}
        </div>

        <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible">
          {links.map((link, i) => (
            <path
              key={`${link.kind}-${i}`}
              d={link.d}
              className="twin-flow"
              stroke={TWIN_EDGE_STYLE[link.kind].color}
              strokeWidth={1.8}
              opacity={0.92}
              style={{ filter: `drop-shadow(0 0 4px ${TWIN_EDGE_STYLE[link.kind].color})` }}
            />
          ))}
        </svg>
      </div>
    </Panel>
  )
}
