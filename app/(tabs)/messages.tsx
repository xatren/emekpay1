import React, { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated, Dimensions } from "react-native"
import { Surface, Searchbar, FAB, Avatar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import { useThemeColors } from "../../lib/theme-provider"
import { typography } from "../../lib/theme"
import { useAuthStore } from "../../hooks/useAuthStore"
import { supabase } from "../../lib/supabase"

const { width, height } = Dimensions.get('window')

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

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
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.threadId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.conversationContent}>
        <Avatar.Image
          size={50}
          source={{ uri: item.participantAvatar }}
          style={styles.avatar}
        />
        <View style={styles.conversationText}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName}>
              {item.participantName}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageTime).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
          </View>
          <Text
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
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

  const styles = createStyles(colors)

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>EP</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Mesajlar</Text>
            <Text style={styles.headerSubtitle}>
              Hizmet sağlayıcılar ve müşterilerle sohbet edin
            </Text>
          </View>

          <Surface style={styles.searchContainer} elevation={4}>
            <Searchbar
              placeholder="Sohbetlerde ara..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={colors.onSurfaceVariant}
              inputStyle={{ color: colors.onSurface }}
            />
          </Surface>

          <Surface style={styles.conversationsContainer} elevation={4}>
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
                <View style={styles.emptyState}>
                  <MaterialIcons name="chat-bubble-outline" size={64} color={colors.onSurfaceVariant} />
                  <Text style={styles.emptyStateText}>
              {searchQuery ? 'Sohbet bulunamadı' : 'Henüz mesaj yok'}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? 'Farklı bir arama terimi deneyin'
                : 'Bir hizmet sağlayıcısıyla iletişime geçerek veya hizmet isteğine yanıt vererek sohbet başlatın'
              }
                  </Text>
                </View>
              </View>
            )}
          </Surface>

          <FAB
            icon="message-plus"
            style={[styles.fab, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/contacts')}
            color={colors.primary}
          />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.surface,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
  },
  searchContainer: {
    margin: 24,
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  searchBar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
  },
  conversationsContainer: {
    flex: 1,
    margin: 24,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  conversationItem: {
    borderRadius: 16,
    marginVertical: 4,
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: colors.onSurface,
  },
  timestamp: {
    ...typography.caption,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  lastMessage: {
    ...typography.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
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
    color: colors.surface,
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
    backgroundColor: colors.surfaceVariant,
  },
  emptyStateText: {
    ...typography.subheading,
    textAlign: "center",
    color: colors.onSurface,
  },
  emptyStateSubtext: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 24,
    color: colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
})
