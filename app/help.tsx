"use client"

import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Surface, List, Card } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { colors, typography } from "../lib/theme"

const faqs = [
  {
    question: "How do I offer a service?",
    answer: "Go to the home screen and tap 'Offer Service'. Fill in the details about your service, set your rates, and publish it."
  },
  {
    question: "How do I request a service?",
    answer: "Use the 'Discover' tab to browse available services, then tap 'Request Service' on any listing that interests you."
  },
  {
    question: "How do points work?",
    answer: "Points are our platform currency. Earn points by providing services or purchase them in your wallet."
  },
  {
    question: "How do I contact a service provider?",
    answer: "Once you book a service, you can message the provider directly through the Messages tab."
  },
  {
    question: "What if I need to cancel a booking?",
    answer: "Go to your bookings, select the booking, and use the cancel option. Check our cancellation policy for refunds."
  }
]

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Help & Support</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Quick Actions */}
        <Surface style={styles.quickActions} elevation={2}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.actionGrid}>
            <Card style={styles.actionCard} mode="outlined" onPress={() => router.push("/contact")}>
              <Card.Content style={styles.actionContent}>
                <MaterialIcons name="contact-mail" size={32} color={colors.primary} />
                <Text style={styles.actionTitle}>Contact Us</Text>
                <Text style={styles.actionDescription}>Get in touch with our support team</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} mode="outlined" onPress={() => router.push("/feedback")}>
              <Card.Content style={styles.actionContent}>
                <MaterialIcons name="feedback" size={32} color={colors.secondary} />
                <Text style={styles.actionTitle}>Send Feedback</Text>
                <Text style={styles.actionDescription}>Share your thoughts and suggestions</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} mode="outlined" onPress={() => router.push("/report")}>
              <Card.Content style={styles.actionContent}>
                <MaterialIcons name="report-problem" size={32} color={colors.error} />
                <Text style={styles.actionTitle}>Report Issue</Text>
                <Text style={styles.actionDescription}>Report bugs or safety concerns</Text>
              </Card.Content>
            </Card>

            <Card style={styles.actionCard} mode="outlined" onPress={() => router.push("/chat-support")}>
              <Card.Content style={styles.actionContent}>
                <MaterialIcons name="chat" size={32} color={colors.success} />
                <Text style={styles.actionTitle}>Live Chat</Text>
                <Text style={styles.actionDescription}>Chat with our support team</Text>
              </Card.Content>
            </Card>
          </View>
        </Surface>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq, index) => (
            <Surface key={index} style={styles.faqCard} elevation={1}>
              <List.Item
                title={faq.question}
                description={faq.answer}
                descriptionNumberOfLines={3}
                left={props => <List.Icon {...props} icon="help-outline" />}
              />
            </Surface>
          ))}
        </View>

        {/* User Guide */}
        <Surface style={styles.guideSection} elevation={2}>
          <Text style={styles.sectionTitle}>User Guide</Text>

          <List.Item
            title="Getting Started"
            description="Learn the basics of using EmekPay"
            left={props => <List.Icon {...props} icon="school" />}
            onPress={() => router.push("/guide/getting-started")}
          />

          <List.Item
            title="Service Providers"
            description="Everything you need to know about offering services"
            left={props => <List.Icon {...props} icon="work" />}
            onPress={() => router.push("/guide/providers")}
          />

          <List.Item
            title="Service Seekers"
            description="How to find and book services"
            left={props => <List.Icon {...props} icon="search" />}
            onPress={() => router.push("/guide/seekers")}
          />

          <List.Item
            title="Safety & Security"
            description="Stay safe while using our platform"
            left={props => <List.Icon {...props} icon="security" />}
            onPress={() => router.push("/guide/safety")}
          />
        </Surface>

        {/* Contact Info */}
        <Surface style={styles.contactSection} elevation={2}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <List.Item
            title="Email Support"
            description="support@emekpay.com"
            left={props => <List.Icon {...props} icon="email" />}
          />

          <List.Item
            title="Phone Support"
            description="+90 (216) 555 0123"
            left={props => <List.Icon {...props} icon="phone" />}
          />

          <List.Item
            title="Business Hours"
            description="Mon-Fri: 9:00 AM - 6:00 PM (GMT+3)"
            left={props => <List.Icon {...props} icon="schedule" />}
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
  quickActions: {
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
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  actionContent: {
    alignItems: "center",
    padding: 16,
  },
  actionTitle: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  actionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
  },
  faqSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  faqCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  guideSection: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  contactSection: {
    margin: 24,
    marginTop: 0,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
})
