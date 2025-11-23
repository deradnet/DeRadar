"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Intersection Observer hook for lazy loading
 * Only renders components when they're visible in viewport
 */
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, {
      threshold: 0.1,
      rootMargin: "50px",
      ...options,
    })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasIntersected, options])

  return { targetRef, isIntersecting, hasIntersected }
}
