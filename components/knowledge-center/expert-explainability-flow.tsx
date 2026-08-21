"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { graphragExplainability } from "@/lib/digital-twin-explorer-data"
import { incidentInstanceMapping } from "@/lib/knowledge-center-data"
import { Panel } from "@/components/primitives"
import { CrossLayerView } from "@/components/knowledge-center/cross-layer-view"
import { SpatialModel } from "@/components/knowledge-center/spatial-model"
import { EnterpriseOntology } from "@/components/knowledge-center/enterprise-ontology"
import { KnowledgeGraph } from "@/components/knowledge-center/knowledge-graph"
import { GraphragReasoning } from "@/components/knowledge-center/graphrag-reasoning"
import { CopilotKnowledgeSource } from "@/components/knowledge-center/copilot-knowledge-source"
import { ExplainStep } from "@/components/page-flow"

function IncidentMappingSection() {
  return (
    <Panel
      title="当前事故映射"
      subtitle="Current Incident Mapping"
      description="本次事故在知识图谱中的实例映射关系"
      bodyClassName="p-3 md:p-4"
    >
      <div className="rounded-lg border border-[var(--p1)]/35 bg-[var(--p1)]/5 px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-center gap-1">
          {incidentInstanceMapping.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1">
              <span className="rounded-md border border-[var(--p1)] bg-[var(--p1)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--p1)]">
                {node.label}
              </span>
              {i < incidentInstanceMapping.length - 1 ? (
                <ChevronDown className="size-3 rotate-[-90deg] text-[var(--p1)]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function GraphragExplainabilitySection() {
  const explain = graphragExplainability["ups-a01"]
  if (!explain) return null

  return (
    <Panel
      title="GraphRAG 可解释性"
      subtitle="GraphRAG Explainability"
      description="为什么 UPS-A01 被判定为根因，而非 PDU 或 GPU"
      bodyClassName="p-3 md:p-4"
    >
      <div className="mb-3 flex items-center justify-between rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
        <span className="text-[12px] font-semibold text-foreground">{explain.title}</span>
        <span className="rounded bg-primary/12 px-2 py-0.5 text-[11px] font-bold tabular text-primary">
          {explain.confidence}%
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {explain.factors.map((f) => (
          <div key={f.label} className="rounded-md border border-border bg-card px-3 py-2.5">
            <div className="text-[11px] font-semibold text-primary">{f.label}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{f.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function CrossLayerSection() {
  const [selectedId, setSelectedId] = useState<string | null>("ups-a01")

  return (
    <Panel
      title="跨层关系视图"
      subtitle="Cross Layer View"
      description="Space → Topology → Business → Knowledge 跨层关联"
      bodyClassName="p-3 md:p-4"
    >
      <CrossLayerView selectedId={selectedId} onSelect={setSelectedId} />
    </Panel>
  )
}

export function ExpertExplainabilityFlow() {
  return (
    <>
      <ExplainStep step={1} title="Digital Twin" subtitle="数字孪生" question="影响在哪里？">
        <SpatialModel />
      </ExplainStep>

      <ExplainStep step={2} title="Ontology" subtitle="企业本体" question="AI 如何理解世界？">
        <EnterpriseOntology />
      </ExplainStep>

      <ExplainStep step={3} title="Knowledge Graph" subtitle="知识图谱" question="AI 知道了什么？">
        <KnowledgeGraph />
      </ExplainStep>

      <ExplainStep step={4} title="GraphRAG" subtitle="图谱增强推理" question="AI 如何推理？">
        <GraphragReasoning />
      </ExplainStep>

      <ExplainStep step={5} title="Copilot" subtitle="智能助手" question="AI 如何解释？">
        <CopilotKnowledgeSource />
      </ExplainStep>

      <IncidentMappingSection />
      <CrossLayerSection />
      <GraphragExplainabilitySection />
    </>
  )
}
