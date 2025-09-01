"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native"
import { TextInput, Button, Surface, Chip, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"

const requestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  hourly_point_rate: z.number().min(1, "Rate must be at least 1 point per hour"),
})

type RequestForm = z.infer<typeof requestSchema>

const categories = [
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
  "Childcare",
  "Elderly Care",
]

export default function CreateRequestScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      hourly_point_rate: 10,
    },
  })

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestForm & { category: string }) => {
      if (!user) throw new Error("No user")

      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        type: "request",
        title: data.title,
        category: data.category,
        description: data.description,
        hourly_point_rate: data.hourly_point_rate,
        city: user.city,
        district: user.district,
        is_active: true,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["nearby-listings"] })
      Alert.alert("Success", "Your service request has been created!", [{ text: "OK", onPress: () => router.back() }])
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to create service request")
      console.error("Create request error:", error)
    },
  })

  const onSubmit = async (data: RequestForm) => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category")
      return
    }

    setLoading(true)
    try {
      await createRequestMutation.mutateAsync({
        ...data,
        category: selectedCategory,
      })
    } catch (error) {
      console.error("Submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
              <Text style={styles.headerTitle}>Request a Service</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Form */}
            <Surface style={styles.formContainer} elevation={2}>
              <Text style={styles.sectionTitle}>Service Request</Text>

              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="What do you need help with?"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g., Build a website, Design a logo, Math tutoring"
                    error={!!errors.title}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Description"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={6}
                    placeholder="Describe what you need, your requirements, timeline, and any specific details..."
                    error={!!errors.description}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

              <Controller
                control={control}
                name="hourly_point_rate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Budget (Points per hour)"
                    value={value.toString()}
                    onChangeText={(text) => onChange(Number.parseInt(text) || 0)}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    placeholder="10"
                    error={!!errors.hourly_point_rate}
                    style={styles.input}
                    mode="outlined"
                    right={<TextInput.Affix text="points/hour" />}
                  />
                )}
              />
              {errors.hourly_point_rate && <Text style={styles.errorText}>{errors.hourly_point_rate.message}</Text>}
            </Surface>

            {/* Category Selection */}
            <Surface style={styles.categoryContainer} elevation={2}>
              <Text style={styles.sectionTitle}>Category</Text>
              <Text style={styles.sectionSubtitle}>Choose the category that best describes what you need</Text>

              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    selected={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.categoryChip, selectedCategory === category && styles.categoryChipSelected]}
                    textStyle={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
            </Surface>

            {/* Preview */}
            <Surface style={styles.previewContainer} elevation={2}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>{watch("title") || "Service Request Title"}</Text>
                    <Text style={styles.previewUser}>{user?.name}</Text>
                    <Text style={styles.previewLocation}>
                      {user?.district && user?.city ? `${user.district}, ${user.city}` : "Location"}
                    </Text>
                  </View>
                  <View style={styles.previewMeta}>
                    <Chip mode="outlined" style={styles.previewTypeChip} textStyle={styles.previewTypeChipText}>
                      Requesting
                    </Chip>
                    <Text style={styles.previewRate}>{watch("hourly_point_rate") || 0} pts/hr</Text>
                  </View>
                </View>
                <Text style={styles.previewDescription} numberOfLines={3}>
                  {watch("description") || "Service request description will appear here..."}
                </Text>
                {selectedCategory && (
                  <Chip mode="outlined" style={styles.previewCategoryChip}>
                    {selectedCategory}
                  </Chip>
                )}
              </View>
            </Surface>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
              icon="plus"
            >
              Create Service Request
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.subheading,
    color: colors.text,
  },
  formContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 16,
  },
  categoryContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.secondary,
  },
  categoryChipText: {
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.surface,
  },
  previewContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 32,
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  previewUser: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  previewTypeChip: {
    height: 28,
    backgroundColor: colors.secondary + "20",
    borderColor: colors.secondary,
  },
  previewTypeChipText: {
    fontSize: 12,
    color: colors.secondary,
  },
  previewRate: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },
  previewDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  previewCategoryChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary + "20",
    borderColor: colors.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginBottom: 32,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
})
