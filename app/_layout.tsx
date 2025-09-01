"use client"

import { useEffect } from "react"
import { Stack } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { theme } from "../lib/theme"
import { useAuthStore } from "../hooks/useAuthStore"

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

export default function RootLayout() {
  const { restoreSession, loading } = useAuthStore()

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Root layout preparing...')
        await restoreSession()
        console.log('✅ Session restored successfully')
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
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={theme.colors.primary} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  )
}
