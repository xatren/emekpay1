"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Dimensions,
  Alert
} from "react-native"
import { TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LinearGradient } from "expo-linear-gradient"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import PrimaryButton from "../../components/PrimaryButton"

const registerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Lütfen geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
})

type RegisterForm = z.infer<typeof registerSchema>

const { width, height } = Dimensions.get('window')

export default function RegisterStep1Screen() {
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  // Start animations when component mounts
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

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      // Sign up with email and password
      const { error } = await useAuthStore.getState().signUpWithEmail(data.email, data.password, data.name)

      if (error) {
        throw error
      }

      // Get the user data after successful signup
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        throw new Error("Kayıt başarılı ama kullanıcı verisi alınamadı")
      }

      const signUpData = { user: authData.user }

      if (signUpData.user) {
        // Store temporary user data for step 2
        await supabase
          .from("temp_registrations")
          .upsert({
            user_id: signUpData.user.id,
            name: data.name,
            email: data.email,
            step: 1,
            created_at: new Date().toISOString(),
          })

        // User is now registered and logged in automatically
        Alert.alert(
          "Kayıt Başarılı! 🎉",
          "Hesabınız başarıyla oluşturuldu. Hoş geldiniz!",
          [{ text: "Başla", onPress: () => router.replace("/(tabs)/home") }]
        )
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      let errorMessage = "Kayıt işlemi sırasında bir hata oluştu."

      if (error.message.includes("already registered")) {
        errorMessage = "Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın."
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Geçersiz e-posta adresi formatı."
      }

      Alert.alert("Hata", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/(auth)/login")
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>EP</Text>
                </View>
              </View>
              <Text style={styles.title}>EmekPay'e Katılın</Text>
              <Text style={styles.subtitle}>Hızlı ve kolay kayıt olun</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Ad Soyad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={() => {
                      onBlur()
                      setIsFocused(null)
                    }}
                    onFocus={() => setIsFocused('name')}
                    error={!!errors.name}
                    style={[
                      styles.input,
                      isFocused === 'name' && styles.inputFocused
                    ]}
                    mode="outlined"
                    outlineColor={isFocused === 'name' ? colors.primary : colors.border}
                    activeOutlineColor={colors.primary}
                    left={
                      <TextInput.Icon
                        icon="account"
                        color={isFocused === 'name' ? colors.primary : colors.textSecondary}
                      />
                    }
                  />
                )}
              />
              {errors.name && (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                </Animated.View>
              )}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="E-posta Adresi"
                    value={value}
                    onChangeText={onChange}
                    onBlur={() => {
                      onBlur()
                      setIsFocused(null)
                    }}
                    onFocus={() => setIsFocused('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={!!errors.email}
                    style={[
                      styles.input,
                      isFocused === 'email' && styles.inputFocused
                    ]}
                    mode="outlined"
                    outlineColor={isFocused === 'email' ? colors.primary : colors.border}
                    activeOutlineColor={colors.primary}
                    left={
                      <TextInput.Icon
                        icon="email"
                        color={isFocused === 'email' ? colors.primary : colors.textSecondary}
                      />
                    }
                  />
                )}
              />
              {errors.email && (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                </Animated.View>
              )}

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Şifre"
                    value={value}
                    onChangeText={onChange}
                    onBlur={() => {
                      onBlur()
                      setIsFocused(null)
                    }}
                    onFocus={() => setIsFocused('password')}
                    secureTextEntry
                    error={!!errors.password}
                    style={[
                      styles.input,
                      isFocused === 'password' && styles.inputFocused
                    ]}
                    mode="outlined"
                    outlineColor={isFocused === 'password' ? colors.primary : colors.border}
                    activeOutlineColor={colors.primary}
                    left={
                      <TextInput.Icon
                        icon="lock"
                        color={isFocused === 'password' ? colors.primary : colors.textSecondary}
                      />
                    }
                  />
                )}
              />
              {errors.password && (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                </Animated.View>
              )}

              <PrimaryButton
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                icon="email-send"
              >
                {loading ? "Gönderiliyor..." : "Doğrulama E-postası Gönder"}
              </PrimaryButton>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.footerText}>
                  Zaten hesabınız var mı? <Text style={styles.footerLink}>Giriş Yapın</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
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
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  errorContainer: {
    marginTop: -12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.error,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 16,
    height: 56,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonContent: {
    height: 56,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: "center",
  },
  footerLink: {
    color: colors.surface,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
})
