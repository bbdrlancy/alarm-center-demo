"use client"

import { Bot, ChevronDown, Database } from "lucide-react"
import { copilotLayers } from "@/lib/knowledge-center-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

export function CopilotKnowledgeSource() {
  return (
    <Panel
      title="Copilot 知识来源"
      subtitle="Copilot Knowledge Source"
      description="AI 如何解释？ · 展示 Copilot 回答所依赖的数据来源与推理架构"
      icon={<Bot className="size-4" />}
      bodyClassName="p-4 md:p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-lg border border-border bg-panel/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <Database className="size-3.5 text-primary" />
            数据来源 · Data Sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {copilotLayers.dataSources.map((src) => (
              <span
                key={src}
                className="rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-foreground"
              >
                {src}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <ChevronDown className="size-5 rotate-[-90deg] text-primary" />
        </div>

        <div className="flex flex-col items-center gap-0">
          {copilotLayers.layers.map((layer, i) => (
            <div key={layer.id} className="flex w-full max-w-[280px] flex-col items-center">
              <div
                className={[
                  "w-full rounded-lg border px-4 py-3 text-center",
                  layer.id === "copilot"
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card",
                ].join(" ")}
              >
                <div className="text-[13px] font-semibold">{layer.label}</div>
                <div
                  className={[
                    "text-[10px]",
                    layer.id === "copilot" ? "text-primary-foreground/80" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {layer.zh}
                </div>
                <p
                  className={[
                    "mt-1 text-[9px]",
                    layer.id === "copilot" ? "text-primary-foreground/70" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {layer.desc}
                </p>
              </div>
              {i < copilotLayers.layers.length - 1 ? (
                <ChevronDown className="my-0.5 size-4 text-primary" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <ModuleConclusion>
        Copilot 的回答基于九大数据源，经语义层与知识层处理后，由 GraphRAG 增强推理生成，而非凭空猜测。
      </ModuleConclusion>
    </Panel>
  )
}
