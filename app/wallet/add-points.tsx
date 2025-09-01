"use client"

import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { theme, colors } from "../../lib/theme"

const POINT_PACKAGES = [
  { points: 100, price: "$5.00", popular: false },
  { points: 500, price: "$20.00", popular: true },
  { points: 1000, price: "$35.00", popular: false },
  { points: 2500, price: "$80.00", popular: false },
]

export default function AddPointsScreen() {
  const { user } = useAuthStore()
  const [selectedPackage, setSelectedPackage] = useState(POINT_PACKAGES[1])
  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddPoints = async () => {
    if (!user) return

    const pointsToAdd = customAmount ? Number.parseInt(customAmount) : selectedPackage.points

    if (!pointsToAdd || pointsToAdd <= 0) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      // In a real app, this would integrate with a payment processor
      // For demo purposes, we'll just add the points directly
      // First get current balance
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance_points")
        .eq("user_id", user.id)
        .single()

      const currentBalance = walletData?.balance_points || 0
      const newBalance = currentBalance + pointsToAdd

      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance_points: newBalance })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      // Record transaction
      await supabase.from("transactions").insert({
        to_user_id: user.id,
        points: pointsToAdd,
        type: "adjust",
        status: "completed",
      })

      Alert.alert("Success", `${pointsToAdd} points added to your wallet!`, [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (error) {
      console.error("Error adding points:", error)
      Alert.alert("Error", "Failed to add points. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>Add Points</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 16 }}>
          Choose a Package
        </Text>

        {POINT_PACKAGES.map((pkg, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              backgroundColor: selectedPackage === pkg ? theme.colors.primary + "20" : theme.colors.surface,
              borderRadius: 12,
              marginBottom: 12,
              borderWidth: selectedPackage === pkg ? 2 : 0,
              borderColor: selectedPackage === pkg ? theme.colors.primary : "transparent",
            }}
            onPress={() => {
              setSelectedPackage(pkg)
              setCustomAmount("")
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                  {pkg.points.toLocaleString()} points
                </Text>
                {pkg.popular && (
                  <View
                    style={{
                      backgroundColor: theme.colors.primary,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>POPULAR</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{pkg.price}</Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedPackage === pkg ? theme.colors.primary : colors.border,
                backgroundColor: selectedPackage === pkg ? theme.colors.primary : "transparent",
              }}
            />
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
            Or Enter Custom Amount
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.text,
              borderWidth: customAmount ? 2 : 0,
              borderColor: customAmount ? theme.colors.primary : "transparent",
            }}
            placeholder="Enter points amount"
            placeholderTextColor={colors.textSecondary}
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text)
              setSelectedPackage(null as any)
            }}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: 16,
            borderRadius: 12,
            marginTop: 32,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleAddPoints}
          disabled={loading}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
            {loading ? "Processing..." : `Add ${customAmount || selectedPackage?.points || 0} Points`}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 16, fontSize: 12 }}>
          * This is a demo. In a real app, this would integrate with a payment processor.
        </Text>
      </View>
    </SafeAreaView>
  )
}
