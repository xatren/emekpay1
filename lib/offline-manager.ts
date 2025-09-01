import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase'

export interface OfflineAction {
  id: string
  type: 'create_listing' | 'create_booking' | 'send_message' | 'update_profile'
  payload: any
  timestamp: number
  retryCount: number
}

export class OfflineManager {
  private static instance: OfflineManager
  private isOnline: boolean = true
  private pendingActions: OfflineAction[] = []
  private listeners: Set<(isOnline: boolean) => void> = new Set()

  private constructor() {
    this.initialize()
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  private async initialize() {
    // Network state listener
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline
      this.isOnline = !!state.isConnected

      if (wasOnline !== this.isOnline) {
        this.notifyListeners()
        if (this.isOnline) {
          this.syncPendingActions()
        }
      }
    })

    // Load pending actions from storage
    await this.loadPendingActions()

    return unsubscribe
  }

  private async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem('offline_actions')
      if (stored) {
        this.pendingActions = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading pending actions:', error)
    }
  }

  private async savePendingActions() {
    try {
      await AsyncStorage.setItem('offline_actions', JSON.stringify(this.pendingActions))
    } catch (error) {
      console.error('Error saving pending actions:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  // Public API
  isConnected(): boolean {
    return this.isOnline
  }

  addListener(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async queueAction(type: OfflineAction['type'], payload: any): Promise<string> {
    const action: OfflineAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.pendingActions.push(action)
    await this.savePendingActions()

    // If online, try to execute immediately
    if (this.isOnline) {
      this.syncPendingActions()
    }

    return action.id
  }

  private async syncPendingActions() {
    if (!this.isOnline || this.pendingActions.length === 0) return

    const actionsToProcess = [...this.pendingActions]

    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action)
        // Remove successful action
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id)
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error)
        action.retryCount++

        // Remove if too many retries
        if (action.retryCount >= 3) {
          this.pendingActions = this.pendingActions.filter(a => a.id !== action.id)
          console.warn(`Removed failed action ${action.id} after 3 retries`)
        }
      }
    }

    await this.savePendingActions()
  }

  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'create_listing':
        const { data, error } = await supabase
          .from('listings')
          .insert(action.payload)
        if (error) throw error
        return data

      case 'create_booking':
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert(action.payload)
        if (bookingError) throw bookingError
        return bookingData

      case 'send_message':
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert(action.payload)
        if (messageError) throw messageError
        return messageData

      case 'update_profile':
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .update(action.payload.data)
          .eq('id', action.payload.userId)
        if (profileError) throw profileError
        return profileData

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  getPendingActions(): OfflineAction[] {
    return [...this.pendingActions]
  }

  async clearPendingActions() {
    this.pendingActions = []
    await this.savePendingActions()
  }
}

export const offlineManager = OfflineManager.getInstance()

// Hook for React components
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = React.useState(offlineManager.isConnected())

  React.useEffect(() => {
    const unsubscribe = offlineManager.addListener((online) => setIsOnline(online))
    return unsubscribe
  }, [])

  return isOnline
}
