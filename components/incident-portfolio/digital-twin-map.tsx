import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { domainHeatmap, type RiskLevel } from "@/lib/incident-portfolio-data"
import {
  TWIN_EDGE_STYLE,
  twinNodes,
  type TwinEdgeKind,
  type TwinHeatDomain,
} from "@/lib/digital-twin-topology"
import { Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

const riskTone: Record<RiskLevel, string> = {
  Critical: "var(--p1)",
  High: "var(--p2)",
  Medium: "var(--info)",
  Low: "var(--ok)",
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

function HeatBadge({ domain }: { domain: TwinHeatDomain }) {
  const cell = heatmapOf(domain)
  const color = riskTone[cell.riskLevel]
  return (
    <div
      className="rounded-md border bg-card px-2 py-1 text-right leading-tight"
      style={{ borderColor: color, color }}
    >
      <div className="text-[10px] font-semibold">{DOMAIN_ZH[domain]}</div>
      <div className="text-[9px] opacity-90">
        {cell.incidentCount} 事故 · {cell.criticalCount} 紧急
      </div>
      <div className="text-[9px] font-semibold tracking-wide">{cell.riskLevel.toUpperCase()} RISK</div>
    </div>
  )
}

function DeviceGlyph({ id, color }: { id: NodeId; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.6, strokeLinejoin: "round" as const }
  return (
    <svg viewBox="0 0 48 36" className="h-9 w-12" aria-hidden>
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
          <rect x="14" y="4" width="20" height="28" rx="1.5" {...common} />
          {[10, 16, 22, 28].map((y) => (
            <path key={y} d={`M17 ${y}h14`} {...common} />
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

function DeviceCard({
  id,
  color,
  compact = false,
}: {
  id: NodeId
  color: string
  compact?: boolean
}) {
  const node = twinNodes[id]
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-border bg-card text-center shadow-sm",
        compact ? "w-[88px] px-1.5 py-1.5" : "w-[118px] px-2 py-2",
      )}
    >
      <DeviceGlyph id={id} color={color} />
      <div className={cn("mt-1 font-semibold text-foreground", compact ? "text-[10px]" : "text-[11px]")}>
        {node.name}
      </div>
      <div className="font-mono text-[9px] text-muted-foreground">{node.code}</div>
    </div>
  )
}

function FlowArrow({ kind, label }: { kind: TwinEdgeKind; label: string }) {
  const color = TWIN_EDGE_STYLE[kind].color
  return (
    <div className="flex min-w-[56px] flex-col items-center justify-center px-1">
      <ChevronRight className="size-4" style={{ color }} />
      <span className="text-[9px] font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

function Zone({
  title,
  badge,
  children,
  className,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-border/80 bg-card/70 p-3", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">{title}</div>
        {badge}
      </div>
      {children}
    </div>
  )
}

function Chain({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-y-2">{children}</div>
}

export function DigitalTwinMap() {
  return (
    <Panel title="Digital Twin" subtitle="数字孪生" bodyClassName="p-0 overflow-hidden">
      <div id="digital-twin-map" className="twin-schematic space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-foreground">DC01 数据中心 · A 栋</div>
            <div className="text-[10px] text-muted-foreground">二维拓扑 · 设备按楼层与域分组</div>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            LIVE
          </div>
        </div>

        <Zone title="业务域 · Business Domain">
          <Chain>
            <DeviceCard id="aiservice" color="#2563eb" />
            <FlowArrow kind="business" label="依赖" />
            <DeviceCard id="aiplatform" color="#2563eb" />
            <FlowArrow kind="business" label="运行于" />
            <span className="text-[10px] text-muted-foreground">↓ 2 层计算域</span>
          </Chain>
        </Zone>

        <Zone title="2 层 · IT 机房 A">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="rounded-md border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                <div className="mb-2 text-[10px] font-semibold text-cyan-800">冷通道 A</div>
                <div className="flex flex-wrap items-end gap-2">
                  <DeviceCard id="aisleA" color="#0891b2" compact />
                  <DeviceCard id="rackA01" color="#16a34a" compact />
                  <DeviceCard id="rackA02" color="#16a34a" compact />
                  <DeviceCard id="rackA03" color="#16a34a" compact />
                </div>
              </div>
              <div className="rounded-md border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                <div className="mb-2 text-[10px] font-semibold text-cyan-800">冷通道 B</div>
                <div className="flex flex-wrap items-end gap-2">
                  <DeviceCard id="aisleB" color="#0891b2" compact />
                  <DeviceCard id="rackB01" color="#16a34a" compact />
                  <DeviceCard id="rackB02" color="#16a34a" compact />
                  <DeviceCard id="rackB03" color="#16a34a" compact />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-border bg-background/80 p-3">
                <div className="mb-2 text-[10px] font-semibold text-muted-foreground">计算域</div>
                <Chain>
                  <DeviceCard id="job" color="#059669" />
                  <FlowArrow kind="business" label="托管于" />
                  <DeviceCard id="vm" color="#059669" />
                  <FlowArrow kind="business" label="托管于" />
                  <DeviceCard id="gpu" color="#059669" />
                </Chain>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-background/80 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-[10px] font-semibold text-muted-foreground">存储域</div>
                    <HeatBadge domain="Storage" />
                  </div>
                  <DeviceCard id="san" color="#7c3aed" />
                </div>
                <div className="rounded-md border border-border bg-background/80 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-[10px] font-semibold text-muted-foreground">网络域</div>
                    <HeatBadge domain="Network" />
                  </div>
                  <DeviceCard id="coresw" color="#0284c7" />
                </div>
              </div>
            </div>
          </div>
        </Zone>

        <div className="grid gap-3 lg:grid-cols-2">
          <Zone title="1 层 · 电力域" badge={<HeatBadge domain="Power" />}>
            <Chain>
              <DeviceCard id="transformer" color="#ca8a04" />
              <FlowArrow kind="power" label="供电" />
              <DeviceCard id="ups" color="#ca8a04" />
              <FlowArrow kind="power" label="供电" />
              <DeviceCard id="pdu" color="#ca8a04" />
            </Chain>
          </Zone>
          <Zone title="1 层 · 制冷域" badge={<HeatBadge domain="Cooling" />}>
            <Chain>
              <DeviceCard id="chiller" color="#0891b2" />
              <FlowArrow kind="cooling" label="供水" />
              <DeviceCard id="pump" color="#0891b2" />
              <FlowArrow kind="cooling" label="供水" />
              <DeviceCard id="crah" color="#0891b2" />
            </Chain>
          </Zone>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/70 pt-2 text-[10px] text-muted-foreground">
          <span>PDU → 全部机架 · 供电</span>
          <span>CRAH → 冷通道 A/B · 制冷</span>
          <span>GPU 服务器 → 机架 A01 · 安装</span>
          <span>GPU 服务器 → SAN / 核心交换机 · 数据</span>
        </div>
      </div>
    </Panel>
  )
}
