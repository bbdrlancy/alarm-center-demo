"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bookmark,
  FileDown,
  GitBranch,
  Network,
  Plus,
  Share2,
  StickyNote,
} from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import {
  buildInvestigationEvidence,
  defaultOperatorNote,
  incidentSeverityFilters,
  severityFilters,
  timeRangeOptions,
  type InvestigationNodeEvidence,
  type InvestigationNote,
  type RcaCandidate,
} from "@/lib/manual-investigation-data"
import { getDeviceFilterOptions, getServiceFilterOptions } from "@/data/scenarios"
import { cn } from "@/lib/utils"

function PanelShell({
  title,
  subtitle,
  className,
  children,
}: {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[#30363d] bg-[#0d1117]/95",
        className,
      )}
    >
      <div className="border-b border-[#30363d] bg-[#161b22] px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#58a6ff]">{title}</div>
        {subtitle ? <div className="text-[10px] text-[#8b949e]">{subtitle}</div> : null}
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  )
}

function InvestigationExplorer({
  search,
  onSearch,
  timeRange,
  onTimeRange,
}: {
  search: string
  onSearch: (v: string) => void
  timeRange: string
  onTimeRange: (v: string) => void
}) {
  const { scenario } = useDemoScenario()

  return (
    <PanelShell title="Investigation Explorer" subtitle="Filters · 调查筛选">
      <div className="space-y-3 text-[11px]">
        <div>
          <label className="mb-1 block text-[10px] uppercase text-[#8b949e]">Search</label>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Device, alarm, incident…"
            className="w-full rounded-md border border-[#30363d] bg-[#010409] px-2.5 py-2 text-[#c9d1d9] placeholder:text-[#484f58] focus:border-[#58a6ff] focus:outline-none"
          />
        </div>
        {[
          { label: "Device", options: getDeviceFilterOptions(scenario) },
          { label: "Service", options: getServiceFilterOptions(scenario) },
          { label: "Location", options: ["All Locations", scenario.digitalTwin.focus.split(" · ")[0] ?? "Zone A"] },
          { label: "Alarm Severity", options: [...severityFilters] },
          { label: "Incident Severity", options: [...incidentSeverityFilters] },
        ].map((group) => (
          <div key={group.label}>
            <div className="mb-1 text-[10px] uppercase text-[#8b949e]">{group.label}</div>
            <select className="w-full rounded-md border border-[#30363d] bg-[#010409] px-2 py-1.5 text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none">
              {group.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
        <div>
          <div className="mb-1 text-[10px] uppercase text-[#8b949e]">Time Range</div>
          <select
            value={timeRange}
            onChange={(e) => onTimeRange(e.target.value)}
            className="w-full rounded-md border border-[#30363d] bg-[#010409] px-2 py-1.5 text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none"
          >
            {timeRangeOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
    </PanelShell>
  )
}

function DependencyExplorer({
  nodes,
  selectedId,
  onSelect,
  expandUpstream,
  expandDownstream,
  onToggleUpstream,
  onToggleDownstream,
  showIncidents,
  showAlarms,
  onToggleIncidents,
  onToggleAlarms,
}: {
  nodes: ReturnType<typeof buildInvestigationEvidence>
  selectedId: string | null
  onSelect: (id: string) => void
  expandUpstream: boolean
  expandDownstream: boolean
  onToggleUpstream: () => void
  onToggleDownstream: () => void
  showIncidents: boolean
  showAlarms: boolean
  onToggleIncidents: () => void
  onToggleAlarms: () => void
}) {
  const { scenario } = useDemoScenario()

  return (
    <PanelShell title="Dependency Explorer" subtitle="Interactive Graph · 拓扑调查">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { label: "Expand Upstream", active: expandUpstream, onClick: onToggleUpstream },
          { label: "Expand Downstream", active: expandDownstream, onClick: onToggleDownstream },
          { label: "Related Incidents", active: showIncidents, onClick: onToggleIncidents },
          { label: "Related Alarms", active: showAlarms, onClick: onToggleAlarms },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.onClick}
            className={cn(
              "rounded border px-2 py-1 text-[10px] font-medium transition-colors",
              btn.active
                ? "border-[#58a6ff] bg-[#58a6ff]/15 text-[#58a6ff]"
                : "border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#c9d1d9]",
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="mb-3 rounded-md border border-[#30363d] bg-[#010409] p-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] text-[#8b949e]">
          <Network className="size-3.5 text-[#58a6ff]" />
          Dependency Path · {scenario.domain}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {scenario.impactChain.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-center transition-all",
                  selectedId === node.id
                    ? "border-[#58a6ff] bg-[#58a6ff]/20 shadow-[0_0_12px_-2px_#58a6ff]"
                    : node.status === "root"
                      ? "border-[#f85149] bg-[#f85149]/10"
                      : "border-[#30363d] bg-[#161b22] hover:border-[#484f58]",
                )}
              >
                <div
                  className={cn(
                    "text-[11px] font-semibold",
                    node.status === "root" ? "text-[#f85149]" : "text-[#c9d1d9]",
                  )}
                >
                  {node.label}
                </div>
                <div className="text-[9px] text-[#8b949e]">{node.sub}</div>
                {nodes.find((n) => n.nodeId === node.id)?.isRootCandidate ? (
                  <div className="mt-1 text-[8px] font-bold uppercase text-[#d29922]">RCA Candidate</div>
                ) : null}
              </button>
              {i < scenario.impactChain.length - 1 ? (
                <GitBranch className="size-3 rotate-[-90deg] text-[#484f58]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {(expandUpstream || expandDownstream) && selectedId ? (
        <div className="rounded-md border border-dashed border-[#30363d] bg-[#161b22]/50 p-2 text-[10px] text-[#8b949e]">
          {expandUpstream ? "↑ Upstream hop: upstream monitoring & parent supply nodes expanded." : null}
          {expandUpstream && expandDownstream ? " · " : null}
          {expandDownstream ? "↓ Downstream hop: dependent racks, services & consumers expanded." : null}
        </div>
      ) : null}
    </PanelShell>
  )
}

function EvidenceInspector({ evidence }: { evidence: InvestigationNodeEvidence | null }) {
  if (!evidence) {
    return (
      <PanelShell title="Evidence Details" subtitle="Select a node · 选择节点">
        <div className="flex h-full min-h-[200px] items-center justify-center text-[11px] text-[#8b949e]">
          Click a topology node to inspect evidence
        </div>
      </PanelShell>
    )
  }

  return (
    <PanelShell title="Evidence Details" subtitle="Evidence Inspector · 证据详情">
      <div className="space-y-3 text-[11px]">
        <div>
          <div className="text-lg font-bold text-[#c9d1d9]">{evidence.deviceName}</div>
          {evidence.isRootCandidate ? (
            <span className="mt-1 inline-block rounded bg-[#d29922]/20 px-2 py-0.5 text-[10px] font-bold text-[#d29922]">
              Root Cause Candidate
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-[#30363d] bg-[#161b22] p-2">
            <div className="text-[#f85149] text-xl font-bold tabular">{evidence.alarmCount}</div>
            <div className="text-[9px] text-[#8b949e]">related alarms</div>
          </div>
          <div className="rounded border border-[#30363d] bg-[#161b22] p-2">
            <div className="text-[#58a6ff] text-xl font-bold tabular">{evidence.relatedIncidents}</div>
            <div className="text-[9px] text-[#8b949e]">related incidents</div>
          </div>
          <div className="rounded border border-[#30363d] bg-[#161b22] p-2">
            <div className="text-[#3fb950] text-xl font-bold tabular">{evidence.historicalSimilarity}%</div>
            <div className="text-[9px] text-[#8b949e]">historical similarity</div>
          </div>
          <div className="rounded border border-[#30363d] bg-[#161b22] p-2">
            <div className="text-[#c9d1d9] text-xl font-bold tabular">{evidence.dependentSystems}</div>
            <div className="text-[9px] text-[#8b949e]">dependent systems</div>
          </div>
        </div>
        <Section label="Topology Relationships" items={evidence.relationships} />
        <Section label="Timeline Events" items={evidence.timelineEvents.map((e) => `${e.time} · ${e.label}`)} />
        <Section label="Knowledge Graph Relationships" items={evidence.kgRelationships} />
        <Section label="Historical Cases" items={evidence.historicalCases} />
      </div>
    </PanelShell>
  )
}

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase text-[#8b949e]">{label}</div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="rounded border border-[#21262d] bg-[#010409] px-2 py-1 text-[#c9d1d9]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TimelineExplorer({
  zoom,
  onZoom,
  compareDevices,
  compareAlarms,
  onToggleCompareDevices,
  onToggleCompareAlarms,
}: {
  zoom: number
  onZoom: (v: number) => void
  compareDevices: boolean
  compareAlarms: boolean
  onToggleCompareDevices: () => void
  onToggleCompareAlarms: () => void
}) {
  const { scenario } = useDemoScenario()
  const rootWindowStart = scenario.timeline.events[0]?.time ?? "—"

  return (
    <PanelShell title="Timeline Explorer" subtitle="Chronological Events · 时间线探索">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleCompareDevices}
          className={cn(
            "rounded border px-2 py-1 text-[10px]",
            compareDevices ? "border-[#58a6ff] text-[#58a6ff]" : "border-[#30363d] text-[#8b949e]",
          )}
        >
          Compare Device Events
        </button>
        <button
          type="button"
          onClick={onToggleCompareAlarms}
          className={cn(
            "rounded border px-2 py-1 text-[10px]",
            compareAlarms ? "border-[#58a6ff] text-[#58a6ff]" : "border-[#30363d] text-[#8b949e]",
          )}
        >
          Compare Alarm Events
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-[#8b949e]">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="accent-[#58a6ff]"
          />
        </div>
      </div>
      <div
        className="relative space-y-0 border-l-2 border-[#30363d] pl-4"
        style={{ transform: `scaleX(${zoom})`, transformOrigin: "left center" }}
      >
        {scenario.timeline.events.map((ev, i) => {
          const inRootWindow = i <= 1
          return (
            <div key={ev.time} className="relative pb-4 last:pb-0">
              <span
                className={cn(
                  "absolute -left-[21px] top-1 size-2.5 rounded-full border-2",
                  inRootWindow ? "border-[#f85149] bg-[#f85149]/30" : "border-[#484f58] bg-[#161b22]",
                )}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-[#c9d1d9]">{ev.title}</span>
                <span className="tabular text-[10px] text-[#8b949e]">{ev.time}</span>
              </div>
              <div className="text-[10px] text-[#8b949e]">{ev.zh}</div>
              <div className="text-[10px] text-[#484f58]">{ev.detail}</div>
              {inRootWindow ? (
                <span className="mt-1 inline-block text-[9px] font-bold uppercase text-[#f85149]">
                  Suspected root cause window
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-[10px] text-[#8b949e]">
        Root cause window anchor: {rootWindowStart} · {scenario.incident.rootCause}
      </div>
    </PanelShell>
  )
}

function InvestigationActions({
  onBookmark,
  onNote,
  onCandidate,
}: {
  onBookmark: () => void
  onNote: () => void
  onCandidate: () => void
}) {
  const actions = [
    { label: "Bookmark Evidence", icon: Bookmark, onClick: onBookmark },
    { label: "Create Investigation Note", icon: StickyNote, onClick: onNote },
    { label: "Add RCA Candidate", icon: Plus, onClick: onCandidate },
    { label: "Share Investigation", icon: Share2, onClick: () => {} },
    { label: "Export Findings", icon: FileDown, onClick: () => {} },
  ]

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[#30363d] bg-[#161b22] p-3">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-[10px] font-medium text-[#c9d1d9] transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]"
        >
          <a.icon className="size-3.5" />
          {a.label}
        </button>
      ))}
    </div>
  )
}

function OperatorNotes({
  notes,
  candidates,
  draft,
  onDraftChange,
  onAddNote,
}: {
  notes: InvestigationNote[]
  candidates: RcaCandidate[]
  draft: string
  onDraftChange: (v: string) => void
  onAddNote: () => void
}) {
  return (
    <PanelShell title="Operator Investigation Notes" subtitle="Human Findings · 人工调查记录">
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={4}
        className="mb-3 w-full resize-y rounded-md border border-[#30363d] bg-[#010409] px-3 py-2 text-[11px] leading-relaxed text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none"
      />
      <button
        type="button"
        onClick={onAddNote}
        className="mb-3 rounded-md border border-[#238636] bg-[#238636]/20 px-3 py-1.5 text-[10px] font-semibold text-[#3fb950] hover:bg-[#238636]/30"
      >
        Save Note
      </button>
      {notes.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded border border-[#30363d] bg-[#161b22] p-2 text-[10px] text-[#c9d1d9]">
              <div className="text-[9px] text-[#484f58]">{n.createdAt}</div>
              <pre className="whitespace-pre-wrap font-sans">{n.text}</pre>
            </li>
          ))}
        </ul>
      ) : null}
      {candidates.length > 0 ? (
        <div>
          <div className="mb-1 text-[10px] uppercase text-[#8b949e]">RCA Candidates</div>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-[#d29922]/50 bg-[#d29922]/10 px-2.5 py-1 text-[10px] font-semibold text-[#d29922]"
              >
                {c.label} · {c.confidence}%
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </PanelShell>
  )
}

export function ManualInvestigationWorkspace() {
  const { scenario } = useDemoScenario()
  const evidenceList = useMemo(() => buildInvestigationEvidence(scenario), [scenario])

  const [search, setSearch] = useState("")
  const [timeRange, setTimeRange] = useState<string>(timeRangeOptions[1])
  const [selectedId, setSelectedId] = useState<string | null>(scenario.impactChain[0]?.id ?? null)
  const [expandUpstream, setExpandUpstream] = useState(false)
  const [expandDownstream, setExpandDownstream] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [showAlarms, setShowAlarms] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [compareDevices, setCompareDevices] = useState(false)
  const [compareAlarms, setCompareAlarms] = useState(true)
  const [draft, setDraft] = useState(defaultOperatorNote)
  const [notes, setNotes] = useState<InvestigationNote[]>([])
  const [candidates, setCandidates] = useState<RcaCandidate[]>([])

  useEffect(() => {
    setSelectedId(scenario.impactChain[0]?.id ?? null)
    setDraft(
      `Observed abnormal signals on ${scenario.impactChain[0]?.sub ?? "source device"} before outage.\nPotential root cause candidate:\n${scenario.incident.rootCause}.`,
    )
  }, [scenario])

  const selectedEvidence = evidenceList.find((e) => e.nodeId === selectedId) ?? null

  const filteredEvidence = useMemo(() => {
    if (!search.trim()) return evidenceList
    const q = search.toLowerCase()
    return evidenceList.filter((e) => e.deviceName.toLowerCase().includes(q))
  }, [evidenceList, search])

  return (
    <div
      id="manual-investigation-workspace"
      className="space-y-4 rounded-xl border border-[#30363d] bg-[#010409] p-4 shadow-[inset_0_1px_0_#21262d]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
        <div>
          <div className="text-sm font-bold text-[#c9d1d9]">Manual Investigation Mode</div>
          <div className="text-[10px] text-[#8b949e]">
            {scenario.incident.id} · {scenario.name} · AI analysis remains available via mode switch
          </div>
        </div>
        <span className="rounded border border-[#238636]/40 bg-[#238636]/10 px-2 py-1 text-[10px] font-semibold text-[#3fb950]">
          Sentinel-style Workspace
        </span>
      </div>

      <div className="grid min-h-[520px] gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <InvestigationExplorer
            search={search}
            onSearch={setSearch}
            timeRange={timeRange}
            onTimeRange={setTimeRange}
          />
        </div>
        <div className="lg:col-span-5">
          <DependencyExplorer
            nodes={filteredEvidence}
            selectedId={selectedId}
            onSelect={setSelectedId}
            expandUpstream={expandUpstream}
            expandDownstream={expandDownstream}
            onToggleUpstream={() => setExpandUpstream((v) => !v)}
            onToggleDownstream={() => setExpandDownstream((v) => !v)}
            showIncidents={showIncidents}
            showAlarms={showAlarms}
            onToggleIncidents={() => setShowIncidents((v) => !v)}
            onToggleAlarms={() => setShowAlarms((v) => !v)}
          />
        </div>
        <div className="lg:col-span-4">
          <EvidenceInspector evidence={selectedEvidence} />
        </div>
      </div>

      <TimelineExplorer
        zoom={zoom}
        onZoom={setZoom}
        compareDevices={compareDevices}
        compareAlarms={compareAlarms}
        onToggleCompareDevices={() => setCompareDevices((v) => !v)}
        onToggleCompareAlarms={() => setCompareAlarms((v) => !v)}
      />

      <InvestigationActions
        onBookmark={() =>
          setNotes((prev) => [
            ...prev,
            {
              id: `bm-${Date.now()}`,
              text: `[Bookmark] ${selectedEvidence?.deviceName ?? "Node"} evidence captured.`,
              createdAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
            },
          ])
        }
        onNote={() =>
          setNotes((prev) => [
            ...prev,
            {
              id: `n-${Date.now()}`,
              text: draft,
              createdAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
            },
          ])
        }
        onCandidate={() => {
          if (!selectedEvidence) return
          setCandidates((prev) => [
            ...prev,
            {
              id: `rca-${Date.now()}`,
              label: selectedEvidence.deviceName,
              confidence: selectedEvidence.historicalSimilarity,
            },
          ])
        }}
      />

      <OperatorNotes
        notes={notes}
        candidates={candidates}
        draft={draft}
        onDraftChange={setDraft}
        onAddNote={() =>
          setNotes((prev) => [
            ...prev,
            {
              id: `n-${Date.now()}`,
              text: draft,
              createdAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
            },
          ])
        }
      />
    </div>
  )
}
