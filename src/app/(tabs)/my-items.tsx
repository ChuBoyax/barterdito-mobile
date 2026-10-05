import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Archive, Edit3, Eye, Heart, Package, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Badge, Button, Card, ChipRow, EmptyState, IconButton, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useMarketplace, useTheme, useToast } from '@/providers';
import { itemService } from '@/services';
import type { Item } from '@/types/models';
import { formatNumber } from '@/utils/format';

const tabs = ['All', 'Active', 'In Negotiation', 'Traded'];

export default function MyItemsScreen() {
  return (
    <RequireAuth>
      <MyItemsContent />
    </RequireAuth>
  );
}

function MyItemsContent() {
  const showToast = useToast();
  const { removeItem, items: marketItems } = useMarketplace();
  const [tab, setTab] = useState('All');
  const { data: items = [], loading, setData, reload } = useAsync(() => itemService.getMyItems(), [marketItems.length]);
  const visible = items.filter((item) => tab === 'All' || item.status === tab);

  function confirmArchive(item: Item) {
    Alert.alert('Archive listing?', `${item.title} will be removed from the marketplace.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await itemService.archiveItem(item.id);
          setData((current = []) => current.filter((entry) => entry.id !== item.id));
          removeItem(item.id);
          showToast('Listing archived');
        },
      },
    ]);
  }

  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <StatGrid
        stats={[
          { label: 'Total listings', value: items.length, icon: Package },
          { label: 'Total views', value: formatNumber(items.reduce((sum, item) => sum + item.views, 0)), icon: Eye },
          { label: 'Total hearts', value: items.reduce((sum, item) => sum + item.hearts, 0), icon: Heart },
        ]}
      />
      <Button label="New listing" icon={Plus} onPress={() => router.push('/post-item')} />
      <View style={styles.bleed}>
        <ChipRow options={tabs} value={tab} onChange={setTab} />
      </View>
      {loading && !items.length ? (
        <LoadingView />
      ) : visible.length ? (
        visible.map((item) => <ManagedItem key={item.id} item={item} onArchive={() => confirmArchive(item)} />)
      ) : (
        <EmptyState
          icon={Package}
          title="No items here"
          text="Post an item or choose a different status."
          action="Post an item"
          onAction={() => router.push('/post-item')}
        />
      )}
    </Screen>
  );
}

function ManagedItem({ item, onArchive }: { item: Item; onArchive: () => void }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.managed}>
      <Image source={item.image} style={styles.thumb} contentFit="cover" />
      <View style={styles.flex}>
        <Badge label={item.status} tone={item.status === 'Active' ? 'green' : 'orange'} />
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <View style={styles.meta}>
          <Heart size={13} color={colors.muted} />
          <AppText variant="caption">{item.hearts}</AppText>
          <Eye size={13} color={colors.muted} />
          <AppText variant="caption">{item.views}</AppText>
        </View>
        <View style={styles.actions}>
          <Button label="Edit" icon={Edit3} variant="secondary" compact onPress={() => router.push('/post-item')} />
          <Button label="View" variant="ghost" compact onPress={() => router.push(`/items/${item.id}`)} />
          <IconButton icon={Archive} label="Archive listing" tone="danger" size={17} onPress={onArchive} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16 },
  managed: { flexDirection: 'row', gap: 12 },
  thumb: { width: 96, height: 96, borderRadius: 14 },
  flex: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
