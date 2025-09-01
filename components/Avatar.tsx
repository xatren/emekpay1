import { Avatar as PaperAvatar, type AvatarProps } from "react-native-paper"
import { colors } from "../lib/theme"

interface CustomAvatarProps extends AvatarProps {
  name?: string
  imageUrl?: string
  size?: number
}

export default function Avatar({ name, imageUrl, size = 40, style, ...props }: CustomAvatarProps) {
  if (imageUrl) {
    return <PaperAvatar.Image size={size} source={{ uri: imageUrl }} style={style} {...props} />
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <PaperAvatar.Text size={size} label={initials} style={[{ backgroundColor: colors.primary }, style]} {...props} />
  )
}
