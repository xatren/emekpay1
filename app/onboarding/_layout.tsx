import { Stack } from "expo-router"

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="screen1" />
      <Stack.Screen name="screen2" />
      <Stack.Screen name="screen3" />
      <Stack.Screen name="screen4" />
      <Stack.Screen name="screen5" />
      <Stack.Screen name="welcome" />
    </Stack>
  )
}
