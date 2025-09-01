import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

export interface NotificationData {
  type: 'message' | 'booking_request' | 'booking_accepted' | 'booking_completed' | 'payment_received'
  title: string
  body: string
  data?: any
}

class NotificationHandler {
  private static instance: NotificationHandler
  private notificationListener: any
  private responseListener: any

  private constructor() {}

  static getInstance(): NotificationHandler {
    if (!NotificationHandler.instance) {
      NotificationHandler.instance = new NotificationHandler()
    }
    return NotificationHandler.instance
  }

  async initialize() {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })

    // Request permissions
    await this.requestPermissions()

    // Set up listeners
    this.setupListeners()

    // Register for push notifications
    await this.registerForPushNotificationsAsync()
  }

  private async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!')
      return false
    }

    return true
  }

  private setupListeners() {
    // Handle notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
      // Handle in-app notification display if needed
    })

    // Handle notification response (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response)
      this.handleNotificationResponse(response.notification)
    })
  }

  private handleNotificationResponse(notification: Notifications.Notification) {
    const data = notification.request.content.data as NotificationData

    if (!data) return

    switch (data.type) {
      case 'message':
        // Navigate to messages screen with specific conversation
        if (data.data?.threadId) {
          // router.push(`/messages/${data.data.threadId}`)
        }
        break
      case 'booking_request':
        // Navigate to bookings screen
        // router.push('/bookings')
        break
      case 'booking_accepted':
      case 'booking_completed':
        // Navigate to specific booking
        if (data.data?.bookingId) {
          // router.push(`/bookings/${data.data.bookingId}`)
        }
        break
      case 'payment_received':
        // Navigate to wallet
        // router.push('/wallet')
        break
    }
  }

  private async registerForPushNotificationsAsync() {
    let token

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    if (Platform.OS === 'ios') {
      const { status } = await Notifications.getPermissionsAsync()
      if (status !== 'granted') {
        console.warn('iOS push notifications not granted')
        return
      }
    }

    token = (await Notifications.getExpoPushTokenAsync()).data
    console.log('Push token:', token)

    // Store token in AsyncStorage for later use
    await AsyncStorage.setItem('push_token', token)

    return token
  }

  async sendLocalNotification(data: NotificationData) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    })
  }

  async sendPushNotification(data: NotificationData, userId: string) {
    try {
      // Get user's push token from database or cache
      const { data: userTokens, error } = await supabase
        .from('user_push_tokens')
        .select('push_token')
        .eq('user_id', userId)

      if (error || !userTokens?.length) {
        console.warn('No push token found for user:', userId)
        return
      }

      // Send push notification via Expo
      const message = {
        to: userTokens.map(t => t.push_token),
        sound: 'default',
        title: data.title,
        body: data.body,
        data: data,
      }

      // This would typically be sent via Expo's push service
      console.log('Sending push notification:', message)

      // For now, send local notification as fallback
      await this.sendLocalNotification(data)

    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }

  async scheduleNotification(data: NotificationData, trigger: Notifications.NotificationTriggerInput) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        data: data,
      },
      trigger,
    })
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync()
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count)
  }

  destroy() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener)
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener)
    }
  }
}

export const notificationHandler = NotificationHandler.getInstance()

// Helper functions for different notification types
export const sendMessageNotification = async (recipientId: string, senderName: string, message: string) => {
  await notificationHandler.sendPushNotification({
    type: 'message',
    title: 'New Message',
    body: `${senderName}: ${message}`,
    data: { senderName, message },
  }, recipientId)
}

export const sendBookingNotification = async (
  recipientId: string,
  type: 'booking_request' | 'booking_accepted' | 'booking_completed',
  bookingId: string,
  serviceTitle: string
) => {
  const messages = {
    booking_request: `New booking request for "${serviceTitle}"`,
    booking_accepted: `Your booking for "${serviceTitle}" has been accepted`,
    booking_completed: `Your booking for "${serviceTitle}" is now completed`,
  }

  await notificationHandler.sendPushNotification({
    type,
    title: 'Booking Update',
    body: messages[type],
    data: { bookingId, serviceTitle },
  }, recipientId)
}

export const sendPaymentNotification = async (recipientId: string, amount: number, serviceTitle: string) => {
  await notificationHandler.sendPushNotification({
    type: 'payment_received',
    title: 'Payment Received',
    body: `You received ${amount} points for "${serviceTitle}"`,
    data: { amount, serviceTitle },
  }, recipientId)
}
