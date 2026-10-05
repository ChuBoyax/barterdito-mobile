import { Image } from 'expo-image';
import { ArrowRightLeft, Camera, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { ItemDraft } from '@/types/models';


export function ListingPreview({ draft }: { draft: ItemDraft }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.cover, { backgroundColor: colors.surface2 }]}>
        {draft.photos[0] ? (
          <Image source={draft.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <>
            <Camera size={32} color={colors.muted} />
            <AppText variant="caption">Cover preview</AppText>
          </>
        )}
      </View>
      <View style={styles.badges}>
        <Badge label={draft.category || 'Category'} tone="orange" />
        <Badge label={draft.condition} tone="neutral" />
      </View>
      <AppText variant="h2">{draft.title || 'Your item title'}</AppText>
      <AppText variant="small">{draft.description || 'Your item description will appear here.'}</AppText>
      <View style={styles.row}>
        <ArrowRightLeft size={14} color={colors.orange} />
        <AppText variant="caption" color="orange" weight="bold" style={styles.flex}>
          {draft.lookingFor || 'What you want in exchange'}
        </AppText>
      </View>
      <View style={styles.row}>
        <MapPin size={14} color={colors.muted} />
        <AppText variant="caption">{draft.location || 'Your city'}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  cover: { height: 200, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 },
  badges: { flexDirection: 'row', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flex: { flex: 1 },
});
