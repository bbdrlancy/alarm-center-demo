"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronsLeft, ChevronsRight, Send, Sparkles } from "lucide-react"
import {
  buildInvestigationWelcome,
  buildSelectionContextLine,
  getInvestigationChatResponse,
  INVESTIGATION_CHAT_PROMPTS,
  type InvestigationChatContext,
} from "@/lib/investigation-chat"
import { cn } from "@/lib/utils"

type Message = { id: string; role: "user" | "assistant"; content: string }

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

function renderMessage(content: string) {
  return content.split("\n").map((line, i) => (
    <span key={i} className="block min-h-[1.25em]">
      {line ? renderBold(line) : "\u00A0"}
    </span>
  ))
}

export function InvestigationChatDialog({
  focusKey,
  ruleKey,
  selectedEvent,
  locationDevice,
  locationPath,
  open,
  onOpenChange,
}: InvestigationChatContext & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const ctx: InvestigationChatContext = { focusKey, ruleKey, selectedEvent, locationDevice, locationPath }
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: buildInvestigationWelcome(ctx) },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastLink = useRef<string>("")

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }, [messages, typing])

  useEffect(() => {
    const key = selectedEvent?.id ?? ""
    if (!key || key === lastLink.current) return
    lastLink.current = key
    setMessages((prev) => [
      ...prev,
      {
        id: `link-${key}`,
        role: "assistant",
        content: [
          "已与页面联动当前告警。",
          "",
          `**${buildSelectionContextLine({
            focusKey,
            ruleKey,
            selectedEvent,
            locationDevice,
            locationPath,
          })}**`,
          "",
          "可继续问位置、影响路径或根因。",
        ].join("\n"),
      },
    ])
  }, [selectedEvent, locationPath, locationDevice, focusKey, ruleKey])

  const sendMessage = useCallback(
    (text: string) => {
      const query = text.trim()
      if (!query || typing) return
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: query }])
      setInput("")
      setTyping(true)
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: getInvestigationChatResponse(ctx, query),
          },
        ])
        setTyping(false)
      }, 450)
    },
    [typing, focusKey, ruleKey, selectedEvent, locationDevice, locationPath],
  )

  return (
    <aside
      role="complementary"
      aria-labelledby="investigation-chat-title"
      aria-expanded={open}
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-card lg:sticky lg:top-16",
        open
          ? "flex h-[min(720px,calc(100vh-5.5rem))] flex-col"
          : "flex h-12 items-stretch lg:h-[min(720px,calc(100vh-5.5rem))]",
      )}
    >
      {open ? (
        <>
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="investigation-chat-title" className="text-sm font-semibold text-foreground">
            AI 分析探索
          </h2>
          <p className="text-[11px] text-muted-foreground">Investigation Chat · 与本页孪生图 / 告警联动</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="收起 AI 分析探索"
          title="收起"
          className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-l2 hover:border-primary/40 hover:bg-accent"
        >
          <ChevronsRight className="size-4" />
        </button>
      </header>

      <div className="shrink-0 border-b border-border bg-muted/25 px-4 py-2">
        <div className="text-[10px] font-bold text-l3">当前联动</div>
        <p className="mt-0.5 text-[11px] leading-snug text-l2">{buildSelectionContextLine(ctx)}</p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded-lg px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-muted/30 text-foreground",
                )}
              >
                {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}
          {typing ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          快捷问题 · Quick Prompts
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INVESTIGATION_CHAT_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={typing}
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-foreground hover:border-primary/40 hover:bg-accent disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form
        className="shrink-0 border-t border-border p-4"
        onSubmit={(event) => {
          event.preventDefault()
          sendMessage(input)
        }}
      >
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="结合当前告警、孪生位置或影响路径提问…"
            disabled={typing}
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            aria-label="发送"
            className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="size-3.5" />
          </button>
        </div>
      </form>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="展开 AI 分析探索"
          title="展开 AI 分析探索"
          className="flex w-full items-center justify-center gap-2 px-3 text-l1 hover:bg-accent lg:flex-col lg:gap-3 lg:px-0 lg:py-4"
        >
          <ChevronsLeft className="size-4 shrink-0" />
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <span
            id="investigation-chat-title"
            className="text-[12px] font-semibold tracking-wide lg:[writing-mode:vertical-rl]"
          >
            AI 分析探索
          </span>
        </button>
      )}
    </aside>
  )
}
