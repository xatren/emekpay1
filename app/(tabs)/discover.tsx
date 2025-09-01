"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, FlatList, Animated, Dimensions, TouchableOpacity } from "react-native"
import { Surface, Searchbar, Chip, Card, Avatar, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { useThemeColors } from "../../lib/theme-provider"
import { typography } from "../../lib/theme"
import type { Listing } from "../../lib/types"

const { width, height } = Dimensions.get('window')

const categories = [
  "Tümü",
  "Teknoloji",
  "Tasarım",
  "Yazı",
  "Pazarlama",
  "Eğitim",
  "Sağlık",
  "Fitness",
  "Müzik",
  "Fotoğrafçılık",
  "Yemek",
  "Temizlik",
  "Tamir",
  "Ulaşım",
]

export default function DiscoverScreen() {
  const { user } = useAuthStore()
  const colors = useThemeColors()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tümü")
  const [selectedType, setSelectedType] = useState<"all" | "offer" | "request">("all")

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

      if (selectedCategory !== "Tümü") {
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
                                      {listing.type === "offer" ? "Sunuyor" : "İstiyor"}
            </Chip>
            <Text style={styles.listingRate}>{listing.hourly_point_rate} pts/hr</Text>
          </View>
        </View>
        <Text style={styles.listingDescription} numberOfLines={3}>
          {listing.description}
        </Text>
        <View style={styles.listingActions}>
                      <Button mode="contained" style={styles.contactButton} contentStyle={styles.contactButtonContent}>
              İletişim
            </Button>
            <Button mode="outlined" style={styles.viewButton} contentStyle={styles.viewButtonContent}>
              Detayları Gör
            </Button>
        </View>
      </Card.Content>
    </Card>
  )

  const styles = createStyles(colors)

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>EP</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>Hizmetleri Keşfedin</Text>
            <Text style={styles.headerSubtitle}>Bölgenizde yetenekli profesyonelleri bulun</Text>
          </View>

          {/* Search */}
          <Surface style={styles.searchContainer} elevation={4}>
            <Searchbar
              placeholder="Hizmet ara..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
            />
          </Surface>

          {/* Filters */}
          <Surface style={styles.filtersContainer} elevation={4}>
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
                {type === "all" ? "Tüm Türler" : type === "offer" ? "Teklifler" : "İstekler"}
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
          </Surface>

          {/* Results */}
          <Surface style={styles.resultsContainer} elevation={4}>
        {listings && listings.length > 0 ? (
          <FlatList
            data={listings}
            renderItem={renderListingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
                      ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={48} color={colors.onSurfaceVariant} />
                  <Text style={styles.emptyStateText}>Hizmet bulunamadı</Text>
                  <Text style={styles.emptyStateSubtext}>Arama veya filtrelerinizi ayarlamayı deneyin</Text>
                </View>
              )}
          </Surface>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingBottom: 24,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface,
    letterSpacing: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.surface,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
  },
  searchContainer: {
    margin: 24,
    marginTop: 8,
    padding: 20,
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
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
  },
  searchInput: {
    ...typography.body,
  },
  filtersContainer: {
    margin: 24,
    marginTop: 8,
    padding: 20,
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
  filterRow: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.onSurface,
  },
  filterChipTextSelected: {
    color: colors.surface,
  },
  resultsContainer: {
    flex: 1,
    margin: 24,
    marginTop: 8,
    padding: 20,
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
  listContainer: {
    paddingBottom: 24,
  },
  listingCard: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
    marginBottom: 16,
    borderRadius: 16,
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
    color: colors.onSurface,
  },
  listingUser: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  listingLocation: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  listingMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  typeChip: {
    height: 28,
  },
  offerChip: {
    backgroundColor: colors.tertiary + "20",
    borderColor: colors.tertiary,
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
    color: colors.onSurfaceVariant,
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
    borderRadius: 12,
  },
  contactButtonContent: {
    paddingVertical: 4,
  },
  viewButton: {
    flex: 1,
    borderRadius: 12,
  },
  viewButtonContent: {
    paddingVertical: 4,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    marginTop: 32,
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
})
