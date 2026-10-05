import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Archive, ArrowRightLeft, Edit3, Eye, Heart, Package, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Badge, Button, Card, ChipRow, EmptyState, IconButton, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
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
  const { gutter } = useResponsive();
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
      <StatGrid
        stats={[
          { label: 'Listings', value: items.length, icon: Package },
          { label: 'Views', value: formatNumber(items.reduce((sum, item) => sum + item.views, 0)), icon: Eye, tone: 'blue' },
          { label: 'Hearts', value: items.reduce((sum, item) => sum + item.hearts, 0), icon: Heart, tone: 'red' },
        ]}
      />
      <View style={{ marginHorizontal: -gutter }}>
        <ChipRow inset={gutter} options={tabs} value={tab} onChange={setTab} />
      </View>
      {loading && !items.length ? (
        <LoadingView />
      ) : visible.length ? (
        visible.map((item) => <ManagedItem key={item.id} item={item} onArchive={() => confirmArchive(item)} />)
      ) : (
        <EmptyState icon={Package} title="No items here" text="Post an item or choose a different status." action="Post an item" onAction={() => router.push('/post-item')} />
      )}
    </Screen>
  );
}

function ManagedItem({ item, onArchive }: { item: Item; onArchive: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={() => router.push(`/items/${item.id}`)} style={styles.managed}>
      <Image source={item.image} style={styles.thumb} contentFit="cover" />
      <View style={styles.flex}>
        <Badge label={item.status} tone={item.status === 'Active' ? 'green' : 'orange'} dot />
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <View style={styles.meta}>
          <ArrowRightLeft size={11} color={colors.orange} strokeWidth={2.6} />
          <AppText variant="caption" color="orange" weight="bold" numberOfLines={1} style={styles.flex}>
            {item.wanted}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Heart size={12} color={colors.muted} />
          <AppText variant="caption">{item.hearts}</AppText>
          <Eye size={12} color={colors.muted} style={styles.gapLeft} />
          <AppText variant="caption">{item.views}</AppText>
        </View>
        <View style={styles.actions}>
          <Button label="Edit" icon={Edit3} variant="secondary" compact onPress={() => router.push('/post-item')} />
          <IconButton icon={Archive} label="Archive listing" tone="danger" size={16} dimension={38} onPress={onArchive} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  managed: { flexDirection: 'row', gap: 14, padding: 12 },
  thumb: { width: 112, height: 140, borderRadius: 18 },
  flex: { flex: 1, gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gapLeft: { marginLeft: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
});


