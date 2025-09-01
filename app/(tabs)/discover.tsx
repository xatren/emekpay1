"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native"
import { Surface, Searchbar, Chip, Card, Avatar, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import type { Listing } from "../../lib/types"

const categories = [
  "All",
  "Technology",
  "Design",
  "Writing",
  "Marketing",
  "Education",
  "Health",
  "Fitness",
  "Music",
  "Photography",
  "Cooking",
  "Cleaning",
  "Repair",
  "Transportation",
]

export default function DiscoverScreen() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedType, setSelectedType] = useState<"all" | "offer" | "request">("all")

  // Fetch listings
  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings", selectedCategory, selectedType, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          *,
          user:users(*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory)
      }

      if (selectedType !== "all") {
        query = query.eq("type", selectedType)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      const { data } = await query
      return data as (Listing & { user: any })[]
    },
  })

  const renderListingCard = ({ item: listing }: { item: Listing & { user: any } }) => (
    <Card key={listing.id} style={styles.listingCard} mode="outlined">
      <Card.Content style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Avatar.Text
            size={48}
            label={listing.user?.name?.charAt(0) || "U"}
            style={{ backgroundColor: colors.primary }}
          />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <Text style={styles.listingUser}>{listing.user?.name}</Text>
            <Text style={styles.listingLocation}>
              {listing.district}, {listing.city}
            </Text>
          </View>
          <View style={styles.listingMeta}>
            <Chip
              mode="outlined"
              style={[styles.typeChip, listing.type === "offer" ? styles.offerChip : styles.requestChip]}
              textStyle={styles.typeChipText}
            >
              {listing.type === "offer" ? "Offering" : "Requesting"}
            </Chip>
            <Text style={styles.listingRate}>{listing.hourly_point_rate} pts/hr</Text>
          </View>
        </View>
        <Text style={styles.listingDescription} numberOfLines={3}>
          {listing.description}
        </Text>
        <View style={styles.listingActions}>
          <Button mode="contained" style={styles.contactButton} contentStyle={styles.contactButtonContent}>
            Contact
          </Button>
          <Button mode="outlined" style={styles.viewButton} contentStyle={styles.viewButtonContent}>
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Services</Text>
        <Text style={styles.headerSubtitle}>Find skilled professionals in your area</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search services..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <View style={styles.filterChips}>
            {["all", "offer", "request"].map((type) => (
              <Chip
                key={type}
                selected={selectedType === type}
                onPress={() => setSelectedType(type as any)}
                style={[styles.filterChip, selectedType === type && styles.filterChipSelected]}
                textStyle={[styles.filterChipText, selectedType === type && styles.filterChipTextSelected]}
              >
                {type === "all" ? "All Types" : type === "offer" ? "Offerings" : "Requests"}
              </Chip>
            ))}
          </View>
        </ScrollView>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <View style={styles.filterChips}>
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.filterChip, selectedCategory === category && styles.filterChipSelected]}
                textStyle={[styles.filterChipText, selectedCategory === category && styles.filterChipTextSelected]}
              >
                {category}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {listings && listings.length > 0 ? (
          <FlatList
            data={listings}
            renderItem={renderListingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No services found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </Surface>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: colors.surface,
    elevation: 2,
  },
  searchInput: {
    ...typography.body,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
  },
  filterChipTextSelected: {
    color: colors.surface,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContainer: {
    paddingBottom: 24,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 16,
  },
  listingContent: {
    padding: 20,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  listingInfo: {
    flex: 1,
    gap: 4,
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
  listingLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listingMeta: {
    alignItems: "flex-end",
    gap: 8,
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
  listingRate: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  listingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  listingActions: {
    flexDirection: "row",
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  contactButtonContent: {
    paddingVertical: 4,
  },
  viewButton: {
    flex: 1,
  },
  viewButtonContent: {
    paddingVertical: 4,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 12,
    marginTop: 32,
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
