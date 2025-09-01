"use client"

import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Surface, Avatar, Button, Card, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import type { Wallet } from "../../lib/types"

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore()

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
      title: "Edit Profile",
      subtitle: "Update your information and skills",
      onPress: () => router.push("/profile/edit"),
    },
    {
      icon: "list",
      title: "My Listings",
      subtitle: "Manage your service offerings and requests",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "history",
      title: "Transaction History",
      subtitle: "View your point transactions",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "star",
      title: "Reviews & Ratings",
      subtitle: "See what others say about your services",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "verified-user",
      title: "Verification",
      subtitle: "Complete your profile verification",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "help",
      title: "Help & Support",
      subtitle: "Get help and contact support",
      onPress: () => {}, // TODO: Implement
    },
    {
      icon: "settings",
      title: "Settings",
      subtitle: "App preferences and privacy",
      onPress: () => {}, // TODO: Implement
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Surface style={styles.profileHeader} elevation={2}>
          <Avatar.Text size={80} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: colors.primary }} />
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userLocation}>
            {user?.district && user?.city ? `${user.district}, ${user.city}` : "Location not set"}
          </Text>
          {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}

          {/* Points Balance */}
          <View style={styles.pointsContainer}>
            <MaterialIcons name="stars" size={24} color={colors.secondary} />
            <Text style={styles.pointsText}>{wallet?.balance_points || 0} Points</Text>
          </View>
        </Surface>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Services Completed</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Reviews Received</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statNumber}>5.0</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </Surface>
        </View>

        {/* Menu Items */}
        <Surface style={styles.menuContainer} elevation={2}>
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
                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
              </Card.Content>
              {index < menuItems.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Surface>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          contentStyle={styles.signOutButtonContent}
          textColor={colors.error}
          icon="logout"
        >
          Sign Out
        </Button>
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
  profileHeader: {
    margin: 24,
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 12,
  },
  userName: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
  },
  userLocation: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  userBio: {
    ...typography.caption,
    color: colors.textSecondary,
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
    color: colors.text,
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    ...typography.heading,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  menuContainer: {
    marginHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 24,
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
    color: colors.text,
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  divider: {
    marginHorizontal: 20,
    backgroundColor: colors.border,
  },
  signOutButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderColor: colors.error,
  },
  signOutButtonContent: {
    paddingVertical: 8,
  },
})
