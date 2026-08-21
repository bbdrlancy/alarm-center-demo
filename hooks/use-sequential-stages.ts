"use client"

import { useEffect, useState } from "react"

/**
 * Reveals stages one-by-one when `enabled` becomes true.
 * Returns the highest active stage index (-1 before start).
 */
export function useSequentialStages(
  count: number,
  opts?: { enabled?: boolean; stepDelay?: number; startDelay?: number; resetKey?: number },
) {
  const { enabled = true, stepDelay = 750, startDelay = 200, resetKey = 0 } = opts ?? {}
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setActiveIndex(-1)
    if (!enabled) return

    const timers: number[] = []
    const start = window.setTimeout(() => {
      for (let i = 0; i < count; i++) {
        timers.push(window.setTimeout(() => setActiveIndex(i), i * stepDelay))
      }
    }, startDelay)

    return () => {
      window.clearTimeout(start)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [enabled, count, stepDelay, startDelay, resetKey])

  return {
    activeIndex,
    isReached: (index: number) => activeIndex >= index,
    isCurrent: (index: number) => activeIndex === index,
    isFlowing: (index: number) => activeIndex === index,
  }
}
