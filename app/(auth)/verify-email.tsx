"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors } from "../../lib/theme"
import PrimaryButton from "../../components/PrimaryButton"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const { width, height } = Dimensions.get('window')

export default function VerifyEmailScreen() {
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const params = useLocalSearchParams()

  // Get current Supabase user for verification checks
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    console.log('VerifyEmailScreen mounted with params:', params)
    getCurrentUser()
    handleEmailVerification()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const handleEmailVerification = async () => {
    try {
      setVerifying(true)

      // Handle different verification scenarios
      if (params.token_hash && (params.type === 'signup' || params.type === 'email_confirmation')) {
        // Handle magic link verification
        console.log('Verifying magic link with token_hash:', params.token_hash)

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash as string,
          type: 'signup',
        })

        if (error) {
          console.error('Magic link verification error:', error)
          throw error
        }

        if (data.user && data.session) {
          console.log('Magic link verification successful for user:', data.user.id)
          setVerified(true)

          // Update auth store with the new session
          useAuthStore.setState({
            user: data.user as any,
            session: data.session,
            loading: false,
          })

          // Check if user has completed profile
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single() as { data: any; error: any }

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile check error:', profileError)
          }

          // Always redirect to profile completion for new users after email verification
          setTimeout(() => {
            router.replace("/(auth)/profile-completion")
          }, 2000)
        } else {
          console.error('Magic link verification failed - no user or session data')
          throw new Error("Doğrulama başarısız - kullanıcı verisi alınamadı")
        }
      } else if (currentUser && currentUser.email_confirmed_at) {
        // User is already verified
        console.log('User already verified:', currentUser.id)
        setVerified(true)
        setTimeout(() => {
          router.replace("/(auth)/profile-completion")
        }, 2000)
      } else {
        // No valid verification parameters
        console.error('Invalid verification parameters:', { token_hash: params.token_hash, type: params.type, currentUser: !!currentUser })
        throw new Error("Geçersiz doğrulama bağlantısı - lütfen bağlantıyı kontrol edin")
      }
    } catch (error: any) {
      console.error("Email verification error:", error)
      setError(error.message || "Doğrulama sırasında bir hata oluştu")
      setVerifying(false)

      // Don't automatically redirect to login on error to prevent loops
      // Let user manually navigate back if needed
    }
  }

  const handleRetryVerification = () => {
    console.log('Retrying verification with params:', params)
    setError(null)
    setVerifying(true)
    handleEmailVerification()
  }

  const handleManualLogin = () => {
    console.log('User chose manual login')
    router.replace('/(auth)/login')
  }

  const handleResendEmail = async () => {
    if (!currentUser?.email && !params.email) {
      Alert.alert("Hata", "E-posta adresi bulunamadı")
      return
    }

    const emailToUse = currentUser?.email || params.email as string

    try {
      console.log('Resending verification email to:', emailToUse)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      Alert.alert(
        "E-posta Gönderildi",
        "Yeni doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin."
      )
    } catch (error: any) {
      console.error('Resend failed:', error)
      Alert.alert("Hata", error.message || "E-posta gönderilemedi")
    }
  }

  const handleGoToLogin = () => {
    // Clear any existing auth state before redirecting
    useAuthStore.setState({
      user: null,
      session: null,
      loading: false,
    })
    router.replace("/(auth)/login")
  }

  if (verifying) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EP</Text>
            </View>

            <View style={styles.verificationContainer}>
              <View style={styles.loadingIcon}>
                <Text style={styles.loadingEmoji}>📧</Text>
              </View>
              <Text style={styles.title}>E-posta Doğrulanıyor</Text>
              <Text style={styles.subtitle}>
                E-posta adresiniz doğrulanıyor, lütfen bekleyin...
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  if (verified) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EP</Text>
            </View>

            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✅</Text>
              </View>
              <Text style={styles.title}>E-posta Doğrulandı!</Text>
              <Text style={styles.subtitle}>
                Hesabınız başarıyla doğrulandı. Profil sayfanıza yönlendiriliyorsunuz...
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>EP</Text>
          </View>

          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorEmoji}>❌</Text>
            </View>
            <Text style={styles.title}>Doğrulama Başarısız</Text>
            <Text style={styles.errorText}>
              {error || "E-posta doğrulanırken bir hata oluştu."}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton
              mode="contained"
              onPress={handleRetryVerification}
              style={styles.retryButton}
            >
              Tekrar Dene
            </PrimaryButton>

            {currentUser?.email && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendEmail}
              >
                <Text style={styles.resendButtonText}>
                  Yeni Doğrulama E-postası Gönder
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleManualLogin}
            >
              <Text style={styles.loginButtonText}>Manuel Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: 48,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  verificationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loadingEmoji: {
    fontSize: 50,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 50,
  },
  errorContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.surface,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: width * 0.8,
    opacity: 0.9,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
  },
  retryButton: {
    marginBottom: 16,
    borderRadius: 12,
    height: 50,
  },
  resendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
    alignItems: "center",
  },
  resendButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loginButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
})
