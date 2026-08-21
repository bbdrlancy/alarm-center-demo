"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a number from 0 → target with an ease-out curve.
 * Starts when the element scrolls into view (or immediately if `immediate`).
 */
export function useCountUp(target: number, opts?: { duration?: number; decimals?: number; delay?: number; immediate?: boolean }) {
  const { duration = 1400, decimals = 0, delay = 0, immediate = false } = opts ?? {}
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const run = () => {
      if (started.current) return
      started.current = true
      const start = performance.now() + delay
      const tick = (now: number) => {
        const elapsed = now - start
        if (elapsed < 0) {
          requestAnimationFrame(tick)
          return
        }
        const p = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(target * eased)
        if (p < 1) requestAnimationFrame(tick)
        else setValue(target)
      }
      requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    if (immediate) {
      run()
      return
    }

    io.observe(el)
    return () => io.disconnect()
  }, [target, duration, delay, immediate])

  const display =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US")

  return { ref, display, value }
}
