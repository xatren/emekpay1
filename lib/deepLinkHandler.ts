import { router } from "expo-router"
import * as Linking from 'expo-linking'

export const handleDeepLink = (url: string) => {
  try {
    const { hostname, path, queryParams } = Linking.parse(url)

    // Handle Supabase auth callbacks
    if (hostname === 'dprchhnsvxagrisgfoxx.supabase.co' || url.includes('supabase.co')) {
      if (path?.includes('/auth/v1/callback')) {
        const { access_token, refresh_token, type, token } = queryParams || {}

        // With traditional auth, users are automatically logged in after signup
        // No need for email verification redirects
        if (access_token) {
          // Handle OAuth callback if needed
          router.replace('/(tabs)/home')
        } else if (type === 'recovery') {
          // Handle password reset
          router.replace('/(auth)/reset-password')
        }
      }
    }

    // Handle custom app scheme
    if (hostname === 'emekpay' || url.startsWith('emekpay://')) {
      if (path === '/verify-email') {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: queryParams
        })
      } else if (path === '/reset-password') {
        router.replace('/(auth)/reset-password')
      }
    }
  } catch (error) {
    console.error('Error handling deep link:', error)
  }
}

export const setupDeepLinkListener = () => {
  // Handle initial URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url)
    }
  })

  // Handle incoming links
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url)
  })

  return subscription
}

// Utility to create email verification links
export const createEmailVerificationLink = (token: string, type: string = 'signup') => {
  const baseUrl = Linking.createURL('')
  return `${baseUrl}/verify-email?token=${token}&type=${type}`
}

// Utility to create password reset links
export const createPasswordResetLink = (token: string) => {
  const baseUrl = Linking.createURL('')
  return `${baseUrl}/reset-password?token=${token}`
}
