"use client"

import { ChevronDown } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel } from "@/components/primitives"
import { SpatialModel } from "@/components/knowledge-center/spatial-model"
import { EnterpriseOntology } from "@/components/knowledge-center/enterprise-ontology"
import { KnowledgeGraph } from "@/components/knowledge-center/knowledge-graph"
import { GraphragReasoning } from "@/components/knowledge-center/graphrag-reasoning"
import { CopilotKnowledgeSource } from "@/components/knowledge-center/copilot-knowledge-source"
import { ExplainStep } from "@/components/page-flow"

function ExplainabilitySection() {
  const { scenario } = useDemoScenario()
  const { graph, digitalTwin, incident } = scenario
  const explain = graph.graphrag
  const mapping = graph.mapping.map((label, i) => ({ id: `m-${i}`, label }))

  return (
    <Panel
      title="可解释性总结"
      subtitle="Explainability Summary"
      description={`为什么 ${digitalTwin.rootCauseLabel} 被判定为根因（置信度 ${explain.confidence}%）`}
      bodyClassName="space-y-3 p-3 md:p-4"
    >
      <div className="rounded-lg border border-[var(--p1)]/35 bg-[var(--p1)]/5 px-3 py-2.5">
        <div className="mb-1.5 text-[10px] font-semibold text-[var(--p1)]">
          Incident Mapping · {incident.id}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {mapping.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1">
              <span className="rounded-md border border-[var(--p1)] bg-[var(--p1)]/12 px-2 py-1 text-[10px] font-semibold text-[var(--p1)]">
                {node.label}
              </span>
              {i < mapping.length - 1 ? (
                <ChevronDown className="size-3 rotate-[-90deg] text-[var(--p1)]" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-1 text-[12px] font-semibold text-foreground">{explain.title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {explain.factors.map((f) => (
          <div key={f.label} className="rounded-md border border-border bg-card px-3 py-2.5">
            <div className="text-[11px] font-semibold text-primary">{f.label}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{f.detail}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{graph.conclusion}</p>
    </Panel>
  )
}

export function ExpertExplainabilityFlow() {
  return (
    <>
      <ExplainStep step={1} title="数字孪生" subtitle="Digital Twin" question="影响在哪里？">
        <SpatialModel />
      </ExplainStep>

      <ExplainStep step={2} title="企业本体" subtitle="Ontology" question="AI 如何理解世界？">
        <EnterpriseOntology />
      </ExplainStep>

      <ExplainStep step={3} title="知识图谱" subtitle="Knowledge Graph" question="AI 知道了什么？">
        <KnowledgeGraph />
      </ExplainStep>

      <ExplainStep step={4} title="图谱增强推理" subtitle="GraphRAG" question="AI 如何推理？">
        <GraphragReasoning />
      </ExplainStep>

      <ExplainStep step={5} title="知识来源" subtitle="Knowledge Sources" question="AI 依据哪些知识？">
        <CopilotKnowledgeSource />
      </ExplainStep>

      <ExplainStep step={6} title="可解释性" subtitle="Explainability" question="为什么是这个根因？">
        <ExplainabilitySection />
      </ExplainStep>
    </>
  )
}
