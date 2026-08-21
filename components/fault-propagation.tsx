"use client"

import { Network, Zap, Server, Cpu, Boxes, Plug, Layers } from "lucide-react"
import { propagationNodes, type NodeStatus } from "@/lib/incident-data"
import { useInView } from "@/hooks/use-in-view"
import { useSequentialStages } from "@/hooks/use-sequential-stages"
import { useDemoStory } from "@/hooks/use-demo-story"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const statusStyle: Record<NodeStatus, { color: string; ring: string; bg: string; label: string }> = {
  root: { color: "var(--p1)", ring: "border-[var(--p1)]/60", bg: "bg-[var(--p1)]/15", label: "根因" },
  impacted: { color: "var(--p2)", ring: "border-[var(--p2)]/50", bg: "bg-[var(--p2)]/12", label: "受影响" },
  normal: { color: "var(--ok)", ring: "border-primary/40", bg: "bg-primary/10", label: "正常" },
}

const nodeIcons: Record<string, typeof Zap> = {
  transformer: Zap,
  ups: Plug,
  pdu: Boxes,
  rack: Layers,
  gpu: Server,
  service: Cpu,
}

export function FaultPropagation() {
  const { ref, inView } = useInView()
  const { stage, playing, runId } = useDemoStory()
  const demoActive = stage === 2 && playing
  const { isReached, isCurrent, isFlowing } = useSequentialStages(propagationNodes.length, {
    enabled: inView || demoActive,
    stepDelay: demoActive ? 650 : 900,
    startDelay: demoActive ? 100 : 300,
    resetKey: demoActive ? runId : 0,
  })

  return (
    <Panel
      title="故障传播路径"
      subtitle="Fault Propagation"
      description="清晰呈现故障从源头发向业务的级联传播路径"
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
      <div ref={ref} className="flex flex-col gap-0">
        {propagationNodes.map((node, i) => {
          const st = statusStyle[node.status]
          const Icon = nodeIcons[node.id]
          const isLast = i === propagationNodes.length - 1
          const reached = isReached(i)
          const current = isCurrent(i)
          const flowing = isFlowing(i)

          return (
            <div key={node.id} className="flex flex-col">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500",
                  st.ring,
                  st.bg,
                  !reached && "opacity-35 scale-[0.98]",
                  current && node.status === "root" && "glow-p1 scale-[1.01]",
                  current && node.status !== "root" && "scale-[1.01] shadow-[0_0_16px_-4px_var(--p2)]",
                  reached && !current && "opacity-100",
                )}
              >
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md transition-colors duration-500",
                    current && "ring-2 ring-[var(--p1)]/50",
                  )}
                  style={{ backgroundColor: "var(--panel)", color: st.color }}
                >
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{node.label}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{node.sub}</div>
                </div>
                {node.status === "root" ? (
                  <span
                    className={cn(
                      "rounded-md bg-[var(--p1)] px-2 py-0.5 text-[10px] font-bold text-white transition-opacity",
                      reached ? "opacity-100" : "opacity-0",
                    )}
                  >
                    ROOT CAUSE
                  </span>
                ) : (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-semibold transition-opacity duration-500",
                      reached ? "opacity-100" : "opacity-0",
                    )}
                    style={{ color: st.color, backgroundColor: "var(--panel)" }}
                  >
                    {st.label}
                  </span>
                )}
              </div>
              {!isLast ? (
                <div className="relative flex justify-start pl-[18px]">
                  <svg width="24" height="22" viewBox="0 0 24 22" className="overflow-visible">
                    <defs>
                      <linearGradient id={`flow-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--p1)" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="var(--p1)" stopOpacity="1" />
                        <stop offset="100%" stopColor="var(--p1)" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <line
                      x1="12"
                      y1="0"
                      x2="12"
                      y2="22"
                      stroke="var(--border)"
                      strokeWidth="2"
                    />
                    {flowing ? (
                      <line
                        x1="12"
                        y1="0"
                        x2="12"
                        y2="22"
                        stroke={`url(#flow-${i})`}
                        className="animate-fault-flow"
                      />
                    ) : isReached(i + 1) ? (
                      <line x1="12" y1="0" x2="12" y2="22" stroke="var(--p1)" strokeWidth="2" opacity="0.5" />
                    ) : null}
                  </svg>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <ModuleConclusion>
        故障由 UPS 根因沿供电链级联至 GPU 集群与 AI 业务，处置需从电源源头切断传播路径。
      </ModuleConclusion>
    </Panel>
  )
}
