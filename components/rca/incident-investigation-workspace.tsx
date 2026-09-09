"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown, Plus } from "lucide-react"
import { InvestigationChatDialog } from "@/components/rca/investigation-chat-dialog"
import { EventEvolutionTimeline } from "@/components/rca/event-evolution-timeline"
import { TopologyImpactExplorer } from "@/components/rca/topology-impact-explorer"
import { IncidentSelectorBar } from "@/components/scenario/incident-selector"
import { Panel } from "@/components/primitives"
import { scenarios, type ScenarioKey } from "@/data/scenarios"
import {
  getInvestigationWorkbench,
  type RootCauseCandidate,
} from "@/lib/manual-investigation-data"
import { cn } from "@/lib/utils"

const HEALTH_STYLE = {
  Critical: "text-[#e53935] bg-[#e53935]/10 border-[#e53935]/30",
  Degraded: "text-[#fb8c00] bg-[#fb8c00]/10 border-[#fb8c00]/30",
  Impacted: "text-[#c9a227] bg-[#c9a227]/12 border-[#c9a227]/30",
  Watch: "text-l3 bg-muted/40 border-border",
} as const

type CandidateSort = "confidence" | "alarmCount" | "historicalSimilarity" | "evidenceCount"

export function IncidentInvestigationWorkspace() {
  const [focusKey, setFocusKey] = useState<ScenarioKey>("power")
  const [chatOpen, setChatOpen] = useState(true)
  const [addChainId, setAddChainId] = useState<string | null>(null)
  const [cursorSec, setCursorSec] = useState(0)

  const scenario = scenarios[focusKey]
  const workbench = useMemo(() => getInvestigationWorkbench(scenario), [scenario])

  const [selectedId, setSelectedId] = useState(workbench.candidates[0]?.id ?? "")
  const [whyId, setWhyId] = useState<string | null>(workbench.candidates[0]?.id ?? null)
  const [sortKey, setSortKey] = useState<CandidateSort>("confidence")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    const first = workbench.candidates[0]?.id ?? ""
    setSelectedId(first)
    setWhyId(first)
    setSortKey("confidence")
    setSortDir("desc")
    setAddChainId(null)
    setCursorSec(0)
  }, [focusKey, workbench.candidates])

  const candidates = useMemo(() => {
    const list = [...workbench.candidates]
    list.sort((a, b) => (sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]))
    return list
  }, [workbench.candidates, sortKey, sortDir])

  const selected = candidates.find((item) => item.id === selectedId) ?? candidates[0]

  const toggleSort = (key: CandidateSort) => {
    if (sortKey === key) setSortDir((dir) => (dir === "desc" ? "asc" : "desc"))
    else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  return (
    <div
      id="incident-investigation-workspace"
      className={cn(
        "grid items-start gap-4 transition-[grid-template-columns] duration-300",
        chatOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)_44px]",
      )}
    >
      <div className="min-w-0 space-y-4">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <IncidentSelectorBar
            className="border-b border-border"
            selectedKey={focusKey}
            onSelect={setFocusKey}
            labelZh="事故选择"
            labelEn=""
          />
          <div className="px-4 py-2.5">
            <div className="text-[11px] font-bold text-l3">事故调查</div>
            <div className="text-[13px] font-semibold text-l1">Evidence Reconstruction Workspace</div>
            <div className="text-[10px] text-l4">
              发生了什么 → 影响了谁 → 核验确认 · Event Evolution + Impact Explorer
            </div>
          </div>
        </div>

        <EventEvolutionTimeline
          scenario={scenario}
          externalAddChainId={addChainId}
          onExternalAddConsumed={() => setAddChainId(null)}
          cursorSec={cursorSec}
          onCursorSecChange={setCursorSec}
        />

        <TopologyImpactExplorer scenario={scenario} cursorSec={cursorSec} />

        <DetermineCause
          candidates={candidates}
          selectedId={selected?.id ?? ""}
          whyId={whyId}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onSelect={setSelectedId}
          onWhy={setWhyId}
          onAddToTimeline={(chainId) => setAddChainId(chainId)}
        />
        {selected ? (
          <DeviceEvidence candidate={selected} onAddToTimeline={() => setAddChainId(selected.chainId)} />
        ) : null}
      </div>

      <InvestigationChatDialog
        focusKey={focusKey}
        ruleKey="raw"
        selectedEvent={null}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  )
}

