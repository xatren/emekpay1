"use client"

import { useRef, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native"
import { Surface, Avatar, Button, Card, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { useThemeColors } from "../../lib/theme-provider"
import { typography } from "../../lib/theme"
import type { Wallet } from "../../lib/types"

const { width, height } = Dimensions.get('window')

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()
  const colors = useThemeColors()

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

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
    ]).start()
  }, [])

  // Fetch user wallet
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()
      return data as Wallet
    },
    enabled: !!user,
  })

  const handleSignOut = async () => {
    await signOut()
    router.replace("/(auth)/login")
  }

  const menuItems = [
    {
      icon: "edit",
      title: "Profili Düzenle",
      subtitle: "Bilgilerinizi ve yeteneklerinizi güncelleyin",
      onPress: () => router.push("/profile/edit"),
    },
    {
      icon: "list",
      title: "İlanlarım",
      subtitle: "Hizmet tekliflerinizi ve isteklerinizi yönetin",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "history",
      title: "İşlem Geçmişi",
      subtitle: "Puan işlemlerinizi görüntüleyin",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "star",
      title: "Değerlendirmeler",
      subtitle: "Hizmetleriniz hakkında yapılan yorumları görün",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "verified-user",
      title: "Doğrulama",
      subtitle: "Profil doğrulamanızı tamamlayın",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "help",
      title: "Yardım ve Destek",
      subtitle: "Yardım alın ve destek ile iletişime geçin",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "settings",
      title: "Ayarlar",
      subtitle: "Uygulama tercihleri ve gizlilik",
      onPress: () => {}, // TODO: Implement
    },
  ]

  const styles = createStyles(colors)

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Profile Header */}
            <Surface style={styles.profileHeader} elevation={4}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>EP</Text>
                </View>
              </View>
              <Avatar.Text size={80} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: colors.primary }} />
              <Text style={styles.userName}>{user?.name || "User"}</Text>
                          <Text style={styles.userLocation}>
              {user?.district && user?.city ? `${user.district}, ${user.city}` : "Konum belirtilmemiş"}
            </Text>
              {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}

              {/* Points Balance */}
              <View style={styles.pointsContainer}>
                <MaterialIcons name="stars" size={24} color={colors.secondary} />
                <Text style={styles.pointsText}>{wallet?.balance_points || 0} Puan</Text>
              </View>
            </Surface>

            {/* Stats */}
            <View style={styles.statsContainer}>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Tamamlanan Hizmet</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Alınan Değerlendirme</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>5.0</Text>
            <Text style={styles.statLabel}>Ortalama Puan</Text>
          </Surface>
            </View>

            {/* Menu Items */}
            <Surface style={styles.menuContainer} elevation={4}>
          {menuItems.map((item, index) => (
            <View key={item.title}>
              <Card.Content style={styles.menuItem} onTouchEnd={item.onPress}>
                <View style={styles.menuItemLeft}>
                  <MaterialIcons name={item.icon as any} size={24} color={colors.primary} />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
              </Card.Content>
              {index < menuItems.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
            </Surface>

            {/* Sign Out */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={24} color={colors.error} />
              <Text style={styles.signOutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  profileHeader: {
    margin: 24,
    padding: 32,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  logoContainer: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  userName: {
    ...typography.heading,
    color: colors.onSurface,
    textAlign: "center",
  },
  userLocation: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  userBio: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.secondary + "20",
    borderRadius: 24,
  },
  pointsText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.onSurface,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    ...typography.heading,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center",
  },
  menuContainer: {
    marginHorizontal: 24,
    borderRadius: 24,
    backgroundColor: colors.surface,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  menuItemText: {
    flex: 1,
    gap: 4,
  },
  menuItemTitle: {
    ...typography.body,
    fontWeight: "500",
    color: colors.onSurface,
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  divider: {
    marginHorizontal: 20,
    backgroundColor: colors.outline,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.error,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  signOutText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.error,
  },
})
