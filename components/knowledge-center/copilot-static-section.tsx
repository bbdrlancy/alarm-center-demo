"use client"

import type { ReactNode } from "react"
import { Bot, MessageSquare, Sparkles } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { buildCopilotPrintExamples, buildCopilotWelcome } from "@/lib/scenario-copilot"
import { Panel } from "@/components/primitives"

function renderBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function renderAnswer(content: string) {
  return content.split("\n").map((line, i) => (
    <span key={i} className="block min-h-[1.25em] text-[11px] leading-relaxed text-muted-foreground">
      {line ? renderBold(line) : "\u00A0"}
    </span>
  ))
}

/** Static Copilot block for PDF / print — hidden in interactive mode */
export function CopilotStaticSection() {
  const { scenario } = useDemoScenario()
  const copilotPrintExamples = buildCopilotPrintExamples(scenario)
  const copilotWelcome = buildCopilotWelcome(scenario)

  return (
    <section id="copilot-static-section" className="hidden print:block">
      <Panel
        title="Ask Copilot"
        subtitle={`AIOps Copilot · ${scenario.name}`}
        description="基于当前场景数据提供可解释分析与处置建议"
        icon={<Sparkles className="size-4" />}
        bodyClassName="space-y-4"
      >
        <div className="rounded-lg border border-border bg-panel/60 px-4 py-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <Bot className="size-3.5 text-primary" />
            Ask Copilot · 向 Copilot 提问
          </div>
          <div className="rounded-md border border-dashed border-border bg-card px-3 py-2.5 text-[11px] text-muted-foreground">
            输入问题… · Type your question about {scenario.domain} incident {scenario.incident.id}
          </div>
          <div className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            {copilotWelcome.split("\n").slice(0, 3).map((line, i) => (
              <span key={i} className="block">
                {line ? renderBold(line) : null}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <MessageSquare className="size-3.5 text-primary" />
            Suggested Questions · 建议问题
          </div>
          <div className="flex flex-wrap gap-1.5">
            {copilotPrintExamples.map(({ question }) => (
              <span
                key={question}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-foreground"
              >
                {question}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 text-[11px] font-semibold text-foreground">
            Example Answers · 示例回答
          </div>
          <div className="flex flex-col gap-3">
            {copilotPrintExamples.map(({ question, answer }) => (
              <div
                key={question}
                className="rounded-lg border border-border bg-card p-3 break-inside-avoid"
              >
                <div className="mb-2 text-[11px] font-semibold text-primary">{question}</div>
                <div className="rounded-md border border-border/60 bg-panel/50 px-3 py-2.5">
                  {renderAnswer(answer)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  )
}
