import { MD3LightTheme } from "react-native-paper"

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563EB", // Trust Blue
    secondary: "#EA580C", // Energy Orange
    tertiary: "#059669", // Success Green
    error: "#DC2626", // Error Red
    warning: "#D97706", // Warning Yellow
    surface: "#FFFFFF",
    background: "#F8FAFC", // Light Gray
    onSurface: "#1E293B", // Dark Gray
    onBackground: "#1E293B",
  },
}

export const colors = {
  primary: "#2563EB",
  secondary: "#EA580C",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
}

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
}
