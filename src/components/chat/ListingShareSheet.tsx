import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, Button, EmptyState, LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { directMessageService, itemService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { clientId } from '@/services/tradeService';
import type { DirectMessage } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

type ListingShareSheetProps = {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
  onShared: (message: DirectMessage) => void;
};

export function ListingShareSheet({ visible, conversationId, onClose, onShared }: ListingShareSheetProps) {
  const { colors } = useTheme();
  const { data: items = [], loading, error: loadError, reload } = useAsync(queryKeys.myItems, () => itemService.getMyItems());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Retrying the same listing reuses its request id, so a lost response cannot send it twice.
  const requests = useRef(new Map<string, string>());
  const active = items.filter((item) => item.status === 'Active');

  async function share(listingId: string) {
    if (busy) return;
    const request = requests.current.get(listingId) ?? clientId();
    requests.current.set(listingId, request);
    setBusy(listingId);
    setError('');
    try {
      onShared(await directMessageService.shareListing(conversationId, listingId, request));
      requests.current.delete(listingId);
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not share this listing. Try again.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Private message" title="Share a listing">
      <AppText variant="small">Choose one of your active items. Sharing a listing does not send a trade proposal.</AppText>
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      {loading ? (
        <LoadingView variant="list" inline />
      ) : loadError && !items.length ? (
        <>
          <AppText variant="caption" color="red" weight="semibold">
            {loadError}
          </AppText>
          <Button label="Try again" variant="secondary" onPress={() => void reload()} />
        </>
      ) : !active.length ? (
        <EmptyState icon={Package} title="No active listings yet." text="Post an item, then you can share it in any private conversation." />
      ) : (
        active.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Share ${item.title}`}
            disabled={busy !== null}
            onPress={() => void share(item.id)}
            style={({ pressed }) => [styles.row, { backgroundColor: colors.surface2 }, (pressed || (busy !== null && busy !== item.id)) && styles.dimmed]}>
            <View style={[styles.thumb, { backgroundColor: colors.background }]}>
              {item.image ? <Image source={item.image} style={styles.image} contentFit="cover" /> : <Package size={22} color={colors.muted} />}
            </View>
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {item.condition}
              </AppText>
            </View>
            {busy === item.id ? <ActivityIndicator color={colors.orange} /> : null}
          </Pressable>
        ))
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 10 },
  dimmed: { opacity: 0.6 },
  thumb: { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
