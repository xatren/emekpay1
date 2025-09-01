"use client"

import React, { useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from "../../lib/theme"

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true')
      router.push('/(auth)/login')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
      router.push('/(auth)/login')
    }
  }

  const handleSignup = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true')
      router.push('/(auth)/register')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
      router.push('/(auth)/register')
    }
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EP</Text>
            </View>
          </View>

          {/* Welcome Content */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Hazırsınız!</Text>
            <Text style={styles.welcomeText}>
              EmekPay deneyimine başlamak için giriş yapın veya yeni bir hesap oluşturun.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Hesap Oluştur</Text>
            </TouchableOpacity>
          </View>

          {/* Terms Text */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Devam ederek Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz.
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 64,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 32,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "center",
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
  },
  signupButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "600",
  },
  termsContainer: {
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: "center",
    lineHeight: 18,
  },
})
