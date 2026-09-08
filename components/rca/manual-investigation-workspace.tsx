"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react"
import { TwinSchematic } from "@/components/incident-portfolio/twin-schematic"
import { ConvergenceSimulator } from "@/components/rca/convergence-simulator"
import { EventExplorer } from "@/components/rca/event-explorer"
import { InvestigationChatDialog } from "@/components/rca/investigation-chat-dialog"
import { Panel } from "@/components/primitives"
import { scenarios, type ScenarioKey } from "@/data/scenarios"
import { locateAlarmOnTwin } from "@/lib/impact-twin"
import {
  getInventoryRulePreview,
  resolveInventoryAlarm,
  scenarioFromEventRow,
  type InventoryEventRow,
} from "@/lib/manual-event-inventory"
import {
  getInvestigationWorkbench,
  type CheckResult,
  type RootCauseCandidate,
} from "@/lib/manual-investigation-data"
import { cn } from "@/lib/utils"

const HEALTH_STYLE = {
  Critical: "text-[#e53935] bg-[#e53935]/10 border-[#e53935]/30",
  Degraded: "text-[#fb8c00] bg-[#fb8c00]/10 border-[#fb8c00]/30",
  Impacted: "text-[#c9a227] bg-[#c9a227]/12 border-[#c9a227]/30",
  Watch: "text-l3 bg-muted/40 border-border",
} as const

const STATUS_STYLE: Record<CheckResult, string> = {
  confirmed: "border-primary/35 bg-primary/10 text-primary",
  pending: "border-[#c9a227]/40 bg-[#c9a227]/10 text-[#c9a227]",
  next: "border-border bg-muted/40 text-l3",
}

const STATUS_LABEL: Record<CheckResult, { zh: string; en: string }> = {
  confirmed: { zh: "已确认", en: "Confirmed" },
  pending: { zh: "待核验", en: "Pending" },
  next: { zh: "下一步", en: "Next" },
}

type CandidateSort = "confidence" | "alarmCount" | "historicalSimilarity" | "evidenceCount"

export function ManualInvestigationWorkspace() {
  const [focusKey, setFocusKey] = useState<ScenarioKey>("power")
  const [chatOpen, setChatOpen] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<InventoryEventRow | null>(null)

  const scenario = scenarios[focusKey]
  const workbench = useMemo(() => getInvestigationWorkbench(scenario), [scenario])
  const rawPreview = useMemo(() => getInventoryRulePreview("raw"), [])
  const location = useMemo(() => {
    if (!selectedEvent) return null
    return locateAlarmOnTwin(scenarios[scenarioFromEventRow(selectedEvent)], resolveInventoryAlarm(selectedEvent))
  }, [selectedEvent])

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
      id="manual-investigation-workspace"
      className={cn(
        "grid items-start gap-4 transition-[grid-template-columns] duration-300",
        chatOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)_44px]",
      )}
    >
      <div className="min-w-0 space-y-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-card">
          <div className="text-[11px] font-bold text-l3">调查工作台</div>
          <div className="text-[13px] font-semibold text-l1">
            {selectedEvent
              ? `${selectedEvent.incidentId} · ${selectedEvent.device} · ${selectedEvent.displayCode}`
              : "全量数字孪生 · 点选原始告警后标注位置与影响路径"}
          </div>
          <div className="text-[10px] text-l4">数字孪生与原始告警清单独立于其他页面的事故切换 · 右侧 AI 分析探索随页面联动</div>
        </div>

        <InvestigationTwin location={location} selectedEvent={selectedEvent} />

        <RawAlarmInventory
          rows={rawPreview.rows}
          selectedEventId={selectedEvent?.id}
          onSelectEvent={(row) => {
            setSelectedEvent(row)
            setFocusKey(scenarioFromEventRow(row))
          }}
        />

        {selectedEvent ? (
          <>
            <DetermineCause
              candidates={candidates}
              selectedId={selected?.id ?? ""}
              whyId={whyId}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              onSelect={setSelectedId}
              onWhy={setWhyId}
            />
            {selected ? <DeviceEvidence candidate={selected} /> : null}
            <InvestigationPath steps={workbench.steps} />
          </>
        ) : null}
      </div>

      <InvestigationChatDialog
        focusKey={focusKey}
        ruleKey="raw"
        selectedEvent={selectedEvent}
        locationDevice={location?.device}
        locationPath={location?.sentence}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  )
}

