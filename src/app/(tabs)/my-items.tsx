import { router } from 'expo-router';
import { CheckCircle2, Edit3, Eye, Inbox, Package, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ListingsOverview, ManagedItemCard } from '@/components/listing';
import { ActionSheet, Button, ChipRow, EmptyState, LoadingView, Screen, type ActionSheetOption } from '@/components/ui';
import { itemStatuses } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { queryClient, useMarketplaceActions, useToast } from '@/providers';
import { itemService } from '@/services';
import type { Item, ItemStatus } from '@/types/models';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';
import { shareItem } from '@/utils/share';
import { queryKeys } from '@/services/queryKeys';

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
  const { removeItem, upsertItem } = useMarketplaceActions();
  const [tab, setTab] = useState('All');
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const { data: items = [], loading, refreshing, error, setData, reload } = useAsync(queryKeys.myItems, () => itemService.getMyItems());
  const { gutter } = useResponsive();

  const summary = useMemo(() => {
    const counts: Record<ItemStatus, number> = { Active: 0, 'In Negotiation': 0, Traded: 0 };
    let views = 0;
    let hearts = 0;
    for (const item of items) {
      counts[item.status] += 1;
      views += item.views;
      hearts += item.hearts;
    }
    return { counts, views, hearts };
  }, [items]);
  const options = ['All', ...itemStatuses.map((status) => (summary.counts[status] ? `${status} · ${summary.counts[status]}` : status))];
  const selected = options.find((option) => option.startsWith(tab)) ?? 'All';
  const visible = useMemo(() => items.filter((item) => tab === 'All' || item.status === tab), [items, tab]);
  const openMenu = useCallback((item: Item) => setMenuItem(item), []);

  function replace(updated: Item) {
    setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    upsertItem(updated);
    queryClient.setQueryData(queryKeys.item(updated.id), updated);
    void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
  }

  async function remove(item: Item) {
    const ok = await confirmAction({
      title: 'Delete listing?',
      message: `${item.title} and its photos will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await itemService.deleteItem(item.id);
      setData((current = []) => current.filter((entry) => entry.id !== item.id));
      removeItem(item.id);
      queryClient.removeQueries({ queryKey: queryKeys.item(item.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      showToast('Listing deleted');
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not delete this listing'));
    }
  }

  async function changeStatus(item: Item, status: ItemStatus) {
    if (status === 'Traded') {
      const ok = await confirmAction({ title: 'Mark as traded?', message: `${item.title} will no longer appear in the marketplace.`, confirmLabel: 'Mark as traded' });
      if (!ok) return;
    }
    try {
      replace(await itemService.setStatus(item, status));
      showToast(status === 'Traded' ? 'Marked as traded' : `Marked as ${status.toLowerCase()}`);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not update this listing'));
    }
  }

  const menuOptions = (item: Item): ActionSheetOption[] => {
    const open = item.status !== 'Traded';
    if (item.status === 'In Negotiation') {
      return [
        { label: 'View listing', icon: Eye, description: 'See it the way traders do', onPress: () => router.push(`/items/${item.id}`) },
        { label: 'Open trade offers', icon: Inbox, description: 'Reserved by an accepted trade', onPress: () => router.navigate('/offers') },
        { label: 'Share', icon: Share2, description: 'Send the link to friends', onPress: () => void shareItem(item) },
      ];
    }
    const options: (ActionSheetOption | false)[] = [
      { label: 'View listing', icon: Eye, description: 'See it the way traders do', onPress: () => router.push(`/items/${item.id}`) },
      { label: 'Edit listing', icon: Edit3, description: 'Update photos, details, status, or what you want', onPress: () => router.push(`/post-item?edit=${item.id}`) },
      { label: 'Share', icon: Share2, description: 'Send the link to friends', onPress: () => void shareItem(item) },
      open && { label: 'Mark as traded', icon: CheckCircle2, description: 'Remove it from the marketplace', onPress: () => void changeStatus(item, 'Traded') },
      !open && { label: 'Mark as active', icon: RotateCcw, description: 'List it in the marketplace again', onPress: () => void changeStatus(item, 'Active') },
      { label: 'Delete listing', icon: Trash2, description: 'Permanently delete it and its photos', destructive: true, onPress: () => void remove(item) },
    ];
    return options.filter((option): option is ActionSheetOption => Boolean(option));
  };

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => void reload()}
      header={
        <AppHeader
          title="My Items"
          actions={<Button label="New" icon={Plus} compact onPress={() => router.push('/post-item')} />}
        />
      }>
      {error && !items.length ? (
        <EmptyState icon={Package} title="Could not load your listings" text={error} action="Try again" actionIcon={RotateCcw} onAction={() => void reload()} />
      ) : !loading && !items.length ? (
        <EmptyState
          icon={Package}
          title="No listings yet"
          text="Post something you no longer need."
          action="Post an item"
          onAction={() => router.push('/post-item')}
        />
      ) : (
        <>
          <ListingsOverview total={items.length} views={summary.views} hearts={summary.hearts} />
          <View style={{ marginHorizontal: -gutter }}>
            <ChipRow inset={gutter} options={options} value={selected} onChange={(option) => setTab(option.split(' · ')[0])} />
          </View>
          {loading && !items.length ? (
            <LoadingView variant="cards" inline />
          ) : visible.length ? (
            <View style={styles.list}>
              {visible.map((item) => (
                <ManagedItemCard key={item.id} item={item} onOptions={openMenu} />
              ))}
            </View>
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

const styles = StyleSheet.create({
  list: { gap: 12 },
});
