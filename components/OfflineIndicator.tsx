import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Text, Surface, IconButton } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useOfflineStatus } from '../lib/offline-manager'
import { useThemeColors } from '../lib/theme-provider'
import { typography } from '../lib/theme'

interface OfflineIndicatorProps {
  showWhenOnline?: boolean
}

export function OfflineIndicator({ showWhenOnline = false }: OfflineIndicatorProps) {
  const isOnline = useOfflineStatus()
  const colors = useThemeColors()
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: (!isOnline || showWhenOnline) ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isOnline, fadeAnim, showWhenOnline])

  if (isOnline && !showWhenOnline) {
    return null
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Surface style={[styles.banner, { backgroundColor: isOnline ? colors.success : colors.warning }]} elevation={2}>
        <View style={styles.content}>
          <MaterialIcons
            name={isOnline ? "wifi" : "wifi-off"}
            size={20}
            color={isOnline ? colors.onPrimary : colors.onSurface}
          />
          <Text style={[styles.text, { color: isOnline ? colors.onPrimary : colors.onSurface }]}>
            {isOnline ? "Online - All features available" : "Offline - Limited features available"}
          </Text>
        </View>
        {!isOnline && (
          <Text style={[styles.subtext, { color: isOnline ? colors.onPrimary : colors.onSurface }]}>
            Your actions will be synced when connection is restored
          </Text>
        )}
      </Surface>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    margin: 16,
    borderRadius: 8,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  subtext: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
})
