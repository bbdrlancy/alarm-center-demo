"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Send, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  copilotWelcome,
  getMockCopilotResponse,
  presetQuestions,
} from "@/lib/copilot-responses"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

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

export function AiopsCopilot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: copilotWelcome },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const open = () => setOpen(true)
    window.addEventListener("open-copilot", open)
    return () => window.removeEventListener("open-copilot", open)
  }, [])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }, [])

  useEffect(() => {
    if (open) scrollToBottom()
  }, [open, messages, typing, scrollToBottom])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = useCallback(
    (text: string) => {
      const query = text.trim()
      if (!query || typing) return

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: query }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setTyping(true)

      window.setTimeout(() => {
        const reply: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: getMockCopilotResponse(query),
        }
        setMessages((prev) => [...prev, reply])
        setTyping(false)
      }, 600)
    },
    [typing],
  )

  return (
    <>
      {/* Floating action button — Fluent 2 / Copilot style */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="打开 AIOps Copilot"
          className={cn(
            "fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full",
            "border border-primary/30 bg-primary text-primary-foreground shadow-card",
            "transition-transform hover:scale-105 hover:bg-[#36bf4f] active:scale-95",
          )}
        >
          <Sparkles className="size-6" />
        </button>
      ) : null}

      {open ? (
        <button
          type="button"
          aria-label="关闭 Copilot 面板"
          className="fixed inset-0 z-40 bg-[#0a2f24]/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-[100vw] flex-col",
          "border-l border-border bg-card shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">AIOps Copilot</h2>
            <p className="truncate text-[11px] text-muted-foreground">智能运维助手</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              随时解答告警收敛、根因分析与处置相关问题
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭"
            className="grid size-8 place-items-center rounded-md border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[92%] rounded-lg px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-panel text-muted-foreground",
                  )}
                >
                  {msg.role === "assistant" ? renderMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {typing ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3.5 py-2.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Preset questions */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            快捷问题 · Quick Prompts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presetQuestions.map((q) => (
              <button
                key={q}
                type="button"
                disabled={typing}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(input)
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入问题…"
              disabled={typing}
              className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="发送"
              className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            基于当前事件数据提供分析建议
          </p>
        </div>
      </aside>
    </>
  )
}