function InvestigationTwin({
  location,
  selectedEvent,
}: {
  location: ReturnType<typeof locateAlarmOnTwin> | null
  selectedEvent: InventoryEventRow | null
}) {
  return (
    <Panel
      title="数字孪生"
      subtitle="Digital Twin"
      description="整体设施拓扑。点选下方原始告警后，标注告警位置并给出可能影响路径"
      bodyClassName="p-0 overflow-hidden"
    >
      {location && selectedEvent ? (
        <div className="grid gap-0 lg:grid-cols-[168px_minmax(0,1fr)]">
          <div className="border-b border-border px-4 py-4 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-bold text-l3">告警位置</div>
            <div className="mb-1 text-[9px] text-l4">Alarm Location</div>
            <div className="text-[15px] font-extrabold text-[#e53935]">{location.device}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-l2">{selectedEvent.summary}</p>
            <div className="mt-4">
              <div className="text-[10px] font-bold text-l3">可能影响路径</div>
              <div className="mb-2 text-[9px] text-l4">Possible Impact Path</div>
              <div className="mb-2 font-mono text-[11px] text-l2">{location.sentence}</div>
              <PropagationRail nodes={location.path} compact />
            </div>
          </div>
          <TwinSchematic
            mode="impact"
            markSelectedAsAlarm
            showDomainHeat={false}
            hops={location.hops}
            selectedHop={location.locationId}
            activeHops={location.activeHops}
            subtitle="数字孪生 · 告警位置与可能影响路径"
          />
        </div>
      ) : (
        <TwinSchematic mode="live" showDomainHeat={false} subtitle="数字孪生 · 全量设施拓扑" />
      )}
    </Panel>
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
}: {
  candidates: RootCauseCandidate[]
  selectedId: string
  whyId: string | null
  sortKey: CandidateSort
  sortDir: "asc" | "desc"
  onSort: (key: CandidateSort) => void
  onSelect: (id: string) => void
  onWhy: (id: string | null) => void
}) {
  const columns: { key: CandidateSort; zh: string; en: string }[] = [
    { key: "confidence", zh: "置信度", en: "Confidence" },
    { key: "alarmCount", zh: "告警数", en: "Alarm Count" },
    { key: "historicalSimilarity", zh: "历史相似度", en: "Historical Similarity" },
    { key: "evidenceCount", zh: "证据数", en: "Evidence Count" },
  ]

  return (
    <Panel title="判定原因" subtitle="Determine Cause" bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
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
                <div className="font-semibold">原因</div>
                <div className="font-normal text-l4">Why This Candidate</div>
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
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item.id)
                        onWhy(open ? null : item.id)
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-l2 hover:border-primary/40"
                    >
                      Why This Candidate
                      <ChevronDown className={cn("size-3 transition", open && "rotate-180")} />
                    </button>
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

function RawAlarmInventory({
  rows,
  selectedEventId,
  onSelectEvent,
}: {
  rows: InventoryEventRow[]
  selectedEventId?: string
  onSelectEvent: (row: InventoryEventRow) => void
}) {
  const [checkedIds, setCheckedIds] = useState<string[]>([])

  const selectedRows = useMemo(
    () => rows.filter((row) => checkedIds.includes(row.id)),
    [rows, checkedIds],
  )

  return (
    <Panel
      title="原始告警"
      subtitle="Raw Alarms"
      description="按时间范围筛选并勾选一批原始告警，下方 Convergence Simulator 按内置管道勾选方法并查看收敛效果"
      bodyClassName="p-0"
    >
      <div className="px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
          <div className="min-w-[140px]">
            <div className="text-[10px] font-bold text-l3">批量收敛</div>
            <div className="text-[9px] text-l4">Batch Convergence</div>
          </div>
          <div className="text-[12px] text-l2">
            已选 <span className="font-mono text-[14px] font-extrabold text-l1">{selectedRows.length}</span> 条
          </div>
          <button
            type="button"
            disabled={checkedIds.length === 0}
            onClick={() => setCheckedIds([])}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] text-l2 disabled:opacity-40"
          >
            清除选择
          </button>
        </div>

        <EventExplorer
          rows={rows}
          stageKey="raw"
          stageLabel={`全量原始告警 · ${rows.length}`}
          showIncident
          enableTimeRange
          selectable
          checkedIds={checkedIds}
          onCheckedIdsChange={setCheckedIds}
          selectedId={selectedEventId}
          onSelectRow={(row) => onSelectEvent(row as InventoryEventRow)}
        />

        {selectedRows.length > 0 ? (
          <ConvergenceSimulator selectedRows={selectedRows} onLocate={onSelectEvent} />
        ) : (
          <p className="mt-3 text-[11px] text-l4">勾选一批原始告警后，将启动收敛模拟器；可勾选管道中的降噪 / 关系 / 场景方法查看效果。</p>
        )}
      </div>
    </Panel>
  )
}

