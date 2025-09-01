"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Dimensions } from "react-native"
import { Surface, Button, Card, Avatar, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { useThemeColors } from "../../lib/theme-provider"
import { typography } from "../../lib/theme"
import type { Listing, Wallet } from "../../lib/types"

const { width, height } = Dimensions.get('window')

export default function HomeScreen() {
  const { user } = useAuthStore()
  const colors = useThemeColors()
  const [refreshing, setRefreshing] = useState(false)

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

  // Fetch nearby listings
  const { data: nearbyListings, refetch } = useQuery({
    queryKey: ["nearby-listings", user?.city],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select(`
          *,
          user:users(*)
        `)
        .eq("is_active", true)
        .eq("city", user?.city || "")
        .limit(5)
      return data as (Listing & { user: any })[]
    },
    enabled: !!user?.city,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Günaydın"
    if (hour < 18) return "İyi günler"
    return "İyi akşamlar"
  }

  const styles = createStyles(colors)

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="rgba(255,255,255,0.8)" />}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoContainer}>
                  <View style={styles.logo}>
                    <Text style={styles.logoText}>EP</Text>
                  </View>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.greeting}>{getGreeting()}</Text>
                  <Text style={styles.userName}>{user?.name || "User"}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Surface style={styles.pointsContainer} elevation={4}>
                  <MaterialIcons name="stars" size={20} color={colors.secondary} />
                  <Text style={styles.pointsText}>{wallet?.balance_points || 0}</Text>
                </Surface>
              </View>
            </View>

            {/* Quick Actions */}
            <Surface style={styles.quickActionsContainer} elevation={4}>
              <Text style={styles.sectionTitle}>Hızlı Eylemler</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => router.push("/create/offer")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="add" size={24} color={colors.primary} />
                  <Text style={styles.primaryActionText}>Hizmet Sunun</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => router.push("/create/request")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="search" size={24} color={colors.surface} />
                  <Text style={styles.secondaryActionText}>Hizmet İsteyin</Text>
                </TouchableOpacity>
              </View>
            </Surface>

            {/* Main Menu Grid */}
            <Surface style={styles.menuContainer} elevation={4}>
              <Text style={styles.sectionTitle}>Hizmetler</Text>
              <View style={styles.menuGrid}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/(tabs)/discover")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuItemSurface, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="search" size={28} color={colors.surface} />
                    <Text style={[styles.menuItemText, { color: colors.surface }]}>Keşfet</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/(tabs)/messages")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuItemSurface, { backgroundColor: colors.secondary }]}>
                    <MaterialIcons name="chat" size={28} color={colors.surface} />
                    <Text style={[styles.menuItemText, { color: colors.surface }]}>Mesajlar</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/wallet")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuItemSurface, { backgroundColor: colors.tertiary }]}>
                    <MaterialIcons name="account-balance-wallet" size={28} color={colors.surface} />
                    <Text style={[styles.menuItemText, { color: colors.surface }]}>Cüzdan</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push("/bookings")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuItemSurface, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                    <MaterialIcons name="calendar-today" size={28} color={colors.primary} />
                    <Text style={[styles.menuItemText, { color: colors.primary }]}>Rezervasyonlar</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Surface>

            {/* Nearby Services */}
            <Surface style={styles.nearbyContainer} elevation={4}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Yakındaki Hizmetler</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/discover")}>
                  <Text style={styles.viewAllText}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>

              {nearbyListings && nearbyListings.length > 0 ? (
                <View style={styles.listingsContainer}>
                  {nearbyListings.map((listing) => (
                    <Surface key={listing.id} style={styles.listingCard} elevation={2}>
                      <View style={styles.listingContent}>
                        <View style={styles.listingHeader}>
                          <Avatar.Text
                            size={40}
                            label={listing.user?.name?.charAt(0) || "U"}
                            style={{ backgroundColor: colors.primary }}
                          />
                          <View style={styles.listingInfo}>
                            <Text style={styles.listingTitle}>{listing.title}</Text>
                            <Text style={styles.listingUser}>{listing.user?.name}</Text>
                          </View>
                          <View style={[styles.typeChip, listing.type === "offer" ? styles.offerChip : styles.requestChip]}>
                            <Text style={styles.typeChipText}>
                              {listing.type === "offer" ? "Offering" : "Requesting"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.listingDescription} numberOfLines={2}>
                          {listing.description}
                        </Text>
                        <View style={styles.listingFooter}>
                          <Text style={styles.listingRate}>{listing.hourly_point_rate} points/hour</Text>
                          <Text style={styles.listingLocation}>
                            {listing.district}, {listing.city}
                          </Text>
                        </View>
                      </View>
                    </Surface>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="location-off" size={48} color={colors.onSurfaceVariant} />
                  <Text style={styles.emptyStateText}>Yakında hizmet bulunamadı</Text>
                  <Text style={styles.emptyStateSubtext}>Arama alanınızı genişletin veya kendi ilanınızı oluşturun</Text>
                </View>
              )}
            </Surface>

            {/* Quick Access */}
            <Surface style={styles.quickAccessContainer} elevation={4}>
              <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
              <View style={styles.quickAccessGrid}>
                <TouchableOpacity
                  style={styles.quickAccessItem}
                  onPress={() => router.push("/(tabs)/profile")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="person" size={24} color={colors.primary} />
                  <Text style={styles.quickAccessText}>Profil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAccessItem}
                  onPress={() => router.push("/settings")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="settings" size={24} color={colors.primary} />
                  <Text style={styles.quickAccessText}>Ayarlar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAccessItem}
                  onPress={() => router.push("/help")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="help" size={24} color={colors.primary} />
                  <Text style={styles.quickAccessText}>Yardım</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAccessItem}
                  onPress={() => router.push("/about")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="info" size={24} color={colors.primary} />
                  <Text style={styles.quickAccessText}>Hakkında</Text>
                </TouchableOpacity>
              </View>
            </Surface>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    marginRight: 8,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  headerText: {
    gap: 2,
  },
  greeting: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    ...typography.subheading,
    color: colors.surface,
    fontWeight: "600",
  },
  headerRight: {},
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pointsText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.onSurface,
  },
  quickActionsContainer: {
    margin: 24,
    marginTop: 8,
    padding: 24,
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
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.outline,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.primary,
  },
  secondaryActionText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.onSurface,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.onSurface,
    fontWeight: "700",
  },
  viewAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  menuContainer: {
    margin: 24,
    marginTop: 8,
    padding: 24,
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
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  menuItem: {
    width: "48%", // Two columns with gap
    marginBottom: 12,
  },
  menuItemSurface: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItemText: {
    ...typography.caption,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  nearbyContainer: {
    margin: 24,
    marginTop: 8,
    padding: 24,
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
  },
  listingsContainer: {
    gap: 12,
  },
  listingCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  listingInfo: {
    flex: 1,
    gap: 2,
  },
  listingTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.onSurface,
  },
  listingUser: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerChip: {
    backgroundColor: colors.tertiary + "20",
  },
  requestChip: {
    backgroundColor: colors.secondary + "20",
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurface,
  },
  listingDescription: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 18,
  },
  listingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listingRate: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  listingLocation: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceVariant,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.onSurface,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
  quickAccessContainer: {
    margin: 24,
    marginTop: 8,
    padding: 24,
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
  },
  quickAccessGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  quickAccessItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 8,
    fontWeight: "600",
  },
})
