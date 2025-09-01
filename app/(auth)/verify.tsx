"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TextInput as RNTextInput } from "react-native"
import { Button, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, useLocalSearchParams } from "expo-router"
import { useAuthStore } from "../../hooks/useAuthStore"
import { colors, typography } from "../../lib/theme"

export default function VerifyScreen() {
  const { phone, email, type } = useLocalSearchParams<{ phone?: string; email?: string; type?: string }>()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const { verifyOtp, signInWithOtp } = useAuthStore()
  const inputRefs = useRef<(RNTextInput | null)[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("")
    if (code.length !== 6 || (!phone && !email)) return

    setLoading(true)
    try {
      const identifier = email || phone || ''
      const { error } = await verifyOtp(identifier, code, type === 'email' ? 'email' : 'sms')

      if (error) {
        console.error("Verification error:", error.message)
        // TODO: Show error toast
        // Reset OTP on error
        setOtp(["", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        // Success - navigation will be handled by the auth state change
        // User will be redirected based on profile completion status
      }
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const identifier = email || phone
    if (!identifier || countdown > 0) return

    setResendLoading(true)
    try {
      const { error } = await signInWithOtp(identifier, type === 'email')

      if (!error) {
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error("Resend error:", error)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{type === 'email' ? 'E-posta Kodunu Doğrula' : 'Verify Your Phone'}</Text>
          <Text style={styles.subtitle}>
            {type === 'email'
              ? `${email} adresine gönderdiğimiz 6 haneli kodu girin`
              : `We sent a 6-digit code to ${phone}`
            }
          </Text>
        </View>

        {/* OTP Input */}
        <Surface style={styles.otpContainer} elevation={2}>
          <Text style={styles.otpLabel}>Doğrulama kodunu girin</Text>

          <View style={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <Button
            mode="contained"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={loading || otp.some((digit) => !digit)}
            style={styles.verifyButton}
            contentStyle={styles.verifyButtonContent}
          >
            Kodu Doğrula
          </Button>
        </Surface>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Kodu almadınız mı?</Text>
          <Button
            mode="text"
            onPress={handleResend}
            loading={resendLoading}
            disabled={countdown > 0 || resendLoading}
            style={styles.resendButton}
          >
            {countdown > 0 ? `${countdown}s sonra tekrar gönder` : "Kodu Tekrar Gönder"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  otpContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 32,
  },
  otpLabel: {
    ...typography.subheading,
    color: colors.text,
    textAlign: "center",
    marginBottom: 24,
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  verifyButton: {
    backgroundColor: colors.primary,
  },
  verifyButtonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resendButton: {
    // Custom styling handled by Paper theme
  },
})
