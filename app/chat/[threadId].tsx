import React, { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Appbar, Avatar, Text } from 'react-native-paper'
import { useLocalSearchParams, router } from 'expo-router'
import { useThemeColors } from '../../lib/theme-provider'
import { useAuthStore } from '../../hooks/useAuthStore'
import { useMessages } from '../../hooks/useMessages'
import { MessageBubble } from '../../components/MessageBubble'
import { MessageInput } from '../../components/MessageInput'
import { OfflineIndicator } from '../../components/OfflineIndicator'
import { OfflineRetryButton } from '../../components/OfflineRetryButton'
import { Message } from '../../lib/types'
import { supabase } from '../../lib/supabase'

export default function ChatScreen() {
  const colors = useThemeColors()
  const { user } = useAuthStore()
  const params = useLocalSearchParams()
  const threadId = params.threadId as string
  const recipientId = params.participantId as string

  const [participant, setParticipant] = useState<any>(null)
  const [loadingParticipant, setLoadingParticipant] = useState(true)

  const {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMore,
    isOnline
  } = useMessages({ threadId, recipientId })

  // Load participant info
  useEffect(() => {
    const loadParticipant = async () => {
      if (!recipientId) {
        // Extract from threadId
        const parts = threadId.split('_')
        const otherUserId = parts.find(id => id !== user?.id)

        if (otherUserId) {
          try {
            const { data } = await supabase
              .from('users')
              .select('id, name, avatar_url')
              .eq('id', otherUserId)
              .single()

            setParticipant(data)
          } catch (error) {
            console.error('Error loading participant:', error)
          }
        }
        setLoadingParticipant(false)
        return
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', recipientId)
          .single()

        setParticipant(data)
      } catch (error) {
        console.error('Error loading participant:', error)
      } finally {
        setLoadingParticipant(false)
      }
    }

    if (user && threadId) {
      loadParticipant()
    }
  }, [threadId, recipientId, user])

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message)
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.')
    }
  }

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isOwn = item.sender_id === user?.id
    const showAvatar = !isOwn && (
      index === messages.length - 1 ||
      messages[index + 1].sender_id !== item.sender_id
    )

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
      />
    )
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreMessages()
    }
  }

  if (loadingParticipant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Loading..." />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Avatar.Image
          size={32}
          source={{ uri: participant?.avatar_url }}
          style={styles.appbarAvatar}
        />
        <Appbar.Content
          title={participant?.name || 'Unknown User'}
          subtitle={isOnline ? 'Online' : 'Offline'}
        />
        <Appbar.Action icon="phone" onPress={() => {}} />
        <Appbar.Action icon="video" onPress={() => {}} />
      </Appbar.Header>

      <OfflineIndicator />

      <View style={styles.content}>
        {messages.length > 0 ? (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            inverted={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          {!isOnline && (
            <OfflineRetryButton
              onRetry={() => {}}
              disabled={false}
            />
          )}
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!isOnline}
            placeholder={isOnline ? "Type a message..." : "You're offline"}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarAvatar: {
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  inputContainer: {
    // MessageInput has its own styling
  },
})
