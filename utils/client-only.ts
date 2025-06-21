// Utility to ensure code only runs on client side
export function isClient(): boolean {
  return typeof window !== "undefined"
}

export function withClientOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (isClient()) {
    return fn()
  }
  return fallback
}
