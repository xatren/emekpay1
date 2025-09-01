import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Surface, Searchbar, FAB, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useThemeColors } from "../../lib/theme-provider"
import { typography, extendedColors } from "../../lib/theme"
import { useAuthStore } from "../../hooks/useAuthStore"
import { supabase } from "../../lib/supabase"

interface Conversation {
  id: string
  threadId: string
  lastMessage: string
  lastMessageTime: string
  participantName: string
  participantAvatar?: string
  unreadCount: number
}

export default function MessagesScreen() {
  const colors = useThemeColors()
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Check if there's a conversation to open from params
  const params = useLocalSearchParams()
  useEffect(() => {
    if (params.threadId && params.participantId) {
      router.push(`/chat/${params.threadId}?participantId=${params.participantId}`)
    }
  }, [params])

  useEffect(() => {
    loadConversations()
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get all messages for current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, name, avatar_url),
          thread:thread_id
        `)
        .or(`sender_id.eq.${user.id},thread_id.in.(${getUserThreads()})`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading conversations:', error)
        return
      }

      // Group messages by thread
      const threadMap = new Map<string, any[]>()

      messages?.forEach(message => {
        if (!threadMap.has(message.thread_id)) {
          threadMap.set(message.thread_id, [])
        }
        threadMap.get(message.thread_id)!.push(message)
      })

      // Convert to conversations
      const conversationsData: Conversation[] = []

      for (const [threadId, threadMessages] of threadMap) {
        const sortedMessages = threadMessages.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        const lastMessage = sortedMessages[0]
        const otherParticipant = lastMessage.sender_id === user.id
          ? await getThreadParticipant(threadId, user.id)
          : lastMessage.sender

        if (otherParticipant) {
          conversationsData.push({
            id: threadId,
            threadId,
            lastMessage: lastMessage.body,
            lastMessageTime: lastMessage.created_at,
            participantName: otherParticipant.name || 'Unknown User',
            participantAvatar: otherParticipant.avatar_url,
            unreadCount: await getUnreadCount(threadId, user.id)
          })
        }
      }

      setConversations(conversationsData.sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ))
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getUserThreads = () => {
    // This is a simplified approach - in production you'd track user's threads
    return [`(${user?.id}_%`, `(%_${user?.id})`]
  }

  const getThreadParticipant = async (threadId: string, currentUserId: string) => {
    // Extract other participant ID from thread
    const parts = threadId.split('_')
    const otherUserId = parts.find(id => id !== currentUserId)

    if (otherUserId) {
      const { data } = await supabase
        .from('users')
        .select('id, name, avatar_url')
        .eq('id', otherUserId)
        .single()

      return data
    }
    return null
  }

  const getUnreadCount = async (threadId: string, userId: string) => {
    // In a real app, you'd track read status
    // For now, return 0
    return 0
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/chat/${item.threadId}`)}
    >
      <View style={styles.conversationContent}>
        <Avatar.Image
          size={50}
          source={{ uri: item.participantAvatar }}
          style={styles.avatar}
        />
        <View style={styles.conversationText}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, { color: colors.onSurface }]}>
              {item.participantName}
            </Text>
            <Text style={[styles.timestamp, { color: extendedColors.textSecondary }]}>
              {new Date(item.lastMessageTime).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, { color: extendedColors.textSecondary }]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.unreadCount, { color: colors.surface }]}>
              {item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const handleRefresh = () => {
    setRefreshing(true)
    loadConversations()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Messages</Text>
        <Text style={[styles.headerSubtitle, { color: extendedColors.textSecondary }]}>
          Chat with service providers and clients
        </Text>
      </View>

      <Searchbar
        placeholder="Search conversations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, {
          backgroundColor: colors.surface,
          color: colors.onSurface
        }]}
        iconColor={extendedColors.textSecondary}
        inputStyle={{ color: colors.onSurface }}
      />

      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          style={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Surface style={[styles.emptyState, { backgroundColor: colors.surface }]} elevation={1}>
            <MaterialIcons name="chat-bubble-outline" size={64} color={extendedColors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: extendedColors.textSecondary }]}>
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: extendedColors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start a conversation by contacting a service provider or responding to a service request'
              }
            </Text>
          </Surface>
        </View>
      )}

      <FAB
        icon="message-plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/contacts')}
        color={colors.surface}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    ...typography.heading,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
  },
  searchBar: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  conversationItem: {
    borderRadius: 12,
    marginVertical: 4,
    padding: 16,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  conversationText: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    ...typography.subheading,
    fontWeight: '600',
  },
  timestamp: {
    ...typography.caption,
    fontSize: 12,
  },
  lastMessage: {
    ...typography.body,
    fontSize: 14,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
  },
  emptyStateText: {
    ...typography.subheading,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})