function DeviceEvidence({ candidate }: { candidate: RootCauseCandidate }) {
  return (
    <Panel title="设备证据" subtitle="Device Evidence">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[16px] font-extrabold text-l1">{candidate.nameZh}</div>
          <div className="text-[12px] text-l4">{candidate.name}</div>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", HEALTH_STYLE[candidate.health])}>
          {candidate.health}
        </span>
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
      <details className="mt-2 rounded-lg border border-border bg-muted/15 px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-l2">
          知识图谱关系 · Knowledge Graph Relationships
        </summary>
        <div className="mt-2">
          <ChipList items={candidate.kgRelationships} />
        </div>
      </details>
    </Panel>
  )
}

function InvestigationPath({
  steps,
}: {
  steps: ReturnType<typeof getInvestigationWorkbench>["steps"]
}) {
  return (
    <Panel title="排查路径" subtitle="Investigation Path" bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border bg-muted/40 text-[10px] text-l3">
            <tr>
              <th className="px-4 py-2.5">
                <div className="font-semibold">核验步骤</div>
                <div className="font-normal text-l4">Verification Step</div>
              </th>
              <th className="px-3 py-2.5">
                <div className="font-semibold">状态</div>
                <div className="font-normal text-l4">Status</div>
              </th>
              <th className="px-3 py-2.5">
                <div className="font-semibold">发现</div>
                <div className="font-normal text-l4">Finding</div>
              </th>
              <th className="px-3 py-2.5">
                <div className="font-semibold">下一步</div>
                <div className="font-normal text-l4">Next Action</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr key={step.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-[13px] font-bold text-l1">{step.stepZh}</div>
                  <div className="text-[11px] text-l4">{step.stepEn}</div>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", STATUS_STYLE[step.status])}>
                    {STATUS_LABEL[step.status].zh}
                    <span className="ml-1 font-normal opacity-80">{STATUS_LABEL[step.status].en}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-[12px] text-l2">{step.finding}</td>
                <td className="px-3 py-3 text-[12px] font-semibold text-l1">{step.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function PropagationRail({ nodes, compact = false }: { nodes: { id: string; label: string }[]; compact?: boolean }) {
  return (
    <div className={cn(!compact && "border-b border-border px-4 py-4 lg:border-b-0 lg:border-r")}>
      {compact ? null : (
        <>
          <div className="text-[10px] font-bold text-l3">影响传播链</div>
          <div className="mb-3 text-[9px] text-l4">Impact Path</div>
        </>
      )}
      <ol className="flex flex-row items-center gap-2 lg:flex-col">
        {nodes.map((node, index) => (
          <li key={node.id} className="flex items-center gap-2 lg:flex-col">
            <div
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-center text-[12px] font-bold",
                index === 0
                  ? "border-[#e53935]/40 bg-[#e53935]/8 text-[#e53935]"
                  : index === nodes.length - 1
                    ? "border-[#fb8c00]/40 bg-[#fb8c00]/8 text-[#fb8c00]"
                    : "border-border bg-muted/30 text-l1",
              )}
            >
              {node.label}
            </div>
            {index < nodes.length - 1 ? (
              <span className="text-[11px] text-l4 lg:rotate-0" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
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
