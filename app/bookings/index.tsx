"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Surface, Card, Chip, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuthStore } from "../../hooks/useAuthStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { colors, typography } from "../../lib/theme"

export default function BookingsScreen() {
  const { user } = useAuthStore()

  // Fetch user bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(*)
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
      return data || []
    },
    enabled: !!user,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return colors.success
      case "pending": return colors.warning
      case "completed": return colors.primary
      case "cancelled": return colors.error
      default: return colors.textSecondary
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed"
      case "pending": return "Pending"
      case "completed": return "Completed"
      case "cancelled": return "Cancelled"
      default: return status
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={styles.headerTitle}>My Bookings</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Bookings List */}
        <View style={styles.content}>
          {isLoading ? (
            <Surface style={styles.loadingState} elevation={1}>
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </Surface>
          ) : bookings && bookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {bookings.map((booking: any) => (
                <Card key={booking.id} style={styles.bookingCard} mode="outlined">
                  <Card.Content style={styles.bookingContent}>
                    <View style={styles.bookingHeader}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle}>
                          {booking.listing?.title || "Service Booking"}
                        </Text>
                        <Text style={styles.bookingProvider}>
                          with {booking.listing?.user?.name || "Service Provider"}
                        </Text>
                      </View>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.statusChip,
                          { borderColor: getStatusColor(booking.status) }
                        ]}
                        textStyle={{ color: getStatusColor(booking.status) }}
                      >
                        {getStatusText(booking.status)}
                      </Chip>
                    </View>

                    <View style={styles.bookingDetails}>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>
                          {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>
                          {booking.listing?.district}, {booking.listing?.city}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialIcons name="attach-money" size={16} color={colors.textSecondary} />
                        <Text style={styles.detailText}>
                          {booking.total_points} points ({booking.duration_hours}h)
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookingActions}>
                      <Button
                        mode="outlined"
                        onPress={() => router.push(`/booking/${booking.id}`)}
                        style={styles.viewButton}
                      >
                        View Details
                      </Button>
                      {booking.status === "confirmed" && (
                        <Button
                          mode="contained"
                          onPress={() => router.push(`/messages/${booking.provider_id}`)}
                          style={styles.messageButton}
                        >
                          Message
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <Surface style={styles.emptyState} elevation={1}>
              <MaterialIcons name="calendar-today" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No bookings yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your service bookings will appear here
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push("/(tabs)/discover")}
                style={styles.exploreButton}
              >
                Explore Services
              </Button>
            </Surface>
          )}
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
    padding: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.text,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  loadingState: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  bookingContent: {
    padding: 20,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookingTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  bookingProvider: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statusChip: {
    height: 28,
  },
  bookingDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 12,
  },
  viewButton: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 12,
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
  exploreButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
  },
})
