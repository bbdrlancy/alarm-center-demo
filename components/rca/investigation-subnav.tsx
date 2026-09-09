"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const ITEMS = [
  {
    key: "incident" as const,
    href: "/rca/manual",
    zh: "事故调查",
    en: "Incident Investigation",
  },
  {
    key: "events" as const,
    href: "/rca/manual/events",
    zh: "事件探索",
    en: "Event Exploration",
  },
]

export function InvestigationSubnav({ current }: { current: "incident" | "events" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden" aria-label="Investigation pages">
      <div className="inline-flex rounded-lg border border-border bg-panel p-0.5 shadow-sm">
        {ITEMS.map((item) => {
          const active = current === item.key
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors sm:px-4",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.zh}
              <span className="ml-1 hidden font-normal opacity-80 sm:inline">{item.en}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