function DetermineCause({
  candidates,
  selectedId,
  whyId,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  onWhy,
  onAddToTimeline,
}: {
  candidates: RootCauseCandidate[]
  selectedId: string
  whyId: string | null
  sortKey: CandidateSort
  sortDir: "asc" | "desc"
  onSort: (key: CandidateSort) => void
  onSelect: (id: string) => void
  onWhy: (id: string | null) => void
  onAddToTimeline: (chainId: string) => void
}) {
  const columns: { key: CandidateSort; zh: string; en: string }[] = [
    { key: "confidence", zh: "置信度", en: "Confidence" },
    { key: "alarmCount", zh: "告警数", en: "Alarm Count" },
    { key: "historicalSimilarity", zh: "历史相似度", en: "Historical Similarity" },
    { key: "evidenceCount", zh: "证据数", en: "Evidence Count" },
  ]

  return (
    <Panel
      title="根因候选"
      subtitle="Root Cause Candidates"
      description="从候选加入时间线，扩展传播链并核验结论"
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-border bg-muted/40 text-[10px] text-l3">
            <tr>
              <th className="px-4 py-2.5 font-semibold">
                <div>根因候选</div>
                <div className="font-normal text-l4">Root Cause Candidates</div>
              </th>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5">
                  <button type="button" onClick={() => onSort(col.key)} className="text-left">
                    <div className="inline-flex items-center gap-1 font-semibold">
                      {col.zh}
                      {sortKey === col.key ? (
                        sortDir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />
                      ) : null}
                    </div>
                    <div className="font-normal text-l4">{col.en}</div>
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5">
                <div className="font-semibold">操作</div>
                <div className="font-normal text-l4">Actions</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((item) => {
              const active = item.id === selectedId
              const open = whyId === item.id
              return (
                <tr
                  key={item.id}
                  className={cn("border-b border-border/70 last:border-0", active && "bg-primary/8")}
                >
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onSelect(item.id)} className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-l1">{item.nameZh}</span>
                        {item.likelyRoot ? (
                          <span className="rounded-full border border-[#e53935]/35 bg-[#e53935]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#e53935]">
                            Top Candidate
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-l4">{item.name}</div>
                    </button>
                  </td>
                  <td className="px-3 py-3 font-mono text-[16px] font-extrabold tabular text-l1">{item.confidence}%</td>
                  <td className="px-3 py-3 font-mono text-[13px] font-bold tabular text-l2">{item.alarmCount}</td>
                  <td className="px-3 py-3 font-mono text-[13px] font-bold tabular text-l2">{item.historicalSimilarity}%</td>
                  <td className="px-3 py-3 font-mono text-[13px] font-bold tabular text-l2">{item.evidenceCount}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(item.id)
                          onWhy(open ? null : item.id)
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-l2 hover:border-primary/40"
                      >
                        Why
                        <ChevronDown className={cn("size-3 transition", open && "rotate-180")} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToTimeline(item.chainId)}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary"
                      >
                        <Plus className="size-3" />
                        Add To Timeline
                      </button>
                    </div>
                    {open ? (
                      <div className="mt-2 max-w-xs text-[11px] leading-relaxed text-l2">
                        <p>{item.whyZh}</p>
                        <p className="mt-1 text-l4">{item.why}</p>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function DeviceEvidence({
  candidate,
  onAddToTimeline,
}: {
  candidate: RootCauseCandidate
  onAddToTimeline: () => void
}) {
  return (
    <Panel title="设备证据" subtitle="Device Evidence">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[16px] font-extrabold text-l1">{candidate.nameZh}</div>
          <div className="text-[12px] text-l4">{candidate.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", HEALTH_STYLE[candidate.health])}>
            {candidate.health}
          </span>
          <button
            type="button"
            onClick={onAddToTimeline}
            className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary"
          >
            <Plus className="size-3" />
            Add To Timeline
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <EvidenceCard zh="健康指标" en="Health Metrics">
          <div className="space-y-2">
            {candidate.metrics.map((metric) => (
              <div key={metric.en} className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-l3">{metric.zh}</span>
                <span className="font-mono text-[12px] font-bold text-l1">{metric.value}</span>
              </div>
            ))}
          </div>
        </EvidenceCard>
        <EvidenceCard zh="电压" en="Voltage">
          <div className="text-[22px] font-extrabold text-l1">{candidate.voltage}</div>
        </EvidenceCard>
        <EvidenceCard zh="电池状态" en="Battery Status">
          <div className="text-[16px] font-extrabold text-l1">{candidate.batteryStatus}</div>
        </EvidenceCard>
        <EvidenceCard zh="关联事故" en="Related Incidents">
          <ChipList items={candidate.relatedIncidents} />
        </EvidenceCard>
        <div className="lg:col-span-2">
          <EvidenceCard zh="历史案例" en="Historical Cases">
            <ChipList items={candidate.historicalCases} />
          </EvidenceCard>
        </div>
      </div>

      <details className="mt-3 rounded-lg border border-border bg-muted/15 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-l2">
          拓扑关系 · Topology Relationships
        </summary>
        <div className="mt-2">
          <ChipList items={candidate.topologyRelationships} />
        </div>
      </details>
    </Panel>
  )
}

function EvidenceCard({ zh, en, children }: { zh: string; en: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 px-3 py-3">
      <div className="mb-2 text-[10px] font-bold text-l3">{zh}</div>
      <div className="-mt-1 mb-2 text-[9px] text-l4">{en}</div>
      {children}
    </div>
  )
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-l2">
          {item}
        </span>
      ))}
    </div>
  )
}
