import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

const sizes = {
  small: { box: 36, font: 11 },
  medium: { box: 46, font: 13 },
  large: { box: 56, font: 15 },
  hero: { box: 96, font: 28 },
} as const;

type AvatarProps = {
  initials: string;
  color?: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
};

export function Avatar({ initials, color, imageUrl, size = 'medium' }: AvatarProps) {
  const { colors } = useTheme();
  const { box, font } = sizes[size];
  return (
    <View
      style={[styles.avatar, { width: box, height: box, borderRadius: box / 2, backgroundColor: color ?? colors.blue }]}
      accessibilityLabel={initials}>
      {imageUrl ? (
        <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: font }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: '#fff', fontFamily: fonts.extrabold },
});
