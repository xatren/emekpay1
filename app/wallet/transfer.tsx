"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { Avatar } from "../../components/Avatar"
import { theme } from "../../lib/theme"

interface Contact {
  id: string
  full_name: string
  avatar_url: string
  phone: string
}

export default function TransferScreen() {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBalance()
    fetchContacts()
  }, [])

  const fetchBalance = async () => {
    try {
      const { data } = await supabase.from("wallets").select("balance_points").eq("user_id", user?.id).single()

      if (data) setBalance(data.balance_points)
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const fetchContacts = async () => {
    try {
      // Get users who have interacted with current user through bookings
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone")
        .neq("id", user?.id)
        .limit(20)

      if (data) setContacts(data)
    } catch (error) {
      console.error("Error fetching contacts:", error)
    }
  }

  const handleTransfer = async () => {
    if (!selectedContact || !amount) {
      Alert.alert("Error", "Please select a contact and enter an amount")
      return
    }

    const transferAmount = Number.parseInt(amount)
    if (transferAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    if (transferAmount > balance) {
      Alert.alert("Error", "Insufficient balance")
      return
    }

    Alert.alert("Confirm Transfer", `Send ${transferAmount} points to ${selectedContact.full_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          setLoading(true)
          try {
            // Deduct from sender
            const { error: deductError } = await supabase
              .from("wallets")
              .update({
                balance_points: supabase.raw(`balance_points - ${transferAmount}`),
              })
              .eq("user_id", user?.id)

            if (deductError) throw deductError

            // Add to receiver
            const { error: addError } = await supabase
              .from("wallets")
              .update({
                balance_points: supabase.raw(`balance_points + ${transferAmount}`),
              })
              .eq("user_id", selectedContact.id)

            if (addError) throw addError

            // Record transaction
            await supabase.from("transactions").insert({
              from_user_id: user?.id,
              to_user_id: selectedContact.id,
              points: transferAmount,
              type: "adjust",
              status: "completed",
            })

            Alert.alert("Success", "Points transferred successfully!", [{ text: "OK", onPress: () => router.back() }])
          } catch (error) {
            console.error("Error transferring points:", error)
            Alert.alert("Error", "Transfer failed. Please try again.")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.phone?.includes(searchQuery),
  )

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
        <Text style={{ fontSize: 20, fontWeight: "600", color: theme.colors.text }}>Transfer Points</Text>
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Balance Display */}
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Available Balance</Text>
          <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: "bold" }}>
            {balance.toLocaleString()} pts
          </Text>
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>
            Amount to Send
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 18,
              color: theme.colors.text,
              textAlign: "center",
            }}
            placeholder="0"
            placeholderTextColor={theme.colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Contact Search */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 8 }}>Send To</Text>
          <TextInput
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: theme.colors.text,
            }}
            placeholder="Search contacts..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Selected Contact */}
        {selectedContact && (
          <View
            style={{
              backgroundColor: theme.colors.primary + "20",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: theme.colors.primary,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Avatar size={40} uri={selectedContact.avatar_url} name={selectedContact.full_name} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
                  {selectedContact.full_name}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>{selectedContact.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedContact(null)}>
                <Ionicons name="close-circle" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contacts List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                marginBottom: 8,
              }}
              onPress={() => setSelectedContact(item)}
            >
              <Avatar size={40} uri={item.avatar_url} name={item.full_name} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: theme.colors.text }}>{item.full_name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>{item.phone}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
                {searchQuery ? "No contacts found" : "No contacts available"}
              </Text>
            </View>
          }
        />

        {/* Transfer Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: 16,
            borderRadius: 12,
            marginTop: 20,
            opacity: !selectedContact || !amount || loading ? 0.5 : 1,
          }}
          onPress={handleTransfer}
          disabled={!selectedContact || !amount || loading}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
            {loading ? "Processing..." : "Send Points"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
