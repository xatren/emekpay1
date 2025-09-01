"use client"

import React, { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Dimensions
} from "react-native"
import { TextInput, Surface, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { LinearGradient } from "expo-linear-gradient"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import PrimaryButton from "../../components/PrimaryButton"

const loginSchema = z.object({
  email: z
    .string()
    .email("Lütfen geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(1, "Şifre gereklidir"),
})

type LoginForm = z.infer<typeof loginSchema>

const { width, height } = Dimensions.get('window')

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const { signInWithEmail } = useAuthStore()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  // Start animations when component mounts
  React.useEffect(() => {
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
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { error } = await signInWithEmail(data.email, data.password)

      if (error) {
        console.error("Login error:", error.message)
        alert("Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol edin.")
      } else {
        console.log("Login successful")
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
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
            <Animated.View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>EP</Text>
                </View>
              </View>
              <Text style={styles.title}>EmekPay'e Hoş Geldiniz</Text>
              <Text style={styles.subtitle}>
                Yetenekli profesyonellerle bağlantı kurun ve hizmetleriniz için puan kazanın
              </Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View style={styles.formWrapper}>
              <Surface style={styles.formContainer} elevation={4}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Giriş Yapın</Text>
                  <Text style={styles.formSubtitle}>
                    E-posta ve şifrenizle hesabınıza erişin
                  </Text>
                </View>

                <View style={styles.inputContainer}>
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
                        placeholder="ornek@email.com"
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
                      <Text style={styles.errorText}>
                        {errors.email.message}
                      </Text>
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
                      <Text style={styles.errorText}>
                        {errors.password.message}
                      </Text>
                    </Animated.View>
                  )}
                </View>



                <PrimaryButton
                  mode="contained"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  disabled={loading}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                  icon="login"
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </PrimaryButton>

                <View style={styles.securityNote}>
                  <IconButton
                    icon="shield-check"
                    size={16}
                    iconColor={colors.success}
                  />
                  <Text style={styles.securityText}>
                    Güvenli şifre ile giriş
                  </Text>
                </View>
              </Surface>
            </Animated.View>

            {/* Footer */}
            <Animated.View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register-step1')}>
                <Text style={styles.signupLink}>
                  Hesabınız yok mu? <Text style={styles.signupLinkBold}>Kayıt Olun</Text>
                </Text>
              </TouchableOpacity>
              <Text style={styles.footerText}>
                Devam ederek, Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz
              </Text>
            </Animated.View>
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
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
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
  formWrapper: {
    marginBottom: 24,
  },
  formContainer: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
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
    marginTop: 8,
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
    borderRadius: 12,
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
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  securityText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginLeft: 6,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
    marginBottom: 12,
  },
  signupLinkBold: {
    fontWeight: "600",
    color: colors.surface,
    textDecorationLine: "underline",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: "center",
    lineHeight: 18,
  },
})
