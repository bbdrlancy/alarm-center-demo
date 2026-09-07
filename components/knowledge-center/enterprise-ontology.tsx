"use client"

import { useMemo, useState } from "react"
import { BookOpen } from "lucide-react"
import {
  getConceptNeighbors,
  ontologyConcepts,
  semanticRelations,
  type OntologyConceptId,
} from "@/lib/ontology-explorer-data"
import { Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

function OntologyRelationshipGraph({
  selectedConcept,
  onSelectConcept,
}: {
  selectedConcept: OntologyConceptId | null
  onSelectConcept: (id: OntologyConceptId | null) => void
}) {
  const conceptMap = useMemo(
    () => Object.fromEntries(ontologyConcepts.map((c) => [c.id, c])),
    [],
  )

  const highlight = useMemo(
    () => (selectedConcept ? getConceptNeighbors(selectedConcept) : null),
    [selectedConcept],
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-panel/40 p-2">
      <svg
        viewBox="0 0 860 140"
        className="h-auto w-full min-w-[720px]"
        role="img"
        aria-label="Ontology relationship graph"
      >
        <defs>
          <marker id="ontology-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--primary)" opacity="0.75" />
          </marker>
        </defs>

        {semanticRelations.map((rel, i) => {
          const from = conceptMap[rel.from]
          const to = conceptMap[rel.to]
          if (!from || !to) return null
          const lit = !highlight || (highlight.has(rel.from) && highlight.has(rel.to))
          const mx = (from.x + to.x) / 2
          const my = (from.y + to.y) / 2 - 5

          return (
            <g key={i} opacity={lit ? 1 : 0.12}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--primary)"
                strokeWidth={1.3}
                strokeOpacity={0.55}
                markerEnd="url(#ontology-arrow)"
              />
              <rect
                x={mx - rel.label.length * 2.9}
                y={my - 7}
                width={rel.label.length * 5.8}
                height={12}
                rx={3}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth={0.5}
              />
              <text
                x={mx}
                y={my + 2}
                textAnchor="middle"
                className="fill-primary text-[7px] font-medium"
              >
                {rel.label}
              </text>
            </g>
          )
        })}

        {ontologyConcepts.map((concept) => {
          const lit = !highlight || highlight.has(concept.id)
          const isSel = selectedConcept === concept.id
          return (
            <g
              key={concept.id}
              opacity={lit ? 1 : 0.2}
              className="cursor-pointer"
              onClick={() => onSelectConcept(isSel ? null : concept.id)}
            >
              <rect
                x={concept.x - 40}
                y={concept.y - 16}
                width={80}
                height={32}
                rx={6}
                fill="white"
                stroke={isSel ? "var(--primary)" : "var(--border)"}
                strokeWidth={isSel ? 2.5 : 1.2}
              />
              <text
                x={concept.x}
                y={concept.y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn("fill-foreground text-[8px] font-semibold", isSel && "font-bold")}
              >
                {concept.label}
              </text>
              <text
                x={concept.x}
                y={concept.y + 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[6.5px]"
              >
                {concept.zh}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-3 border-t border-border/60 pt-2 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded border border-border bg-white" />
          概念 · Concept
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-4 bg-primary/60" />
          语义关系 · Relationship
        </span>
      </div>
    </div>
  )
}

export function EnterpriseOntology() {
  const [selectedConcept, setSelectedConcept] = useState<OntologyConceptId | null>(null)

  return (
    <Panel
      title="企业本体模型"
      subtitle="Enterprise Ontology"
      description="概念 + 语义关系 · Concept + Relationship：仅展示概念与语义关系，不含任何实例对象"
      icon={<BookOpen className="size-4" />}
      bodyClassName="space-y-3 p-3 md:p-4"
    >
      <OntologyRelationshipGraph
        selectedConcept={selectedConcept}
        onSelectConcept={setSelectedConcept}
      />
    </Panel>
  )
}
