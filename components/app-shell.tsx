"use client"

import { useEffect, useState, type ComponentType } from "react"
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ClipboardList,
  LayoutGrid,
  Radar,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { StatusDot } from "@/components/primitives"
import { DemoStoryStartButton } from "@/components/demo-story-mode"
import { ScenarioSwitcher } from "@/components/scenario/scenario-switcher"

type NavIcon = ComponentType<{ className?: string }>

type NavChild = {
  icon: NavIcon
  label: string
  en: string
  href: string
  key: string
}

type NavItem = {
  icon: NavIcon
  label: string
  en: string
  key: string
  href?: string
  children?: NavChild[]
}

const nav: NavItem[] = [
  { icon: LayoutGrid, label: "事故组合视图", en: "Incident Portfolio", href: "/", key: "portfolio" },
  {
    icon: Radar,
    label: "根因分析中心",
    en: "RCA Center",
    key: "rca",
    children: [
      { icon: Bot, label: "自动分析", en: "Auto Analysis", href: "/rca", key: "rca-ai" },
      { icon: ClipboardList, label: "人工调查", en: "Manual Investigation", href: "/rca/manual", key: "rca-manual" },
    ],
  },
  { icon: Sparkles, label: "AI 推理中心", en: "AI Explainability Center", href: "/knowledge-center", key: "knowledge" },
  { icon: BarChart3, label: "业务价值中心", en: "Business Value Center", href: "/business-dashboard", key: "business" },
]

function Clock() {
  const [now, setNow] = useState<string>("--:--:--")
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("zh-CN", { hour12: false })
    setNow(fmt())
    const t = setInterval(() => setNow(fmt()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="tabular text-sm text-foreground">{now}</span>
}

function NavEntry({
  item,
  active,
}: {
  item: NavItem
  active: string
}) {
  const childActive = item.children?.some((child) => child.key === active) ?? false
  const isActive = item.key === active || childActive

  const parentInner = (
    <>
      {isActive && !item.children ? (
        <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-primary" />
      ) : null}
      <span className="flex items-center gap-3">
        <item.icon
          className={cn(
            "size-4 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
          )}
        />
        <span className="truncate">{item.label}</span>
      </span>
      <span className="pl-7 text-[9px] text-muted-foreground">{item.en}</span>
    </>
  )

  return (
    <div>
      {item.children ? (
        <div
          className={cn(
            "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm",
            childActive ? "font-medium text-foreground" : "text-sidebar-foreground",
          )}
        >
          {parentInner}
        </div>
      ) : (
        <Link
          href={item.href ?? "#"}
          className={cn(
            "group relative flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
            isActive
              ? "bg-sidebar-accent font-medium text-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
          )}
        >
          {parentInner}
        </Link>
      )}

      {item.children ? (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {item.children.map((child) => {
            const childIsActive = child.key === active
            return (
              <Link
                key={child.key}
                href={child.href}
                className={cn(
                  "group relative flex flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  childIsActive
                    ? "bg-sidebar-accent font-medium text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                )}
              >
                {childIsActive ? (
                  <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-primary" />
                ) : null}
                <span className="flex items-center gap-2.5">
                  <child.icon
                    className={cn(
                      "size-3.5 shrink-0",
                      childIsActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </span>
                <span className="pl-6 text-[9px] text-muted-foreground">{child.en}</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function AppShell({
  children,
  active = "command",
  title = "事故处置中心",
  subtitle = "Incident Command Center",
  hideDemoControls = false,
}: {
  children: React.ReactNode
  active?: string
  title?: string
  subtitle?: string
  hideDemoControls?: boolean
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-sm lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-foreground">AIOps 演示平台</div>
            <div className="text-[10px] text-muted-foreground">What → Why → Why AI → Value</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((item) => (
            <NavEntry key={item.key} item={item} active={active} />
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-3 py-2">
            <StatusDot color="var(--ok)" pulse />
            <div className="text-[11px] leading-tight">
              <div className="text-foreground">AI 引擎在线</div>
              <div className="text-muted-foreground">智能收敛 · 持续运行</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 shadow-sm">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground lg:hidden">
            <ShieldAlert className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{subtitle}</p>
          </div>

          <div className="ml-auto hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 md:flex">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              placeholder="搜索告警 / 设备 / 事件…"
              className="w-40 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none xl:w-52"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5">
            <Activity className="size-3.5 text-primary" />
            <Clock />
          </div>

          <span className="hidden items-center gap-1.5 rounded-md border border-[var(--p1)]/40 bg-[var(--p1)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--p1)] sm:inline-flex">
            <span className="size-1.5 rounded-full bg-[var(--p1)]" />
            2 起 P1 进行中
          </span>

          <button
            className="relative grid size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label="通知"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[var(--p1)]" />
          </button>

          <button
            type="button"
            className="hidden size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground sm:grid"
            aria-label="设置"
          >
            <Settings className="size-4" />
          </button>

          {hideDemoControls ? null : <ScenarioSwitcher />}

          {hideDemoControls ? null : <DemoStoryStartButton />}

          <div className="grid size-9 place-items-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
            OP
          </div>
        </header>

        <main className="bg-grid flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}
