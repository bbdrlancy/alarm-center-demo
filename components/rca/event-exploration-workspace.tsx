"use client"

import { useMemo, useState } from "react"
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
import { cn } from "@/lib/utils"

export function EventExplorationWorkspace() {
  const [focusKey, setFocusKey] = useState<ScenarioKey>("power")
  const [chatOpen, setChatOpen] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<InventoryEventRow | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])

  const rawPreview = useMemo(() => getInventoryRulePreview("raw"), [])
  const location = useMemo(() => {
    if (!selectedEvent) return null
    return locateAlarmOnTwin(scenarios[scenarioFromEventRow(selectedEvent)], resolveInventoryAlarm(selectedEvent))
  }, [selectedEvent])

  const selectedRows = useMemo(
    () => rawPreview.rows.filter((row) => checkedIds.includes(row.id)),
    [rawPreview.rows, checkedIds],
  )

  return (
    <div
      id="event-exploration-workspace"
      className={cn(
        "grid items-start gap-4 transition-[grid-template-columns] duration-300",
        chatOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)_44px]",
      )}
    >
      <div className="min-w-0 space-y-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-card">
          <div className="text-[11px] font-bold text-l3">事件探索</div>
          <div className="text-[13px] font-semibold text-l1">
            {selectedEvent
              ? `${selectedEvent.incidentId} · ${selectedEvent.device} · ${selectedEvent.displayCode}`
              : "Event Exploration · 原始告警批量选择与分析"}
          </div>
          <div className="text-[10px] text-l4">
            按时间筛选、勾选原始告警，并用收敛模拟器查看降噪 / 关系 / 场景方法效果
          </div>
        </div>

        <Panel
          title="原始告警"
          subtitle="Raw Alarms"
          description="批量选择原始告警并启动收敛模拟分析"
          bodyClassName="p-0"
        >
          <div className="px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="min-w-[140px]">
                <div className="text-[10px] font-bold text-l3">批量分析</div>
                <div className="text-[9px] text-l4">Batch Analysis</div>
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
              rows={rawPreview.rows}
              stageKey="raw"
              stageLabel={`全量原始告警 · ${rawPreview.rows.length}`}
              showIncident
              enableTimeRange
              selectable
              checkedIds={checkedIds}
              onCheckedIdsChange={setCheckedIds}
              selectedId={selectedEvent?.id}
              onSelectRow={(row) => {
                const event = row as InventoryEventRow
                setSelectedEvent(event)
                setFocusKey(scenarioFromEventRow(event))
              }}
            />

            {selectedRows.length > 0 ? (
              <ConvergenceSimulator
                selectedRows={selectedRows}
                onLocate={(row) => {
                  setSelectedEvent(row)
                  setFocusKey(scenarioFromEventRow(row))
                }}
              />
            ) : (
              <p className="mt-3 text-[11px] text-l4">
                勾选一批原始告警后，将启动收敛模拟器；可勾选管道中的降噪 / 关系 / 场景方法查看效果。
              </p>
            )}
          </div>
        </Panel>
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
