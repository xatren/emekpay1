import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useOfflineStatus } from '../lib/offline-manager'
import { useThemeColors } from '../lib/theme-provider'
import { typography } from '../lib/theme'

interface OfflineRetryButtonProps {
  onRetry: () => void
  loading?: boolean
  disabled?: boolean
}

export function OfflineRetryButton({ onRetry, loading = false, disabled = false }: OfflineRetryButtonProps) {
  const isOnline = useOfflineStatus()
  const colors = useThemeColors()

  if (isOnline) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        You're offline. This action will be queued and synced when you're back online.
      </Text>
      <Button
        mode="outlined"
        onPress={onRetry}
        loading={loading}
        disabled={disabled}
        icon="refresh"
        style={[styles.button, { borderColor: colors.primary }]}
        contentStyle={styles.buttonContent}
      >
        Queue Action
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
})
