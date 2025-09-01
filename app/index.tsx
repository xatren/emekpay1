"use client"

import React, { useState, useEffect } from "react"
import { Redirect } from "expo-router"
import { View } from "react-native"
import { ActivityIndicator } from "react-native-paper"
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Linking from 'expo-linking'
import { useAuthStore } from "../hooks/useAuthStore"
import { colors } from "../lib/theme"
import { handleDeepLink } from "../lib/deepLinkHandler"

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed'

export default function Index() {
  const { user, loading, initializing, debugState } = useAuthStore()
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [handlingDeepLink, setHandlingDeepLink] = useState(false)

  useEffect(() => {
    console.log('🏠 Index component mounted')
    checkOnboardingStatus()
    setupDeepLinkHandling()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      console.log('📱 Checking onboarding status...')
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)
      console.log('📱 Onboarding status:', completed)
      setOnboardingCompleted(completed === 'true')
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error)
      setOnboardingCompleted(false)
    } finally {
      setCheckingOnboarding(false)
    }
  }

  const setupDeepLinkHandling = async () => {
    try {
      // Handle initial URL
      const initialUrl = await Linking.getInitialURL()
      if (initialUrl) {
        setHandlingDeepLink(true)
        handleDeepLink(initialUrl)
        setHandlingDeepLink(false)
      }
    } catch (error) {
      console.error('Error setting up deep link handling:', error)
    }
  }

  // Debug current state
  console.log('🔄 Index render - State check:', {
    loading,
    initializing,
    checkingOnboarding,
    handlingDeepLink,
    hasUser: !!user,
    onboardingCompleted,
    userId: user?.id
  })

  if (loading || initializing || checkingOnboarding || handlingDeepLink) {
    console.log('⏳ Showing loading screen')
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // Handle authenticated users
  if (user) {
    console.log('👤 Authenticated user found:', user.id, 'KYC Level:', user.kyc_level)

    // If user has email (registered user), allow access to home regardless of KYC level
    // This prevents registered users from being redirected to registration flow again
    if (user.email) {
      console.log('✅ Registered user found, redirecting to home...')
      return <Redirect href="/(tabs)/home" />
    }

    // If user has minimal data but no email, they might need profile completion
    if (user.kyc_level >= 1) {
      console.log('🏠 User has sufficient access level, redirecting to home...')
      return <Redirect href="/(tabs)/home" />
    }

    // If user needs profile completion but has basic data
    if (!user.city || user.kyc_level < 2) {
      console.log('📝 User needs profile completion, redirecting...')
      return <Redirect href="/(auth)/profile-completion" />
    }

    // If user data is very minimal, wait for profile loading
    console.log('⏳ User data is minimal, waiting for profile loading...')
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // Handle unauthenticated users
  console.log('👤 No authenticated user found')
  if (onboardingCompleted === false) {
    console.log('📱 Onboarding not completed, redirecting to onboarding...')
    return <Redirect href="/onboarding/screen1" />
  }

  console.log('🔐 Redirecting to login...')
  return <Redirect href="/(auth)/login" />
}
