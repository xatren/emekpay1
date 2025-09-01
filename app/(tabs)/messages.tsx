import { View, Text, StyleSheet, FlatList } from "react-native"
import { Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { colors, typography } from "../../lib/theme"

export default function MessagesScreen() {
  // TODO: Implement real messaging functionality
  const conversations = []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Chat with service providers and clients</Text>
      </View>

      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id}
          renderItem={() => null} // TODO: Implement conversation item
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialIcons name="chat-bubble-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a conversation by contacting a service provider or responding to a service request
            </Text>
          </Surface>
        </View>
      )}
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
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 16,
  },
  emptyStateText: {
    ...typography.subheading,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
})
