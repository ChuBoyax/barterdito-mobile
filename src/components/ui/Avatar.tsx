import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

const sizes = {
  small: { box: 38, font: 12 },
  medium: { box: 48, font: 14 },
  large: { box: 58, font: 17 },
  hero: { box: 100, font: 30 },
} as const;

type AvatarProps = {
  initials: string;
  color?: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  ring?: boolean;
  online?: boolean;
};

export function Avatar({ initials, color, imageUrl, size = 'medium', ring, online }: AvatarProps) {
  const { colors } = useTheme();
  const { box, font } = sizes[size];
  const ringWidth = ring ? 3 : 0;
  const outer = box + ringWidth * 2 + (ring ? 4 : 0);
  return (
    <View
      style={[
        styles.outer,
        { width: outer, height: outer, borderRadius: outer / 2 },
        ring && { borderWidth: ringWidth, borderColor: colors.orange, padding: 2 },
      ]}>
      <View style={[styles.avatar, { width: box, height: box, borderRadius: box / 2, backgroundColor: color ?? colors.blue }]} accessibilityLabel={initials}>
        {imageUrl ? (
          <Image source={imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[styles.text, { fontSize: font, color: colors.onPrimary }]}>{initials}</Text>
        )}
      </View>
      {online ? (
        <View style={[styles.online, { backgroundColor: colors.green, borderColor: colors.surface, width: box * 0.26, height: box * 0.26, borderRadius: box * 0.13 }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { fontFamily: fonts.extrabold },
  online: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2.5 },
});
