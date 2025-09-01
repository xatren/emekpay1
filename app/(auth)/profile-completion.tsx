"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Dimensions,
  Alert
} from "react-native"
import { TextInput, Surface, Chip } from "react-native-paper"
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

const profileCompletionSchema = z.object({
  city: z.string().min(2, "Lütfen şehrinizi girin"),
  district: z.string().min(2, "Lütfen ilçenizi girin"),
  bio: z.string().optional(),
})

type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>

const { width, height } = Dimensions.get('window')

const skillCategories = [
  "Teknoloji",
  "Tasarım",
  "Yazı",
  "Pazarlama",
  "Eğitim",
  "Sağlık",
  "Fitness",
  "Müzik",
  "Fotoğrafçılık",
  "Yemek",
  "Temizlik",
  "Tamirat",
  "Ulaşım",
  "Çocuk Bakımı",
  "Yaşlı Bakımı",
]

export default function ProfileCompletionScreen() {
  const [loading, setLoading] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const { user } = useAuthStore()

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

    // Load user data from auth metadata
    loadUserData()
  }, [])

  const loadUserData = () => {
    if (!user) {
      Alert.alert("Hata", "Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.")
      router.push("/(auth)/login")
      return
    }

    // Get data from auth metadata (set during signup)
    setUserData({
      name: user.user_metadata?.name || "",
      email: user.email || "",
    })
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileCompletionForm>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      city: "",
      district: "",
      bio: "",
    },
  })

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const onSubmit = async (data: ProfileCompletionForm) => {
    if (!user || !userData) {
      Alert.alert("Hata", "Kullanıcı bilgileri bulunamadı.")
      return
    }

    setLoading(true)
    try {
      // Update user profile (password already set during registration)
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          name: userData.name,
          email: userData.email,
          city: data.city,
          district: data.district,
          bio: data.bio,
          kyc_level: 2, // Email verified, profile completed
        })

      if (profileError) throw profileError

      // Create wallet for new user
      const { error: walletError } = await supabase.from("wallets").insert({
        user_id: user.id,
        balance_points: 1000, // Welcome bonus
      })

      if (walletError && !walletError.message.includes("duplicate key")) {
        throw walletError
      }

      // Add selected skills
      if (selectedSkills.length > 0) {
        const skillsData = selectedSkills.map((skill) => ({
          user_id: user.id,
          title: skill,
          category: skill,
          description: `Skilled in ${skill}`,
          level: "intermediate" as const,
        }))

        const { error: skillsError } = await supabase.from("skills").insert(skillsData)

        if (skillsError) throw skillsError
      }

      // Clean up temporary registration data if it exists
      await supabase
        .from("temp_registrations")
        .delete()
        .eq("user_id", user.id)

      // Navigate to main app
      router.replace("/(tabs)/home")
    } catch (error) {
      console.error("Profile completion error:", error)
      Alert.alert(
        "Hata",
        "Profil tamamlanırken bir hata oluştu. Lütfen tekrar deneyin."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!userData) {
    return (
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <SafeAreaView style={styles.loadingContent}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>EP</Text>
          </View>
          <Text style={styles.loadingText}>Profiliniz hazırlanıyor...</Text>
        </SafeAreaView>
      </LinearGradient>
    )
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
              <Text style={styles.title}>Profilinizi Tamamlayın</Text>
              <Text style={styles.subtitle}>
                Merhaba {userData.name}! Son birkaç adım kaldı.
              </Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* User Info Display */}
              <Surface style={styles.userInfoContainer} elevation={4}>
                <Text style={styles.userInfoTitle}>Hesap Bilgileriniz</Text>
                <View style={styles.userInfoRow}>
                  <Text style={styles.userInfoLabel}>Ad Soyad:</Text>
                  <Text style={styles.userInfoValue}>{userData.name}</Text>
                </View>
                <View style={styles.userInfoRow}>
                  <Text style={styles.userInfoLabel}>E-posta:</Text>
                  <Text style={styles.userInfoValue}>{userData.email}</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ E-posta Doğrulandı</Text>
                </View>
              </Surface>

              {/* Profile Form */}
              <Surface style={styles.formContainer} elevation={4}>
                <Text style={styles.sectionTitle}>Profil Bilgileri</Text>

                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Şehir"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur()
                        setIsFocused(null)
                      }}
                      onFocus={() => setIsFocused('city')}
                      error={!!errors.city}
                      style={[
                        styles.input,
                        isFocused === 'city' && styles.inputFocused
                      ]}
                      mode="outlined"
                      outlineColor={isFocused === 'city' ? colors.primary : colors.border}
                      activeOutlineColor={colors.primary}
                      left={
                        <TextInput.Icon
                          icon="city"
                          color={isFocused === 'city' ? colors.primary : colors.textSecondary}
                        />
                      }
                    />
                  )}
                />
                {errors.city && (
                  <Animated.View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.city.message}</Text>
                  </Animated.View>
                )}

                <Controller
                  control={control}
                  name="district"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="İlçe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur()
                        setIsFocused(null)
                      }}
                      onFocus={() => setIsFocused('district')}
                      error={!!errors.district}
                      style={[
                        styles.input,
                        isFocused === 'district' && styles.inputFocused
                      ]}
                      mode="outlined"
                      outlineColor={isFocused === 'district' ? colors.primary : colors.border}
                      activeOutlineColor={colors.primary}
                      left={
                        <TextInput.Icon
                          icon="map-marker"
                          color={isFocused === 'district' ? colors.primary : colors.textSecondary}
                        />
                      }
                    />
                  )}
                />
                {errors.district && (
                  <Animated.View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errors.district.message}</Text>
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

                <Controller
                  control={control}
                  name="bio"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="Hakkımda (İsteğe bağlı)"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur()
                        setIsFocused(null)
                      }}
                      onFocus={() => setIsFocused('bio')}
                      multiline
                      numberOfLines={3}
                      placeholder="Kendinizden bahsedin..."
                      style={[
                        styles.input,
                        isFocused === 'bio' && styles.inputFocused
                      ]}
                      mode="outlined"
                      outlineColor={isFocused === 'bio' ? colors.primary : colors.border}
                      activeOutlineColor={colors.primary}
                      left={
                        <TextInput.Icon
                          icon="text"
                          color={isFocused === 'bio' ? colors.primary : colors.textSecondary}
                        />
                      }
                    />
                  )}
                />
              </Surface>

              {/* Skills Selection */}
              <Surface style={styles.skillsContainer} elevation={4}>
                <Text style={styles.sectionTitle}>Yeteneklerinizi Seçin</Text>
                <Text style={styles.skillsSubtitle}>
                  Uzman olduğunuz veya öğrenmek istediğiniz kategorileri seçin
                </Text>

                <View style={styles.skillsGrid}>
                  {skillCategories.map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      onPress={() => toggleSkill(skill)}
                      style={[
                        styles.skillChip,
                        selectedSkills.includes(skill) && styles.skillChipSelected
                      ]}
                    >
                      <Text style={[
                        styles.skillChipText,
                        selectedSkills.includes(skill) && styles.skillChipTextSelected
                      ]}>
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Surface>

              {/* Submit Button */}
              <PrimaryButton
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
                icon="check"
              >
                {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
              </PrimaryButton>
            </ScrollView>
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
    justifyContent: "flex-start",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.surface,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  userInfoContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  verifiedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  verifiedText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "600",
  },
  formContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
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
    marginTop: -8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.error,
    marginLeft: 4,
  },
  skillsContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skillsSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  skillChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  skillChipTextSelected: {
    color: colors.surface,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
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
})
