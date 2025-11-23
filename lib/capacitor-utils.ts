/**
 * Capacitor utility functions
 */

export function isCapacitor(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor
}
