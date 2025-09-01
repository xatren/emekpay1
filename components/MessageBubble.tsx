import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Surface, Text } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useThemeColors } from '../lib/theme-provider'
import { typography } from '../lib/theme'
import { Message } from '../lib/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const colors = useThemeColors()

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      {!isOwn && showAvatar && (
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={24} color={colors.primary} />
        </View>
      )}

      <View style={[
        styles.bubbleContainer,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Surface
          style={[
            styles.bubble,
            isOwn ? styles.ownBubbleSurface : styles.otherBubbleSurface,
            { backgroundColor: isOwn ? colors.primary : colors.surface }
          ]}
          elevation={1}
        >
          <Text style={[
            styles.messageText,
            { color: isOwn ? colors.surface : colors.onSurface }
          ]}>
            {message.body}
          </Text>

          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              { color: isOwn ? colors.surface + 'CC' : colors.textSecondary }
            ]}>
              {formatTime(message.created_at)}
            </Text>

            {isOwn && (
              <MaterialIcons
                name="done-all"
                size={14}
                color={colors.surface + 'CC'}
                style={styles.readIndicator}
              />
            )}
          </View>
        </Surface>
      </View>

      {isOwn && showAvatar && (
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={24} color={colors.primary} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  bubbleContainer: {
    maxWidth: '70%',
    minWidth: 80,
  },
  ownBubble: {
    alignItems: 'flex-end',
  },
  otherBubble: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  ownBubbleSurface: {
    borderBottomRightRadius: 4,
  },
  otherBubbleSurface: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    ...typography.caption,
    fontSize: 11,
  },
  readIndicator: {
    marginLeft: 4,
  },
})
