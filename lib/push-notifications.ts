"use client"

import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications'
import { isCapacitor } from './capacitor-utils'

export async function initializePushNotifications() {
  // DISABLED: Push notifications temporarily disabled
  console.log('Push notifications are currently disabled')
  return

  /* COMMENTED OUT - Re-enable when notification server is ready
  if (!isCapacitor()) {
    console.log('Push notifications only available in native app')
    return
  }

  // Request permission to use push notifications
  // iOS will prompt user and return if they granted permission or not
  // Android will just grant without prompting
  try {
    const result = await PushNotifications.requestPermissions()

    if (result.receive === 'granted') {
      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register()
      console.log('Push notifications registered successfully')
    } else {
      console.error('Push notification permission denied')
    }
  } catch (error) {
    console.error('Error requesting push notification permissions:', error)
  }
  */

  /* COMMENTED OUT - Re-enable when notification server is ready
  // On success, we should be able to receive notifications
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('Push registration success, token:', token.value)
    // Store token in your backend here
    // You can send it to your server to store for later use
    localStorage.setItem('fcm_token', token.value)

    // Show alert so user can easily see and copy token
    alert(`FCM Token registered!\n\nToken: ${token.value}\n\nToken copied to console and localStorage.`)
  })

  // Some issue with our setup and push will not work
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Error on registration:', JSON.stringify(error))
    alert(`Push notification registration error:\n\n${JSON.stringify(error, null, 2)}`)
  })

  // Show us the notification payload if the app is open on our device
  PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.log('Push received:', JSON.stringify(notification))

      // You can show a custom in-app notification here
      // For example, using your toast component:
      // toast({
      //   title: notification.title,
      //   description: notification.body,
      // })
    }
  )

  // Method called when tapping on a notification
  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (notification: ActionPerformed) => {
      console.log('Push action performed:', JSON.stringify(notification))

      // Handle notification tap here
      // For example, navigate to a specific screen based on notification data
      const data = notification.notification.data

      if (data.type === 'emergency') {
        // Navigate to emergency aircraft
        console.log('Emergency notification tapped')
      } else if (data.type === 'record') {
        // Navigate to records screen
        console.log('Record notification tapped')
      }
    }
  )
  */
}

// Function to get the current FCM token
export function getFCMToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fcm_token')
}

// Function to remove all listeners (cleanup)
export function removePushNotificationListeners() {
  PushNotifications.removeAllListeners()
}
