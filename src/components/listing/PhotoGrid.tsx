import { Image } from 'expo-image';
import { ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

const COLUMNS = 3;
const GAP = 8;

type PhotoGridProps = {
  photos: string[];
  max: number;
  error?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMakeCover: (index: number) => void;
};


export function PhotoGrid({ photos, max, error, onAdd, onRemove, onMakeCover }: PhotoGridProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const tile = width ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  const size = { width: tile, height: tile };

  const helper = error ?? (photos.length > 1 ? 'Tap a photo to make it the cover.' : 'Clear, well-lit photos get more offers. The first one is your cover.');

  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <AppText variant="small" color="ink" weight="bold">
          Photos
        </AppText>
        <AppText variant="caption">
          {photos.length}/{max}
        </AppText>
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.grid}>
        {tile
          ? photos.map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={index === 0 ? 'Cover photo' : `Photo ${index + 1}, tap to set as cover`}
                onPress={() => onMakeCover(index)}
                style={[styles.tile, size, { backgroundColor: colors.surface2 }]}>
                <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                {index === 0 ? (
                  <View style={[styles.cover, { backgroundColor: colors.orange }]}>
                    <AppText variant="caption" weight="bold" style={{ color: colors.onPrimary }}>
                      Cover
                    </AppText>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  hitSlop={8}
                  onPress={() => onRemove(index)}
                  style={[styles.remove, { backgroundColor: colors.scrim }]}>
                  <X size={13} color={colors.onPhoto} strokeWidth={2.6} />
                </Pressable>
              </Pressable>
            ))
          : null}
        {tile && photos.length < max ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos"
            onPress={onAdd}
            style={[styles.tile, styles.add, size, { borderColor: error ? colors.red : colors.orange, backgroundColor: colors.orangePale }]}>
            <ImagePlus size={22} color={colors.orange} />
            <AppText variant="caption" color="orange" weight="bold">
              Add photo
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <AppText variant="caption" color={error ? 'red' : 'muted'}>
        {helper}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 14, overflow: 'hidden' },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  cover: { position: 'absolute', left: 6, bottom: 6, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
