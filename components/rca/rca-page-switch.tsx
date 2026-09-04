"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function RcaPageSwitch({ current }: { current: "ai" | "manual" }) {
  return (
    <div
      className="flex flex-wrap items-center justify-end lg:hidden"
      aria-label="RCA analysis mode"
    >
      <div className="inline-flex rounded-lg border border-border bg-panel p-0.5 shadow-sm">
        {(
          [
            { key: "ai" as const, href: "/rca", label: "AI Auto Analysis", zh: "AI 自动分析" },
            { key: "manual" as const, href: "/rca/manual", label: "Manual Investigation", zh: "人工调查" },
          ] as const
        ).map((item) => {
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
              {item.label}
              <span className="ml-1 hidden font-normal opacity-80 sm:inline">{item.zh}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
