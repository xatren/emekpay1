"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Surface, Card, Avatar, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import PrimaryButton from "../../components/PrimaryButton"

interface Transaction {
  id: string
  type: "credit" | "debit" | "escrow_hold" | "escrow_release"
  amount: number
  description: string
  created_at: string
  booking_id?: string
}

export default function WalletScreen() {
  const { user } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch user wallet
  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()
      return data
    },
    enabled: !!user,
  })

  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!user,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const getTransactionDescription = (tx: any) => {
    if (tx.booking_id) {
      if (tx.type === "hold") return "Payment held for booking"
      if (tx.type === "release") return "Payment received for service"
      if (tx.type === "refund") return "Refund for cancelled booking"
    }
    if (tx.from_user_id === user?.id) return "Points sent"
    return "Points received"
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
      case "escrow_release":
        return "arrow-downward"
      case "debit":
      case "escrow_hold":
        return "arrow-upward"
      default:
        return "swap-horiz"
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit":
      case "escrow_release":
        return colors.success
      case "debit":
      case "escrow_hold":
        return colors.error
      default:
        return colors.text
    }
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
          <View style={styles.headerContent}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={styles.headerTitle}>My Wallet</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Balance Card */}
        <Surface style={styles.balanceCard} elevation={3}>
          <View style={styles.balanceHeader}>
            <MaterialIcons name="account-balance-wallet" size={32} color={colors.primary} />
            <Text style={styles.balanceTitle}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {isLoading ? "..." : (wallet?.balance_points || 0)} Points
          </Text>
          <Text style={styles.balanceSubtext}>
            ≈ ${(wallet?.balance_points || 0) * 0.01} USD
          </Text>
        </Surface>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <PrimaryButton
            mode="contained"
            onPress={() => router.push("/wallet/add-points")}
            icon="add"
            style={styles.actionButton}
          >
            Add Points
          </PrimaryButton>
          <PrimaryButton
            mode="outlined"
            onPress={() => router.push("/wallet/transfer")}
            icon="swap-horiz"
            style={styles.actionButton}
          >
            Transfer
          </PrimaryButton>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {transactions && transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {transactions.map((transaction: any) => (
                <Card key={transaction.id} style={styles.transactionCard} mode="outlined">
                  <Card.Content style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                      <MaterialIcons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type)}
                      />
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>
                          {getTransactionDescription(transaction)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      { color: getTransactionColor(transaction.type) }
                    ]}>
                      {transaction.from_user_id === user?.id ? "-" : "+"}{transaction.points} pts
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <Surface style={styles.emptyState} elevation={1}>
              <MaterialIcons name="receipt" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your transaction history will appear here
              </Text>
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
  balanceCard: {
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  balanceTitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  balanceAmount: {
    ...typography.heading,
    fontSize: 32,
    color: colors.primary,
    marginBottom: 4,
  },
  balanceSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: 16,
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  transactionContent: {
    padding: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionAmount: {
    ...typography.body,
    fontWeight: "600",
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
})
