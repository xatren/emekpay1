import { Button, type ButtonProps } from "react-native-paper"
import { colors } from "../lib/theme"

interface PrimaryButtonProps extends ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost"
}

export default function PrimaryButton({ variant = "primary", style, ...props }: PrimaryButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return { backgroundColor: colors.primary }
      case "secondary":
        return { backgroundColor: colors.secondary }
      case "outline":
        return { borderColor: colors.primary, backgroundColor: "transparent" }
      case "ghost":
        return { backgroundColor: "transparent" }
      default:
        return { backgroundColor: colors.primary }
    }
  }

  const mode = variant === "outline" ? "outlined" : variant === "ghost" ? "text" : "contained"

  return <Button mode={mode} style={[getButtonStyle(), style]} {...props} />
}
