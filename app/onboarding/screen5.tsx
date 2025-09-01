"use client"

import React, { useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { colors } from "../../lib/theme"

const { width, height } = Dimensions.get('window')

export default function OnboardingScreen5() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleGetStarted = () => {
    router.push('/onboarding/welcome')
  }

  const handlePrevious = () => {
    router.push('/onboarding/screen4')
  }

  const handleSkip = () => {
    router.push('/onboarding/welcome')
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>

          {/* Illustration Area */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustration}>
              <Text style={styles.illustrationEmoji}>💰</Text>
              <View style={styles.rewardElements}>
                <View style={styles.coin}>
                  <Text style={styles.coinText}>+50</Text>
                </View>
                <View style={styles.star}>
                  <Text style={styles.starText}>⭐</Text>
                </View>
                <View style={styles.gift}>
                  <Text style={styles.giftText}>🎁</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.primaryText}>Hizmetleriniz İçin Puan Kazanın</Text>
            <Text style={styles.supportingText}>
              Her tamamladığınız hizmet için puan kazanın, seviye atlayın ve özel ödüllerin kilidini açın. Puanlarınızı gerçek paraya dönüştürebilirsiniz.
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
              <Text style={styles.previousButtonText}>Geri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Başlayalım!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 24,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: "500",
  },
  illustrationContainer: {
    marginBottom: 48,
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  illustrationEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  rewardElements: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
  },
  coin: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.warning,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coinText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "bold",
  },
  star: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  starText: {
    fontSize: 16,
  },
  gift: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  giftText: {
    fontSize: 16,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  primaryText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.surface,
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  supportingText: {
    fontSize: 16,
    fontWeight: "400",
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: "center",
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: colors.surface,
    width: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  previousButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  getStartedButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
})
