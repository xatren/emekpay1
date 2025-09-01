import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper"

// Light Theme
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563EB", // Trust Blue
    secondary: "#EA580C", // Energy Orange
    tertiary: "#059669", // Success Green
    error: "#DC2626", // Error Red
    surface: "#FFFFFF",
    background: "#F8FAFC", // Light Gray
    onSurface: "#1E293B", // Dark Gray
    onBackground: "#1E293B",
    surfaceVariant: "#F1F5F9",
    onSurfaceVariant: "#64748B",
    outline: "#CBD5E1",
    outlineVariant: "#E2E8F0",
  },
}

// Dark Theme
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#3B82F6", // Lighter blue for dark theme
    secondary: "#FB923C", // Lighter orange for dark theme
    tertiary: "#10B981", // Lighter green for dark theme
    error: "#EF4444", // Lighter red for dark theme
    surface: "#0F172A", // Dark navy
    background: "#020617", // Darker navy
    onSurface: "#F8FAFC", // Light text
    onBackground: "#F8FAFC",
    surfaceVariant: "#1E293B",
    onSurfaceVariant: "#CBD5E1",
    outline: "#475569",
    outlineVariant: "#64748B",
  },
}

// Legacy theme (light mode default)
export const theme = lightTheme

// Function to get theme colors (use this instead of static colors)
export const getThemeColors = (isDark: boolean = false) => {
  return isDark ? darkTheme.colors : lightTheme.colors
}

// TEMPORARY: Legacy colors export (will be removed after migration)
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

// Legacy alias
export const extendedColors = colors

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
