"use client"

import { useEffect, useMemo, useState } from "react"
import { Network } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { useDemoStory } from "@/hooks/use-demo-story"
import { downstreamChainIds, getImpactTwinHops, impactChainSentence } from "@/lib/impact-twin"
import { cn } from "@/lib/utils"

export function TopologyGraph() {
  const { scenario } = useDemoScenario()
  const hops = useMemo(() => getImpactTwinHops(scenario), [scenario])
  const [selected, setSelected] = useState<string | null>(null)
  const { stage, playing, runId } = useDemoStory()

  useEffect(() => {
    setSelected(hops[0]?.chainId ?? null)
  }, [scenario.id, hops])

  useEffect(() => {
    if (stage !== 4 || !playing) return
    let i = 0
    setSelected(hops[0]?.chainId ?? null)
    const timer = window.setInterval(() => {
      i += 1
      const hop = hops[Math.min(i, hops.length - 1)]
      if (hop) setSelected(hop.chainId)
      if (i >= hops.length - 1) window.clearInterval(timer)
    }, 1100)
    return () => window.clearInterval(timer)
  }, [stage, playing, runId, hops])

  const activeHops = useMemo(() => downstreamChainIds(hops, selected), [hops, selected])
  const selectedHop = hops.find((hop) => hop.chainId === selected)

  return (
    <div id="topology-graph">
      <Panel
        title="影响链路"
        subtitle="Impact Chain · Digital Twin Overlay"
        description={`${scenario.domain} · ${scenario.incident.rootCause} · 在数字孪生图上标记传播路径`}
        icon={<Network className="size-4" />}
        bodyClassName="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {hops.map((hop, index) => {
            const active = !activeHops || activeHops.has(hop.chainId)
            const isSel = selected === hop.chainId
            const color = hop.status === "root" ? "#e53935" : "#fb8c00"
            return (
              <div key={hop.chainId} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelected((current) => (current === hop.chainId ? null : hop.chainId))}
                  className={cn(
                    "rounded-md border px-2 py-1 text-left transition",
                    isSel && "shadow-[0_0_0_2px_rgba(229,57,53,0.35)]",
                    !active && "opacity-35",
                  )}
                  style={{ borderColor: `${color}66`, background: `${color}12` }}
                >
                  <div className="text-[9px] font-bold uppercase" style={{ color }}>
                    {hop.status === "root" ? "Root Cause" : `Hop ${hop.hop}`}
                  </div>
                  <div className="text-[11px] font-semibold text-foreground">{hop.label}</div>
                  <div className="text-[10px] text-muted-foreground">{hop.sub}</div>
                </button>
                {index < hops.length - 1 ? (
                  <span className="font-mono text-[11px] text-[#fb8c00]">→</span>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <TwinSchematic
            mode="impact"
            hops={hops}
            selectedHop={selected}
            activeHops={activeHops}
            onSelectHop={(chainId) => setSelected((current) => (current === chainId ? null : chainId))}
            subtitle={`${scenario.domain} · ${impactChainSentence(scenario.impactChain)}`}
          />
        </div>

        <ModuleConclusion>
          {selectedHop
            ? `${scenario.domain} 场景：从 ${selectedHop.label} 起，下游影响沿数字孪生拓扑传播至 ${scenario.incident.businessImpact}。`
            : `完整影响链路：${impactChainSentence(scenario.impactChain)}。点击节点查看从该点开始的下游范围。`}
        </ModuleConclusion>
      </Panel>
    </div>
  )
}
