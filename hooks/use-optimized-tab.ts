"use client"

import { useState, useCallback, useTransition, useEffect } from "react"
import type { MobileTab } from "@/components/mobile-bottom-nav"

/**
 * Optimized tab switching hook
 * Uses React 18 transitions for smooth, non-blocking tab changes
 */
export function useOptimizedTab(initialTab: MobileTab = "home") {
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab)
  const [isPending, startTransition] = useTransition()
  const [mountedTabs, setMountedTabs] = useState<Set<MobileTab>>(new Set([initialTab]))

  const changeTab = useCallback((newTab: MobileTab) => {
    if (newTab === activeTab) return

    // Mark tab as mounted (for keeping it in DOM)
    setMountedTabs(prev => new Set(prev).add(newTab))

    // Use transition for non-blocking UI updates
    startTransition(() => {
      setActiveTab(newTab)
    })
  }, [activeTab])

  // Unmount tabs after 5 seconds of inactivity (memory optimization)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedTabs(new Set([activeTab]))
    }, 5000)

    return () => clearTimeout(timer)
  }, [activeTab])

  const shouldRenderTab = useCallback((tab: MobileTab) => {
    return mountedTabs.has(tab)
  }, [mountedTabs])

  return {
    activeTab,
    changeTab,
    isPending,
    shouldRenderTab,
    isTabActive: (tab: MobileTab) => tab === activeTab,
  }
}
