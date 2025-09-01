"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { EscrowService } from "../../lib/escrow"
import { theme } from "../../lib/theme"

interface Booking {
  id: string
  listing_id: string
  client_id: string
  provider_id: string
  scheduled_date: string
  scheduled_time: string
  duration_hours: number
  total_points: number
  status: string
  payment_status: string
  message: string
  created_at: string
  listing: {
    title: string
    points_per_hour: number
  }
  client: {
    full_name: string
    avatar_url: string
  }
  provider: {
    full_name: string
    avatar_url: string
  }
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams()
  const { user } = useAuthStore()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(title, points_per_hour),
          client:profiles!bookings_client_id_fkey(full_name, avatar_url),
          provider:profiles!bookings_provider_id_fkey(full_name, avatar_url)
        `)
        .eq("id", id)
        .single()

      if (error) throw error
      setBooking(data)
    } catch (error) {
      console.error("Error fetching booking:", error)
      Alert.alert("Error", "Failed to load booking details")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptBooking = async () => {
    if (!booking) return

    setActionLoading(true)
    try {
      // Create escrow hold
      await EscrowService.createEscrowHold(booking.id, booking.client_id, booking.provider_id, booking.total_points)

      Alert.alert("Success", "Booking confirmed! Payment is held in escrow.")
      fetchBooking() // Refresh booking data
    } catch (error) {
      console.error("Error accepting booking:", error)
      Alert.alert("Error", "Failed to confirm booking. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteService = async () => {
    if (!booking) return

    Alert.alert("Complete Service", "Mark this service as completed? Payment will be released to the provider.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          setActionLoading(true)
          try {
            await EscrowService.releaseEscrow(booking.id)
            Alert.alert("Success", "Service completed! Payment has been released.")
            fetchBooking()
          } catch (error) {
            console.error("Error completing service:", error)
            Alert.alert("Error", "Failed to complete service. Please try again.")
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? If payment was made, it will be refunded.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true)
            try {
              if (booking.payment_status === "held_in_escrow") {
                await EscrowService.refundEscrow(booking.id)
              } else {
                // Just update status if no payment was made
                await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id)
              }

              Alert.alert("Success", "Booking cancelled successfully.")
              router.back()
            } catch (error) {
              console.error("Error cancelling booking:", error)
              Alert.alert("Error", "Failed to cancel booking. Please try again.")
            } finally {
              setActionLoading(false)
            }
          },
        },
      ],
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#D97706"
      case "confirmed":
        return theme.colors.primary
      case "completed":
        return "#059669"
      case "cancelled":
        return theme.colors.error
      default:
        return "#64748B"
    }
  }

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "pending":
        return "Payment Pending"
      case "held_in_escrow":
        return "Payment Secured"
      case "paid":
        return "Payment Completed"
      case "refunded":
        return "Payment Refunded"
      default:
        return "Unknown Status"
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.colors.text }}>Loading booking...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.colors.text }}>Booking not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isProvider = user?.id === booking.provider_id
  const isClient = user?.id === booking.client_id

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "600", color: theme.colors.text }}>Booking Details</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Service Info */}
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>
            {booking.listing.title}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 }}>{booking.message}</Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Date & Time</Text>
            <Text style={{ color: theme.colors.text, fontWeight: "500" }}>
              {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Duration</Text>
            <Text style={{ color: theme.colors.text, fontWeight: "500" }}>{booking.duration_hours} hour(s)</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Total Cost</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: "600", fontSize: 16 }}>
              {booking.total_points} pts
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textSecondary }}>Booking Status</Text>
            <Text style={{ color: getStatusColor(booking.status), fontWeight: "600", textTransform: "capitalize" }}>
              {booking.status}
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: theme.colors.textSecondary }}>Payment Status</Text>
            <Text style={{ color: theme.colors.text, fontWeight: "500" }}>
              {getPaymentStatusText(booking.payment_status)}
            </Text>
          </View>
        </View>

        {/* Participants */}
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 12 }}>
            Participants
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Client</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "500" }}>{booking.client.full_name}</Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Provider</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "500" }}>{booking.provider.full_name}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {booking.status === "pending" && isProvider && (
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, marginBottom: 12 }}
            onPress={handleAcceptBooking}
            disabled={actionLoading}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
              {actionLoading ? "Processing..." : "Accept Booking"}
            </Text>
          </TouchableOpacity>
        )}

        {booking.status === "confirmed" && (isClient || isProvider) && (
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.success, padding: 16, borderRadius: 12, marginBottom: 12 }}
            onPress={handleCompleteService}
            disabled={actionLoading}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
              {actionLoading ? "Processing..." : "Mark as Completed"}
            </Text>
          </TouchableOpacity>
        )}

        {(booking.status === "pending" || booking.status === "confirmed") && (
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.error, padding: 16, borderRadius: 12 }}
            onPress={handleCancelBooking}
            disabled={actionLoading}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
              {actionLoading ? "Processing..." : "Cancel Booking"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
