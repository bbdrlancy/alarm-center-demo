"use client"

import { useMemo, useState } from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { Panel } from "@/components/primitives"
import { TwinSchematic, type TwinChainFocus } from "@/components/incident-portfolio/twin-schematic"
import { getScenarioByKey, type ScenarioKey } from "@/data/scenarios"
import { getImpactTwinHops } from "@/lib/impact-twin"
import { cn } from "@/lib/utils"

const TABS: { id: TwinChainFocus; zh: string; en: string }[] = [
  { id: "impact", zh: "影响路径", en: "Impact Path" },
  { id: "power", zh: "供电链路", en: "Power Chain" },
  { id: "cooling", zh: "制冷链路", en: "Cooling Chain" },
  { id: "network", zh: "网络链路", en: "Network Chain" },
]

const TAB_SUBTITLE: Record<TwinChainFocus, string> = {
  topology: "全量拓扑 · Topology View",
  business: "业务服务拓扑 · Business View",
  impact: "默认高亮根因资产、受影响资产与受影响服务",
  power: "供电链路 · Power Chain",
  cooling: "制冷链路 · Cooling Chain",
  network: "网络链路 · Network Chain",
}

export function DigitalTwinMap({
  scenarioKey,
  title = "数字孪生",
  subtitle = "L4 Digital Twin",
}: {
  scenarioKey?: ScenarioKey
  title?: string
  subtitle?: string
}) {
  const [tab, setTab] = useState<TwinChainFocus>("impact")
  const [expanded, setExpanded] = useState(false)
  const hops = useMemo(
    () => (scenarioKey ? getImpactTwinHops(getScenarioByKey(scenarioKey)) : []),
    [scenarioKey],
  )
  const impactMode = Boolean(scenarioKey) && tab === "impact"

  return (
    <Panel title={title} subtitle={subtitle} bodyClassName="p-0 overflow-hidden">
      <div id="digital-twin-map">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card px-3 py-2">
          <div className="inline-flex flex-wrap rounded-lg border border-border bg-panel p-0.5">
            {TABS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.zh}
                  <span className="ml-1 hidden font-normal opacity-80 sm:inline">{item.en}</span>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            {expanded ? "收起详情" : "放大"}
          </button>
        </div>

        <div
          className={cn(!expanded && "cursor-zoom-in")}
          onClick={() => {
            if (!expanded) setExpanded(true)
          }}
        >
          <TwinSchematic
            mode={impactMode ? "impact" : "live"}
            hops={hops}
            compact={!expanded}
            chainFocus={tab}
            showDomainHeat={expanded}
            subtitle={
              impactMode
                ? "当前事故根因、受影响资产与受影响服务"
                : TAB_SUBTITLE[tab]
            }
          />
        </div>

        {expanded ? null : (
          <p className="border-t border-border/60 bg-card px-3 py-1.5 text-center text-[10px] text-muted-foreground">
            点击放大后展示详细机架、服务器与设备名
          </p>
        )}
      </div>
    </Panel>
  )
}
