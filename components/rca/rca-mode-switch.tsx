"use client"

import { cn } from "@/lib/utils"

export type RcaAnalysisMode = "ai" | "manual"

export function RcaModeSwitch({
  mode,
  onModeChange,
}: {
  mode: RcaAnalysisMode
  onModeChange: (mode: RcaAnalysisMode) => void
}) {
  return (
    <div
      id="rca-mode-switch"
      className="inline-flex rounded-lg border border-border bg-panel p-0.5 shadow-sm"
      role="tablist"
      aria-label="RCA analysis mode"
    >
      {(
        [
          { key: "ai" as const, label: "AI Auto Analysis", zh: "AI 自动分析" },
          { key: "manual" as const, label: "Manual Investigation", zh: "人工调查" },
        ] as const
      ).map((item) => {
        const active = mode === item.key
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(item.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors sm:px-4",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="ml-1 hidden font-normal opacity-80 sm:inline">{item.zh}</span>
          </button>
        )
      })}
    </div>
  )
}
