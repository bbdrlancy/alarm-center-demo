"use client"

import { useEffect, useMemo, useState } from "react"
import { Network, Zap, Server, Cpu, Layers } from "lucide-react"
import type { NodeStatus } from "@/lib/incident-data"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useDemoStory } from "@/hooks/use-demo-story"
import { Panel, ModuleConclusion } from "@/components/primitives"

const statusStyle: Record<NodeStatus, { color: string; label: string }> = {
  root: { color: "var(--p1)", label: "Root Cause" },
  impacted: { color: "var(--p2)", label: "Impacted" },
  normal: { color: "var(--ok)", label: "Healthy" },
}

const chainIcons = [Zap, Layers, Layers, Server, Cpu]

export function TopologyGraph() {
  const { scenario } = useDemoScenario()
  const nodes = scenario.impactChain
  const [selected, setSelected] = useState<string | null>(null)
  const { stage, playing, runId } = useDemoStory()

  useEffect(() => {
    if (stage !== 4 || !playing) return
    setSelected(nodes[0]?.id ?? null)
  }, [stage, playing, runId, nodes])

  useEffect(() => {
    setSelected(nodes[0]?.id ?? null)
  }, [scenario.id, nodes])

  const highlight = useMemo(() => {
    if (!selected) return null
    const idx = nodes.findIndex((n) => n.id === selected)
    if (idx < 0) return null
    return new Set(nodes.slice(idx).map((n) => n.id))
  }, [selected, nodes])

  return (
    <div id="topology-graph">
      <Panel
        title="影响链路"
        subtitle="Impact Chain"
        description={`${scenario.domain} · ${scenario.incident.rootCause}`}
        icon={<Network className="size-4" />}
        action={
          <div className="flex items-center gap-2.5 text-[10px]">
            {(["root", "impacted", "normal"] as NodeStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1 text-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: statusStyle[s].color }} />
                {statusStyle[s].label}
              </span>
            ))}
          </div>
        }
      >
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
          {nodes.map((node, i) => {
            const Icon = chainIcons[i] ?? Network
            const st = statusStyle[node.status]
            const dimmed = highlight ? !highlight.has(node.id) : false
            const isSel = selected === node.id
            const isLast = i === nodes.length - 1
            return (
              <div key={node.id} className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelected((cur) => (cur === node.id ? null : node.id))}
                  className={[
                    "flex w-[150px] flex-col gap-2 rounded-lg border px-3 py-3 text-left transition-all duration-300",
                    dimmed ? "opacity-30" : "opacity-100",
                    isSel ? "shadow-[0_0_0_2px_var(--primary)]" : "",
                  ].join(" ")}
                  style={{
                    borderColor: `color-mix(in srgb, ${st.color} 45%, transparent)`,
                    backgroundColor: `color-mix(in srgb, ${st.color} 10%, var(--card))`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="grid size-8 place-items-center rounded-md"
                      style={{ backgroundColor: "var(--panel)", color: st.color }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="size-2 rounded-full" style={{ backgroundColor: st.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-foreground">{node.label}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{node.sub}</div>
                  </div>
                  {node.status === "root" ? (
                    <span className="w-fit rounded bg-[var(--p1)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      ROOT CAUSE
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium" style={{ color: st.color }}>
                      {st.label}
                    </span>
                  )}
                </button>
                {!isLast ? (
                  <svg width="22" height="12" viewBox="0 0 22 12" className="shrink-0">
                    <line
                      x1="0"
                      y1="6"
                      x2="22"
                      y2="6"
                      stroke={
                        highlight && highlight.has(node.id) && highlight.has(nodes[i + 1]!.id)
                          ? "var(--primary)"
                          : "var(--p2)"
                      }
                      strokeWidth="2"
                      opacity={
                        highlight && !(highlight.has(node.id) && highlight.has(nodes[i + 1]!.id))
                          ? 0.2
                          : 0.9
                      }
                    />
                    <polygon
                      points="16,2 22,6 16,10"
                      fill={
                        highlight && highlight.has(node.id) && highlight.has(nodes[i + 1]!.id)
                          ? "var(--primary)"
                          : "var(--p2)"
                      }
                      opacity={
                        highlight && !(highlight.has(node.id) && highlight.has(nodes[i + 1]!.id))
                          ? 0.2
                          : 0.9
                      }
                    />
                  </svg>
                ) : null}
              </div>
            )
          })}
        </div>

        <ModuleConclusion>
          {selected
            ? `${scenario.domain} 场景：已定位 ${nodes.find((n) => n.id === selected)?.label} 的下游影响范围。`
            : `点击节点查看 ${scenario.name} 传播路径与 ${scenario.incident.businessImpact} 影响范围。`}
        </ModuleConclusion>
      </Panel>
    </div>
  )
}
