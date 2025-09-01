"use client"

import { useEffect } from "react"
import { Stack } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { ThemeProvider, useTheme } from "../lib/theme-provider"
import { useAuthStore } from "../hooks/useAuthStore"
import { notificationHandler } from "../lib/notification-handler"

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function AppContent() {
  const { restoreSession, loading } = useAuthStore()
  const { theme, isDarkMode } = useTheme()

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Root layout preparing...')
        await restoreSession()
        console.log('✅ Session restored successfully')

        // Initialize notifications
        console.log('📱 Initializing notifications...')
        await notificationHandler.initialize()
        console.log('✅ Notifications initialized successfully')
      } catch (e) {
        console.error('❌ Error during app preparation:', e)
        console.warn(e)
      } finally {
        console.log('👋 Hiding splash screen')
        await SplashScreen.hideAsync()
      }
    }

    prepare()
  }, [restoreSession])

  if (loading) {
    return null // Keep splash screen visible
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar
          style={isDarkMode ? "light" : "dark"}
          backgroundColor={theme.colors.primary}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </PaperProvider>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
