import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/**
 * Standardized haptic feedback utilities for native mobile feel.
 * All haptic calls are wrapped in try-catch to gracefully handle
 * environments where haptics aren't available (web, or permissions denied).
 */

export const haptic = {
  /**
   * Light impact - for subtle interactions like tapping buttons
   */
  light: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Medium impact - for standard interactions like tab switches
   */
  medium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Heavy impact - for important actions like pull-to-refresh trigger
   */
  heavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Success notification - for completed actions
   */
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Error notification - for failed actions
   */
  error: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Warning notification - for warning states
   */
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning })
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Selection feedback - for picker-style interactions
   */
  selection: async () => {
    try {
      await Haptics.selectionStart()
      await Haptics.selectionChanged()
      await Haptics.selectionEnd()
    } catch (e) {
      // Silently fail if haptics not available
    }
  },

  /**
   * Vibrate - simple vibration (fallback for unsupported patterns)
   */
  vibrate: async (duration: number = 50) => {
    try {
      await Haptics.vibrate({ duration })
    } catch (e) {
      // Silently fail if haptics not available
    }
  }
}
