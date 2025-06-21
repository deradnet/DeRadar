// Utility functions for time formatting and conversion

/**
 * Format a timestamp for local time display
 * @param timestamp - Timestamp in YYYYMMDDHHMM format
 * @returns Formatted local time string
 */
export function formatLocalTime(timestamp: string): string {
  try {
    // Parse timestamp format: YYYYMMDDHHMM
    const year = Number.parseInt(timestamp.substring(0, 4))
    const month = Number.parseInt(timestamp.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(timestamp.substring(6, 8))
    const hour = Number.parseInt(timestamp.substring(8, 10))
    const minute = Number.parseInt(timestamp.substring(10, 12))

    // Create UTC date first, then convert to local
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute))
    return utcDate.toLocaleString()
  } catch (error) {
    return timestamp
  }
}

/**
 * Format a timestamp for UTC time display
 * @param timestamp - Timestamp in YYYYMMDDHHMM format
 * @returns Formatted UTC time string
 */
export function formatUTCTime(timestamp: string): string {
  try {
    // Parse timestamp format: YYYYMMDDHHMM
    const year = Number.parseInt(timestamp.substring(0, 4))
    const month = Number.parseInt(timestamp.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(timestamp.substring(6, 8))
    const hour = Number.parseInt(timestamp.substring(8, 10))
    const minute = Number.parseInt(timestamp.substring(10, 12))

    const date = new Date(Date.UTC(year, month, day, hour, minute))
    return date.toISOString().replace("T", " ").substring(0, 19) + " UTC"
  } catch (error) {
    return timestamp
  }
}

/**
 * Convert a UTC timestamp to local time
 * @param utcTimestamp - UTC timestamp string
 * @returns Local Date object
 */
export function utcToLocal(utcTimestamp: string): Date {
  return new Date(utcTimestamp)
}

/**
 * Get current time in both UTC and local formats
 * @returns Object with UTC and local time strings
 */
export function getCurrentTime(): { utc: string; local: string } {
  const now = new Date()
  return {
    utc: now.toISOString().replace("T", " ").substring(0, 19) + " UTC",
    local: now.toLocaleString(),
  }
}
