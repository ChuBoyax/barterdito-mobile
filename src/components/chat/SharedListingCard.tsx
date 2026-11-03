import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Package } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { SharedListing } from '@/types/directMessages';

const statusLabels: Record<SharedListing['status'], string> = {
  active: 'Available',
  in_negotiation: 'In negotiation',
  traded: 'Traded',
  unavailable: 'Listing no longer available',
};

/** A listing shared in a PM. Status stays live, so old cards never advertise a traded item. */
export function SharedListingCard({ listing }: { listing: SharedListing }) {
  const { colors } = useTheme();
  const available = listing.id !== null && listing.status !== 'unavailable';
  return (
    <Pressable
      accessibilityRole={available ? 'link' : undefined}
      accessibilityLabel={`${available ? 'View listing' : 'Unavailable listing'}: ${listing.title}`}
      disabled={!available}
      onPress={() => router.push(`/items/${listing.id}`)}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface2 }, pressed && styles.pressed]}>
      <View style={[styles.thumb, { backgroundColor: colors.background }]}>
        {listing.imageUrl ? <Image source={listing.imageUrl} style={styles.image} contentFit="cover" /> : <Package size={26} color={colors.muted} />}
      </View>
      <View style={styles.info}>
        <AppText variant="h3" numberOfLines={2}>
          {listing.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {listing.condition}
        </AppText>
        <AppText variant="caption" weight="semibold" color={listing.status === 'active' ? 'green' : 'muted'}>
          {statusLabels[listing.status]}
        </AppText>
        {available ? (
          <AppText variant="caption" color="orange" weight="bold">
            View listing
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, width: 250, maxWidth: '100%', borderRadius: 16, padding: 10 },
  pressed: { opacity: 0.8 },
  thumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 1 },
});
