import React, { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TextInput, IconButton, Surface } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useThemeColors } from '../lib/theme-provider'
import { typography } from '../lib/theme'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

export function MessageInput({
  onSendMessage,
  placeholder = "Mesajınızı yazın...",
  disabled = false,
  loading = false
}: MessageInputProps) {
  const colors = useThemeColors()
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled && !loading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Surface style={[styles.container, { backgroundColor: colors.surface }]} elevation={4}>
        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.onSurface
              }
            ]}
            disabled={disabled}
            onKeyPress={handleKeyPress}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            mode="outlined"
            dense
          />

          <IconButton
            icon="send"
            size={24}
            onPress={handleSend}
            disabled={!message.trim() || disabled || loading}
            loading={loading}
            iconColor={message.trim() && !disabled && !loading ? colors.primary : colors.textSecondary}
            style={styles.sendButton}
          />
        </View>

        {message.length > 900 && (
          <View style={styles.charCount}>
            <MaterialIcons
              name="info-outline"
              size={14}
              color={message.length > 1000 ? colors.error : colors.textSecondary}
            />
          </View>
        )}
      </Surface>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    borderRadius: 22,
  },
  sendButton: {
    margin: 0,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginRight: 8,
  },
})
