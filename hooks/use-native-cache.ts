"use client"

import { useEffect, useState } from "react"
import { Preferences } from "@capacitor/preferences"
import { isCapacitor } from "@/lib/capacitor-utils"

/**
 * Native caching hook - uses Capacitor Preferences for native storage
 * This is MUCH faster than localStorage on mobile devices
 */
export function useNativeCache<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadValue = async () => {
      if (isCapacitor()) {
        // Use native storage (much faster on mobile)
        const { value: stored } = await Preferences.get({ key })
        if (stored) {
          try {
            setValue(JSON.parse(stored))
          } catch (e) {
            console.error("Error parsing cached value:", e)
          }
        }
      } else {
        // Fallback to localStorage for web
        const stored = localStorage.getItem(key)
        if (stored) {
          try {
            setValue(JSON.parse(stored))
          } catch (e) {
            console.error("Error parsing cached value:", e)
          }
        }
      }
      setIsLoaded(true)
    }

    loadValue()
  }, [key])

  const updateValue = async (newValue: T) => {
    setValue(newValue)

    if (isCapacitor()) {
      // Use native storage
      await Preferences.set({
        key,
        value: JSON.stringify(newValue),
      })
    } else {
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }

  return [value, updateValue, isLoaded] as const
}
