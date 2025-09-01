"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { Surface, Switch, List } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuthStore } from "../hooks/useAuthStore"
import { colors, typography } from "../lib/theme"

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const [notifications, setNotifications] = React.useState(true)
  const [locationServices, setLocationServices] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", onPress: () => signOut() }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Profile Section */}
        <Surface style={styles.section} elevation={2}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <List.Item
            title={user?.name || "User"}
            description={user?.email || ""}
            left={props => <List.Icon {...props} icon="person" />}
            onPress={() => router.push("/(tabs)/profile")}
          />
        </Surface>

        {/* Preferences */}
        <Surface style={styles.section} elevation={2}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <List.Item
            title="Notifications"
            description="Receive push notifications"
            left={props => <List.Icon {...props} icon="notifications" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={colors.primary}
              />
            )}
          />

          <List.Item
            title="Location Services"
            description="Use location for nearby services"
            left={props => <List.Icon {...props} icon="location-on" />}
            right={() => (
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                color={colors.primary}
              />
            )}
          />

          <List.Item
            title="Dark Mode"
            description="Switch to dark theme"
            left={props => <List.Icon {...props} icon="brightness-6" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={colors.primary}
              />
            )}
          />
        </Surface>

        {/* Account */}
        <Surface style={styles.section} elevation={2}>
          <Text style={styles.sectionTitle}>Account</Text>

          <List.Item
            title="Change Password"
            description="Update your password"
            left={props => <List.Icon {...props} icon="lock" />}
            onPress={() => router.push("/settings/change-password")}
          />

          <List.Item
            title="Privacy Settings"
            description="Manage your privacy preferences"
            left={props => <List.Icon {...props} icon="privacy-tip" />}
            onPress={() => router.push("/settings/privacy")}
          />

          <List.Item
            title="Payment Methods"
            description="Manage payment options"
            left={props => <List.Icon {...props} icon="payment" />}
            onPress={() => router.push("/settings/payment")}
          />
        </Surface>

        {/* Support */}
        <Surface style={styles.section} elevation={2}>
          <Text style={styles.sectionTitle}>Support</Text>

          <List.Item
            title="Help & FAQ"
            description="Find answers to common questions"
            left={props => <List.Icon {...props} icon="help" />}
            onPress={() => router.push("/help")}
          />

          <List.Item
            title="Contact Us"
            description="Get in touch with our support team"
            left={props => <List.Icon {...props} icon="contact-mail" />}
            onPress={() => router.push("/contact")}
          />

          <List.Item
            title="About EmekPay"
            description="Learn more about our platform"
            left={props => <List.Icon {...props} icon="info" />}
            onPress={() => router.push("/about")}
          />
        </Surface>

        {/* App Info */}
        <Surface style={styles.section} elevation={2}>
          <Text style={styles.sectionTitle}>App Information</Text>

          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="smartphone" />}
          />

          <List.Item
            title="Terms of Service"
            description="Read our terms and conditions"
            left={props => <List.Icon {...props} icon="description" />}
            onPress={() => router.push("/terms")}
          />

          <List.Item
            title="Privacy Policy"
            description="Learn how we protect your data"
            left={props => <List.Icon {...props} icon="policy" />}
            onPress={() => router.push("/privacy")}
          />
        </Surface>

        {/* Sign Out */}
        <Surface style={styles.signOutSection} elevation={2}>
          <List.Item
            title="Sign Out"
            description="Sign out of your account"
            titleStyle={{ color: colors.error }}
            left={props => <List.Icon {...props} icon="logout" color={colors.error} />}
            onPress={handleSignOut}
          />
        </Surface>
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
  section: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    fontWeight: "600",
    padding: 20,
    paddingBottom: 8,
  },
  signOutSection: {
    margin: 24,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
})
