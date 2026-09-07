"use client"

import { cn } from "@/lib/utils"

export type ExplainabilityMode = "basic" | "expert"

export function ExplainabilityModeSwitch({
  mode,
  onModeChange,
}: {
  mode: ExplainabilityMode
  onModeChange: (mode: ExplainabilityMode) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div>
        <div className="text-[11px] font-semibold text-foreground">模式切换 · Mode Switch</div>
        <div className="text-[10px] text-muted-foreground">
          简洁：业务语言解释 · 专家：完整推理链与知识来源
        </div>
      </div>
      <div
        className="inline-flex rounded-lg border border-border bg-panel p-0.5"
        role="tablist"
        aria-label="Explainability mode"
      >
        {(
          [
            { key: "basic" as const, label: "Basic", zh: "简洁" },
            { key: "expert" as const, label: "Expert", zh: "专家" },
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
                "rounded-md px-4 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.zh}
              <span className="ml-1 font-normal opacity-80">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
