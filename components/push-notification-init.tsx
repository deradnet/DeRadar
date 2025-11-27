"use client"

import { useEffect } from 'react'
import { initializePushNotifications, removePushNotificationListeners } from '@/lib/push-notifications'

export function PushNotificationInit() {
  useEffect(() => {
    // Initialize push notifications when component mounts
    initializePushNotifications()

    // Cleanup listeners when component unmounts
    return () => {
      removePushNotificationListeners()
    }
  }, [])

  return null // This component doesn't render anything
}
