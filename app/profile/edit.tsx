"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native"
import { TextInput, Button, Surface, Avatar, Card, Chip, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import * as ImagePicker from "expo-image-picker"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"
import type { Skill } from "../../lib/types"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  city: z.string().min(2, "Please enter your city"),
  district: z.string().min(2, "Please enter your district"),
  bio: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const skillCategories = [
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

const skillLevels = ["beginner", "intermediate", "expert"] as const

export default function EditProfileScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState({ title: "", category: "", level: "intermediate" as const })
  const [showAddSkill, setShowAddSkill] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      city: "",
      district: "",
      bio: "",
    },
  })

  // Fetch user skills
  const { data: skills, refetch: refetchSkills } = useQuery({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      return data as Skill[]
    },
    enabled: !!user,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm & { avatar_url?: string }) => {
      if (!user) throw new Error("No user")

      const { error } = await supabase
        .from("users")
        .update({
          name: data.name,
          email: data.email,
          city: data.city,
          district: data.district,
          bio: data.bio,
          avatar_url: data.avatar_url,
        })
        .eq("id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      Alert.alert("Success", "Profile updated successfully")
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update profile")
      console.error("Profile update error:", error)
    },
  })

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skill: { title: string; category: string; level: string }) => {
      if (!user) throw new Error("No user")

      const { error } = await supabase.from("skills").insert({
        user_id: user.id,
        title: skill.title,
        category: skill.category,
        description: `Skilled in ${skill.title}`,
        level: skill.level,
      })

      if (error) throw error
    },
    onSuccess: () => {
      refetchSkills()
      setNewSkill({ title: "", category: "", level: "intermediate" })
      setShowAddSkill(false)
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to add skill")
      console.error("Add skill error:", error)
    },
  })

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", skillId)
      if (error) throw error
    },
    onSuccess: () => {
      refetchSkills()
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to delete skill")
      console.error("Delete skill error:", error)
    },
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setValue("name", user.name || "")
      setValue("email", user.email || "")
      setValue("city", user.city || "")
      setValue("district", user.district || "")
      setValue("bio", user.bio || "")
      setAvatarUri(user.avatar_url || null)
    }
  }, [user, setValue])

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload an avatar")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileExt = uri.split(".").pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("avatars").upload(fileName, blob)

      if (error) throw error

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(data.path)
      return publicUrl.publicUrl
    } catch (error) {
      console.error("Avatar upload error:", error)
      return null
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      let avatarUrl = user?.avatar_url

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== user?.avatar_url) {
        const uploadedUrl = await uploadAvatar(avatarUri)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      await updateProfileMutation.mutateAsync({
        ...data,
        avatar_url: avatarUrl,
      })

      router.back()
    } catch (error) {
      console.error("Submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (!newSkill.title.trim() || !newSkill.category) {
      Alert.alert("Error", "Please fill in skill title and category")
      return
    }
    addSkillMutation.mutate(newSkill)
  }

  const handleDeleteSkill = (skillId: string) => {
    Alert.alert("Delete Skill", "Are you sure you want to delete this skill?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSkillMutation.mutate(skillId) },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Avatar Section */}
            <Surface style={styles.avatarSection} elevation={2}>
              <Avatar.Image size={100} source={avatarUri ? { uri: avatarUri } : undefined} style={styles.avatar} />
              {!avatarUri && (
                <Avatar.Text
                  size={100}
                  label={user?.name?.charAt(0) || "U"}
                  style={[styles.avatar, { backgroundColor: colors.primary }]}
                />
              )}
              <Button mode="outlined" onPress={pickImage} style={styles.changeAvatarButton}>
                Change Photo
              </Button>
            </Surface>

            {/* Profile Form */}
            <Surface style={styles.formContainer} elevation={2}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={!!errors.email}
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

              <View style={styles.locationRow}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="City"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.city}
                      style={[styles.input, styles.locationInput]}
                      mode="outlined"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="district"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      label="District"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.district}
                      style={[styles.input, styles.locationInput]}
                      mode="outlined"
                    />
                  )}
                />
              </View>
              {(errors.city || errors.district) && (
                <Text style={styles.errorText}>{errors.city?.message || errors.district?.message}</Text>
              )}

              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Bio"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    placeholder="Tell others about yourself..."
                    style={styles.input}
                    mode="outlined"
                  />
                )}
              />
            </Surface>

            {/* Skills Section */}
            <Surface style={styles.skillsContainer} elevation={2}>
              <View style={styles.skillsHeader}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <Button mode="text" onPress={() => setShowAddSkill(!showAddSkill)} icon="plus">
                  Add Skill
                </Button>
              </View>

              {/* Add New Skill */}
              {showAddSkill && (
                <Card style={styles.addSkillCard} mode="outlined">
                  <Card.Content style={styles.addSkillContent}>
                    <TextInput
                      label="Skill Title"
                      value={newSkill.title}
                      onChangeText={(text) => setNewSkill({ ...newSkill, title: text })}
                      style={styles.skillInput}
                      mode="outlined"
                    />

                    <View style={styles.skillSelectors}>
                      <View style={styles.categorySelector}>
                        <Text style={styles.selectorLabel}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.categoryChips}>
                            {skillCategories.map((category) => (
                              <Chip
                                key={category}
                                selected={newSkill.category === category}
                                onPress={() => setNewSkill({ ...newSkill, category })}
                                style={[
                                  styles.categoryChip,
                                  newSkill.category === category && styles.categoryChipSelected,
                                ]}
                                textStyle={[
                                  styles.categoryChipText,
                                  newSkill.category === category && styles.categoryChipTextSelected,
                                ]}
                              >
                                {category}
                              </Chip>
                            ))}
                          </View>
                        </ScrollView>
                      </View>

                      <View style={styles.levelSelector}>
                        <Text style={styles.selectorLabel}>Level</Text>
                        <View style={styles.levelChips}>
                          {skillLevels.map((level) => (
                            <Chip
                              key={level}
                              selected={newSkill.level === level}
                              onPress={() => setNewSkill({ ...newSkill, level })}
                              style={[styles.levelChip, newSkill.level === level && styles.levelChipSelected]}
                              textStyle={[
                                styles.levelChipText,
                                newSkill.level === level && styles.levelChipTextSelected,
                              ]}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View style={styles.addSkillActions}>
                      <Button mode="outlined" onPress={() => setShowAddSkill(false)} style={styles.cancelButton}>
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleAddSkill}
                        loading={addSkillMutation.isPending}
                        style={styles.addButton}
                      >
                        Add Skill
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Existing Skills */}
              <View style={styles.skillsList}>
                {skills && skills.length > 0 ? (
                  skills.map((skill) => (
                    <Card key={skill.id} style={styles.skillCard} mode="outlined">
                      <Card.Content style={styles.skillCardContent}>
                        <View style={styles.skillInfo}>
                          <Text style={styles.skillTitle}>{skill.title}</Text>
                          <Text style={styles.skillCategory}>{skill.category}</Text>
                          <Chip mode="outlined" style={styles.skillLevelChip} textStyle={styles.skillLevelChipText}>
                            {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                          </Chip>
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.error}
                          onPress={() => handleDeleteSkill(skill.id)}
                        />
                      </Card.Content>
                    </Card>
                  ))
                ) : (
                  <Text style={styles.noSkillsText}>No skills added yet. Add your first skill above!</Text>
                )}
              </View>
            </Surface>

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
            >
              Save Changes
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
  avatarSection: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    // Avatar styles handled by Paper component
  },
  changeAvatarButton: {
    borderColor: colors.primary,
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: 16,
  },
  skillsContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 32,
  },
  skillsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addSkillCard: {
    marginBottom: 20,
    borderColor: colors.border,
  },
  addSkillContent: {
    padding: 20,
  },
  skillInput: {
    marginBottom: 16,
  },
  skillSelectors: {
    gap: 16,
    marginBottom: 20,
  },
  categorySelector: {
    gap: 8,
  },
  levelSelector: {
    gap: 8,
  },
  selectorLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  categoryChips: {
    flexDirection: "row",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.surface,
  },
  levelChips: {
    flexDirection: "row",
    gap: 8,
  },
  levelChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  levelChipSelected: {
    backgroundColor: colors.secondary,
  },
  levelChipText: {
    color: colors.text,
  },
  levelChipTextSelected: {
    color: colors.surface,
  },
  addSkillActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.textSecondary,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  skillsList: {
    gap: 12,
  },
  skillCard: {
    borderColor: colors.border,
  },
  skillCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  skillInfo: {
    flex: 1,
    gap: 4,
  },
  skillTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  skillCategory: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  skillLevelChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  skillLevelChipText: {
    color: colors.primary,
    fontSize: 12,
  },
  noSkillsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginBottom: 32,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
})
