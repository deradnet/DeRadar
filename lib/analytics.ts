/**
 * Analytics utility - Simplified version without external dependencies
 * Provides basic event tracking for debugging and development
 */

class Analytics {
  private isEnabled: boolean

  constructor() {
    // Only enable in development for debugging
    this.isEnabled = process.env.NODE_ENV === "development"
  }

  /**
   * Track a custom event (console logging only)
   */
  trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
    if (!this.isEnabled) {
      return
    }

    console.log(`📊 Event: ${eventName}`, props)
  }

  /**
   * Track map interactions
   */
  trackMapInteraction(action: string, details?: Record<string, any>) {
    this.trackEvent("Map Interaction", {
      action,
      ...details,
    })
  }

  /**
   * Track playback events
   */
  trackPlaybackEvent(
    action: "start" | "pause" | "stop" | "speed_change" | "mode_toggle",
    details?: Record<string, any>,
  ) {
    this.trackEvent("Playback Event", {
      action,
      ...details,
    })
  }

  /**
   * Track aircraft interactions
   */
  trackAircraftInteraction(action: string, aircraftType?: string, isEmergency?: boolean) {
    this.trackEvent("Aircraft Interaction", {
      action,
      aircraft_type: aircraftType || "unknown",
      is_emergency: isEmergency || false,
    })
  }

  /**
   * Track settings changes
   */
  trackSettingsChange(setting: string, value: string | number | boolean) {
    this.trackEvent("Settings Change", {
      setting,
      value: String(value),
    })
  }

  /**
   * Track mobile interactions
   */
  trackMobileInteraction(action: string, details?: Record<string, any>) {
    this.trackEvent("Mobile Interaction", {
      action,
      ...details,
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit = "ms") {
    this.trackEvent("Performance", {
      metric,
      value,
      unit,
    })
  }

  /**
   * Track errors
   */
  trackError(error: string, context?: string) {
    this.trackEvent("Error", {
      error,
      context: context || "unknown",
    })
  }

  /**
   * Track page views (no-op)
   */
  trackPageView(props?: Record<string, string | number | boolean>) {
    // No-op - removed external analytics
  }

  /**
   * Track emergency alerts
   */
  trackEmergencyAlert(aircraftType?: string, squawkCode?: string) {
    this.trackEvent("Emergency Alert", {
      aircraft_type: aircraftType || "unknown",
      squawk_code: squawkCode || "unknown",
    })
  }

  /**
   * Track data refresh events
   */
  trackDataRefresh(source: "manual" | "auto" = "manual") {
    this.trackEvent("Data Refresh", {
      source,
    })
  }

  /**
   * Track load times
   */
  trackLoadTime(component: string, loadTime: number) {
    this.trackPerformance(`${component}_load_time`, loadTime, "ms")
  }
}

// Export singleton instance
export const analytics = new Analytics()
