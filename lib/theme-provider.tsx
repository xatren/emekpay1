import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { MD3Theme } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme } from './theme'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: MD3Theme
  themeMode: ThemeMode
  isDarkMode: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'emekpay_theme_mode'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeMode(savedTheme as ThemeMode)
        }
      } catch (error) {
        console.error('Error loading theme preference:', error)
      }
    }

    loadThemePreference()
  }, [])

  // Save theme preference when it changes
  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch (error) {
      console.error('Error saving theme preference:', error)
    }
  }

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode)
    saveThemePreference(mode)
  }

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light'
    handleSetThemeMode(newMode)
  }

  // Determine actual theme based on mode
  const getCurrentTheme = (): MD3Theme => {
    if (themeMode === 'system') {
      return systemTheme === 'dark' ? darkTheme : lightTheme
    }
    return themeMode === 'dark' ? darkTheme : lightTheme
  }

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemTheme === 'dark')

  const contextValue: ThemeContextType = {
    theme: getCurrentTheme(),
    themeMode,
    isDarkMode,
    setThemeMode: handleSetThemeMode,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook for getting theme colors
export function useThemeColors() {
  const { theme } = useTheme()
  return theme.colors
}
