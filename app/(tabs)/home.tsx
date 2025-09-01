"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native"
import { Surface, Button, Card, Avatar, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import type { Listing, Wallet } from "../../lib/types"

export default function HomeScreen() {
  const { user } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)

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
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar.Text size={48} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: colors.primary }} />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || "User"}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Surface style={styles.pointsContainer} elevation={2}>
              <MaterialIcons name="stars" size={20} color={colors.secondary} />
              <Text style={styles.pointsText}>{wallet?.balance_points || 0}</Text>
            </Surface>
          </View>
        </View>

        {/* Quick Actions */}
        <Surface style={styles.quickActionsContainer} elevation={2}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              onPress={() => router.push("/create/offer")}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              contentStyle={styles.actionButtonContent}
              icon="add"
            >
              Offer Service
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push("/create/request")}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              icon="search"
            >
              Request Service
            </Button>
          </View>
        </Surface>

        {/* Main Menu Grid */}
        <Surface style={styles.menuContainer} elevation={2}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/discover")}
              activeOpacity={0.7}
            >
              <Surface style={[styles.menuItemSurface, styles.menuItemActive]} elevation={1}>
                <MaterialIcons name="search" size={32} color={colors.primary} />
                <Text style={styles.menuItemText}>Discover Services</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/messages")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="chat" size={32} color={colors.secondary} />
                <Text style={styles.menuItemText}>Messages</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/wallet")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="account-balance-wallet" size={32} color={colors.success} />
                <Text style={styles.menuItemText}>My Wallet</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/bookings")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="calendar-today" size={32} color={colors.warning} />
                <Text style={styles.menuItemText}>My Bookings</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="person" size={32} color={colors.primary} />
                <Text style={styles.menuItemText}>Profile</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="settings" size={32} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Settings</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/help")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="help" size={32} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </Surface>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/about")}
              activeOpacity={0.7}
            >
              <Surface style={styles.menuItemSurface} elevation={1}>
                <MaterialIcons name="info" size={32} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>About</Text>
              </Surface>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Nearby Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Services</Text>
            <Button mode="text" onPress={() => router.push("/(tabs)/discover")}>
              View All
            </Button>
          </View>

          {nearbyListings && nearbyListings.length > 0 ? (
            <View style={styles.listingsContainer}>
              {nearbyListings.map((listing) => (
                <Card key={listing.id} style={styles.listingCard} mode="outlined">
                  <Card.Content style={styles.listingContent}>
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
                      <Chip
                        mode="outlined"
                        style={[styles.typeChip, listing.type === "offer" ? styles.offerChip : styles.requestChip]}
                        textStyle={styles.typeChipText}
                      >
                        {listing.type === "offer" ? "Offering" : "Requesting"}
                      </Chip>
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
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <Surface style={styles.emptyState} elevation={1}>
              <MaterialIcons name="location-off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No nearby services found</Text>
              <Text style={styles.emptyStateSubtext}>Try expanding your search area or create your own listing</Text>
            </Surface>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialIcons name="history" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>Your bookings and transactions will appear here</Text>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  headerText: {
    gap: 2,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.subheading,
    color: colors.text,
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
  },
  pointsText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  quickActionsContainer: {
    margin: 24,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  listingsContainer: {
    gap: 12,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.text,
  },
  listingUser: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  typeChip: {
    height: 28,
  },
  offerChip: {
    backgroundColor: colors.success + "20",
    borderColor: colors.success,
  },
  requestChip: {
    backgroundColor: colors.secondary + "20",
    borderColor: colors.secondary,
  },
  typeChipText: {
    fontSize: 12,
  },
  listingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  menuContainer: {
    margin: 24,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  menuItemActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  menuItemText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
})
