"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native"
import { Surface, Switch, List, Modal, Portal, RadioButton, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuthStore } from "../hooks/useAuthStore"
import { useTheme, useThemeColors } from "../lib/theme-provider"
import { typography } from "../lib/theme"
import * as Notifications from 'expo-notifications'

function ThemePickerModal({ visible, onDismiss, tempThemeMode, onThemeSelect, onSave, colors }: any) {
  const themeColors = colors
  const modalStyles = createStyles(colors)
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={modalStyles.modalContainer}
      >
        <Surface style={[modalStyles.modalContent, { backgroundColor: themeColors.surface }]}>
          <Text style={[modalStyles.modalTitle, { color: themeColors.onSurface }]}>Choose Theme</Text>

          <RadioButton.Group onValueChange={onThemeSelect} value={tempThemeMode}>
            <List.Item
              title="Light Theme"
              description="Always use light theme"
                                left={() => (
                    <RadioButton
                      value="light"
                      color={themeColors.primary}
                    />
                  )}
                  onPress={() => onThemeSelect('light')}
                />

                <List.Item
                  title="Dark Theme"
                  description="Always use dark theme"
                  left={() => (
                    <RadioButton
                      value="dark"
                      color={themeColors.primary}
                    />
                  )}
                  onPress={() => onThemeSelect('dark')}
                />

                <List.Item
                  title="System Theme"
                  description="Follow device theme"
                  left={() => (
                    <RadioButton
                      value="system"
                      color={themeColors.primary}
                    />
                  )}
              onPress={() => onThemeSelect('system')}
            />
          </RadioButton.Group>

          <View style={modalStyles.modalActions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={modalStyles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={onSave}
              style={modalStyles.modalButton}
            >
              Apply
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { isDarkMode, toggleTheme, themeMode, setThemeMode } = useTheme()
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const [notifications, setNotifications] = React.useState(true)
  const [locationServices, setLocationServices] = React.useState(true)
  const [themeModalVisible, setThemeModalVisible] = React.useState(false)
  const [tempThemeMode, setTempThemeMode] = React.useState(themeMode)
  const [notificationPermissions, setNotificationPermissions] = React.useState<'granted' | 'denied' | 'undetermined'>('undetermined')

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setTempThemeMode(mode)
  }

  const handleThemeSave = () => {
    setThemeMode(tempThemeMode)
    setThemeModalVisible(false)
  }

  // Check notification permissions on mount
  React.useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync()
      setNotificationPermissions(status as 'granted' | 'denied' | 'undetermined')
    }
    checkPermissions()
  }, [])

  const handleRequestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setNotificationPermissions(status as 'granted' | 'denied' | 'undetermined')
  }

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
            <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} onPress={() => router.back()} />
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
            title="Push Notifications"
            description={
              notificationPermissions === 'granted' ? 'Notifications enabled' :
              notificationPermissions === 'denied' ? 'Notifications disabled' :
              'Tap to enable notifications'
            }
            left={props => <List.Icon {...props} icon={
              notificationPermissions === 'granted' ? "notifications-active" : "notifications-off"
            } />}
            right={() => (
              <Switch
                value={notificationPermissions === 'granted'}
                onValueChange={notificationPermissions === 'denied' ? handleRequestNotificationPermission : undefined}
                color={colors.primary}
                disabled={notificationPermissions === 'denied'}
              />
            )}
            onPress={notificationPermissions === 'undetermined' || notificationPermissions === 'denied' ?
              handleRequestNotificationPermission : undefined}
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
            title="Theme"
            description={
              themeMode === 'system' ? 'Follow system' :
              themeMode === 'dark' ? 'Dark theme' : 'Light theme'
            }
            left={props => <List.Icon {...props} icon={isDarkMode ? "brightness-3" : "brightness-6"} />}
            right={() => (
              <Switch
                value={themeMode === 'dark'}
                onValueChange={toggleTheme}
                color={colors.primary}
              />
            )}
            onPress={() => {
              setTempThemeMode(themeMode)
              setThemeModalVisible(true)
            }}
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

        {/* Theme Picker Modal */}
        <ThemePickerModal
          visible={themeModalVisible}
          onDismiss={() => setThemeModalVisible(false)}
          tempThemeMode={tempThemeMode}
          onThemeSelect={handleThemeSelect}
          onSave={handleThemeSave}
          colors={colors}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (colors: any) => StyleSheet.create({
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
    color: colors.onBackground,
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
    color: colors.onSurface,
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
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalContent: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 20,
  },
  modalTitle: {
    ...typography.subheading,
    color: colors.onSurface,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
})
