import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Archive, ArrowRightLeft, CheckCircle2, Edit3, Eye, Heart, Inbox, MoreHorizontal, Package, Plus, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ItemStatusBadge, StatGrid } from '@/components/marketplace';
import { ActionSheet, AppText, Button, Card, ChipRow, EmptyState, IconButton, LoadingView, Screen, type ActionSheetOption } from '@/components/ui';
import { itemStatuses } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { useMarketplace, useTheme, useToast } from '@/providers';
import { itemService } from '@/services';
import type { Item, ItemStatus } from '@/types/models';
import { confirmAction } from '@/utils/confirm';
import { formatNumber } from '@/utils/format';
import { shareItem } from '@/utils/share';

const emptyCopy: Record<ItemStatus, string> = {
  Active: 'Listings that are open for offers will show up here.',
  'In Negotiation': 'Listings with an accepted offer will show up here.',
  Traded: 'Your completed swaps will show up here.',
};

export default function MyItemsScreen() {
  return (
    <RequireAuth>
      <MyItemsContent />
    </RequireAuth>
  );
}

function MyItemsContent() {
  const showToast = useToast();
  const { removeItem, upsertItem, items: marketItems } = useMarketplace();
  const [tab, setTab] = useState('All');
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const { data: items = [], loading, setData, reload } = useAsync(() => itemService.getMyItems(), [marketItems.length]);
  const { gutter } = useResponsive();

  const count = (status: ItemStatus) => items.filter((item) => item.status === status).length;
  // Chip labels carry the count, e.g. "Active · 1"; strip it back off to get the status.
  const options = ['All', ...itemStatuses.map((status) => (count(status) ? `${status} · ${count(status)}` : status))];
  const selected = options.find((option) => option.startsWith(tab)) ?? 'All';
  const visible = items.filter((item) => tab === 'All' || item.status === tab);

  function replace(updated: Item) {
    setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    upsertItem(updated);
  }

  async function archive(item: Item) {
    const ok = await confirmAction({
      title: 'Archive listing?',
      message: `${item.title} will be removed from the marketplace. Pending offers on it will be closed.`,
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;
    await itemService.archiveItem(item.id);
    setData((current = []) => current.filter((entry) => entry.id !== item.id));
    removeItem(item.id);
    showToast('Listing archived');
  }

  async function markTraded(item: Item) {
    const ok = await confirmAction({ title: 'Mark as traded?', message: `${item.title} will no longer accept new offers.`, confirmLabel: 'Mark as traded' });
    if (!ok) return;
    replace(await itemService.markTraded(item.id));
    showToast('Marked as traded');
  }

  const menuOptions = (item: Item): ActionSheetOption[] => {
    const open = item.status !== 'Traded';
    const options: (ActionSheetOption | false)[] = [
      { label: 'View listing', icon: Eye, description: 'See it the way traders do', onPress: () => router.push(`/items/${item.id}`) },
      open && { label: 'Edit listing', icon: Edit3, description: 'Update photos, details, or what you want', onPress: () => router.push(`/post-item?edit=${item.id}`) },
      { label: 'Share', icon: Share2, description: 'Send the link to friends', onPress: () => void shareItem(item) },
      open && { label: 'Mark as traded', icon: CheckCircle2, description: 'Stop receiving new offers', onPress: () => void markTraded(item) },
      { label: 'Archive listing', icon: Archive, description: 'Remove it from the marketplace', destructive: true, onPress: () => void archive(item) },
    ];
    return options.filter((option): option is ActionSheetOption => Boolean(option));
  };

  return (
    <Screen
      refreshing={loading}
      onRefresh={() => void reload()}
      header={
        <AppHeader
          eyebrow="Your listings"
          title="My Items"
          actions={<IconButton icon={Plus} label="New listing" tone="glass" onPress={() => router.push('/post-item')} />}
        />
      }>
      {!loading && !items.length ? (
        <EmptyState
          icon={Package}
          title="You haven't listed anything yet"
          text="Post an item you no longer need and start receiving swap offers from the community."
          action="Post your first item"
          onAction={() => router.push('/post-item')}
        />
      ) : (
        <>
          <StatGrid
            stats={[
              { label: 'Listings', value: items.length, icon: Package },
              { label: 'Views', value: formatNumber(items.reduce((sum, item) => sum + item.views, 0)), icon: Eye, tone: 'blue' },
              { label: 'Likes', value: items.reduce((sum, item) => sum + item.hearts, 0), icon: Heart, tone: 'red' },
            ]}
          />
          <View style={{ marginHorizontal: -gutter }}>
            <ChipRow inset={gutter} options={options} value={selected} onChange={(option) => setTab(option.split(' · ')[0])} />
          </View>
          {loading && !items.length ? (
            <LoadingView />
          ) : visible.length ? (
            visible.map((item) => <ManagedItem key={item.id} item={item} onOptions={() => setMenuItem(item)} />)
          ) : (
            <EmptyState icon={Package} title={`No ${tab.toLowerCase()} items`} text={emptyCopy[tab as ItemStatus] ?? ''} />
          )}
        </>
      )}
      <ActionSheet
        visible={Boolean(menuItem)}
        onClose={() => setMenuItem(null)}
        title={menuItem?.title}
        subtitle={menuItem?.status}
        options={menuItem ? menuOptions(menuItem) : []}
      />
    </Screen>
  );
}

function ManagedItem({ item, onOptions }: { item: Item; onOptions: () => void }) {
  const { colors } = useTheme();
  const traded = item.status === 'Traded';
  return (
    <Card onPress={() => router.push(`/items/${item.id}`)} accessibilityLabel={`${item.title}, ${item.status}`} style={styles.managed}>
      <Image source={item.image} style={[styles.thumb, traded && styles.faded]} contentFit="cover" />
      <View style={styles.flex}>
        <View style={styles.topRow}>
          <ItemStatusBadge status={item.status} />
          <IconButton icon={MoreHorizontal} label={`More options for ${item.title}`} size={17} dimension={32} onPress={onOptions} />
        </View>
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <View style={styles.meta}>
          <ArrowRightLeft size={11} color={colors.muted} strokeWidth={2.6} />
          <AppText variant="caption" numberOfLines={1} style={styles.flex}>
            Wants: {item.wanted}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Eye size={12} color={colors.muted} />
          <AppText variant="caption">{item.views} views</AppText>
          <Heart size={12} color={colors.muted} style={styles.gapLeft} />
          <AppText variant="caption">{item.hearts} likes</AppText>
        </View>
        {!traded ? (
          <View style={styles.actions}>
            <Button label="Edit" icon={Edit3} variant="secondary" compact style={styles.flex} onPress={() => router.push(`/post-item?edit=${item.id}`)} />
            {item.status === 'In Negotiation' ? (
              <Button label="Offers" icon={Inbox} compact style={styles.flex} onPress={() => router.navigate('/offers')} />
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  managed: { flexDirection: 'row', gap: 14, padding: 12 },
  thumb: { width: 104, height: 128, borderRadius: 16 },
  faded: { opacity: 0.6 },
  flex: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginRight: -4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gapLeft: { marginLeft: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});
