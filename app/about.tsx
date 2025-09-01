"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Surface, Card, Button } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { colors, typography } from "../lib/theme"

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={styles.headerTitle}>About EmekPay</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Logo and Tagline */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EP</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Connecting Skills with Opportunities</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Mission */}
        <Surface style={styles.missionCard} elevation={2}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            EmekPay is a revolutionary platform that connects skilled individuals with people who need their services.
            We believe everyone has valuable skills to offer, and we're here to make it easy to monetize those skills
            while helping others find the help they need.
          </Text>
        </Surface>

        {/* Features */}
        <Surface style={styles.featuresCard} elevation={2}>
          <Text style={styles.sectionTitle}>What We Offer</Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="work" size={24} color={colors.primary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Service Marketplace</Text>
                <Text style={styles.featureDescription}>
                  Browse and book services from skilled professionals in your area
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="account-balance-wallet" size={24} color={colors.success} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Point-Based System</Text>
                <Text style={styles.featureDescription}>
                  Earn and spend points for services, making transactions simple and secure
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="verified-user" size={24} color={colors.secondary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Verified Professionals</Text>
                <Text style={styles.featureDescription}>
                  All service providers are verified to ensure quality and safety
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="chat" size={24} color={colors.warning} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Direct Communication</Text>
                <Text style={styles.featureDescription}>
                  Chat directly with service providers to discuss your needs
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Team */}
        <Surface style={styles.teamCard} elevation={2}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <Text style={styles.teamText}>
            EmekPay was founded by a team of passionate entrepreneurs who believe in the power of connecting people
            through meaningful work. We're committed to building a platform that empowers both service providers and
            seekers to achieve their goals.
          </Text>
        </Surface>

        {/* Contact */}
        <Surface style={styles.contactCard} elevation={2}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <MaterialIcons name="email" size={20} color={colors.textSecondary} />
              <Text style={styles.contactText}>hello@emekpay.com</Text>
            </View>

            <View style={styles.contactItem}>
              <MaterialIcons name="web" size={20} color={colors.textSecondary} />
              <Text style={styles.contactText}>www.emekpay.com</Text>
            </View>

            <View style={styles.contactItem}>
              <MaterialIcons name="location-on" size={20} color={colors.textSecondary} />
              <Text style={styles.contactText}>Istanbul, Turkey</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={() => router.push("/contact")}
            style={styles.contactButton}
          >
            Contact Us
          </Button>
        </Surface>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 EmekPay. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for the community
          </Text>
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
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
  },
  tagline: {
    ...typography.subheading,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  version: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  missionCard: {
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 16,
  },
  missionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresCard: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  teamCard: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  teamText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  contactCard: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  contactInfo: {
    gap: 12,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    ...typography.body,
    color: colors.text,
  },
  contactButton: {
    backgroundColor: colors.primary,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
})
