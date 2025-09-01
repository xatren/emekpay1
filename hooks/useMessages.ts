import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import { Message } from '../lib/types'
import { offlineManager } from '../lib/offline-manager'
import { notificationHandler, sendMessageNotification } from '../lib/notification-handler'

interface UseMessagesProps {
  threadId: string
  recipientId?: string
}

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: string | null
  sendMessage: (body: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  hasMore: boolean
  isOnline: boolean
}

export function useMessages({ threadId, recipientId }: UseMessagesProps): UseMessagesReturn {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [isOnline, setIsOnline] = useState(offlineManager.isConnected())

  const MESSAGES_PER_PAGE = 20

  // Network status listener
  useEffect(() => {
    const unsubscribe = offlineManager.addListener(setIsOnline)
    return unsubscribe
  }, [])

  // Load initial messages
  const loadMessages = useCallback(async (loadMore = false) => {
    if (!user || !threadId) return

    try {
      setError(null)
      if (!loadMore) setLoading(true)

      const from = loadMore ? page * MESSAGES_PER_PAGE : 0
      const to = from + MESSAGES_PER_PAGE - 1

      console.log('Loading messages for thread:', threadId, 'from:', from, 'to:', to)

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, name, email, avatar_url)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) {
        console.error('Error loading messages:', fetchError)
        setError(fetchError.message)
        return
      }

      if (data) {
        console.log('Loaded messages:', data.length)
        const formattedMessages = data.map(msg => ({
          ...msg,
          sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
        }))

        if (loadMore) {
          setMessages(prev => [...formattedMessages.reverse(), ...prev])
        } else {
          setMessages(formattedMessages.reverse())
        }

        setHasMore(data.length === MESSAGES_PER_PAGE)
        if (loadMore) setPage(prev => prev + 1)
      }
    } catch (err: any) {
      console.error('Error in loadMessages:', err)
      setError(err.message)
    } finally {
      if (!loadMore) setLoading(false)
    }
  }, [user, threadId, page])

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Set up real-time subscription
  useEffect(() => {
    if (!threadId || !user) return

    console.log('Setting up real-time subscription for thread:', threadId)

    const subscription = supabase
      .channel(`messages_${threadId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      }, (payload) => {
        console.log('New message received:', payload)

        // Add new message to state if it's not from current user
        if (payload.new.sender_id !== user.id) {
          const newMessage = {
            ...payload.new,
            sender: {
              id: payload.new.sender_id,
              name: payload.new.sender_name || 'Unknown',
              email: '',
              avatar_url: null
            }
          } as Message

          setMessages(prev => [...prev, newMessage])

          // Send notification if app is in background
          if (recipientId && payload.new.sender_name) {
            sendMessageNotification(
              recipientId,
              payload.new.sender_name,
              payload.new.body
            )
          }
        }
      })
      .subscribe()

    return () => {
      console.log('Cleaning up message subscription')
      subscription.unsubscribe()
    }
  }, [threadId, user, recipientId])

  const sendMessage = useCallback(async (body: string) => {
    if (!user || !threadId || !body.trim()) return

    const messageData = {
      thread_id: threadId,
      sender_id: user.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
      sender_name: user.name // For notifications
    }

    try {
      if (isOnline) {
        // Send immediately if online
        const { data, error } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single()

        if (error) throw error

        // Add to local state
        const newMessage: Message = {
          ...data,
          sender: user
        }
        setMessages(prev => [...prev, newMessage])

        // Send notification to recipient
        if (recipientId) {
          await sendMessageNotification(recipientId, user.name, body)
        }
      } else {
        // Queue for offline sync
        await offlineManager.queueAction('send_message', messageData)

        // Add to local state optimistically
        const optimisticMessage: Message = {
          id: `temp_${Date.now()}`,
          thread_id: threadId,
          sender_id: user.id,
          body: body.trim(),
          created_at: new Date().toISOString(),
          sender: user
        }
        setMessages(prev => [...prev, optimisticMessage])
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message)
      throw err
    }
  }, [user, threadId, isOnline, recipientId])

  const loadMoreMessages = useCallback(async () => {
    if (hasMore && !loading) {
      await loadMessages(true)
    }
  }, [hasMore, loading, loadMessages])

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMore,
    isOnline
  }
}

// Hook for creating new conversations
export function useCreateConversation() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createConversation = useCallback(async (participantId: string, initialMessage?: string) => {
    if (!user) return null

    setLoading(true)
    setError(null)

    try {
      // Generate thread ID (simple approach - combine user IDs)
      const threadId = [user.id, participantId].sort().join('_')

      // Check if conversation already exists
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('thread_id', threadId)
        .limit(1)

      if (existingMessages && existingMessages.length > 0) {
        return threadId // Return existing thread
      }

      // Create new conversation with initial message
      if (initialMessage) {
        const messageData = {
          thread_id: threadId,
          sender_id: user.id,
          body: initialMessage,
          sender_name: user.name
        }

        const { error } = await supabase
          .from('messages')
          .insert(messageData)

        if (error) throw error
      }

      return threadId
    } catch (err: any) {
      console.error('Error creating conversation:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    createConversation,
    loading,
    error
  }
}
