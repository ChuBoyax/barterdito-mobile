import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useMarketplace } from '@/providers';
import type { Item } from '@/types/models';
import { ItemCard, ItemCardSkeleton } from './ItemCard';

type ItemGridProps = {
  items: Item[];
  loading?: boolean;
  columns?: number;
};

export function ItemGrid({ items, loading, columns: columnsOverride }: ItemGridProps) {
  const { savedIds, heartedIds, toggleSaved, toggleHeart } = useMarketplace();
  const { columns: responsiveColumns } = useResponsive();
  const columns = columnsOverride ?? responsiveColumns;
  const cells = loading ? Array.from({ length: columns * 2 }, () => null) : items;
  const rows: (Item | null)[][] = [];
  for (let index = 0; index < cells.length; index += columns) rows.push(cells.slice(index, index + columns));

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item, cellIndex) =>
            item ? (
              <View key={item.id} style={styles.cell}>
                <ItemCard
                  item={item}
                  saved={savedIds.includes(item.id)}
                  hearted={heartedIds.includes(item.id)}
                  onOpen={() => router.push(`/items/${item.id}`)}
                  onSave={() => toggleSaved(item.id)}
                  onHeart={() => toggleHeart(item.id)}
                />
              </View>
            ) : (
              <View key={`skeleton-${cellIndex}`} style={styles.cell}>
                <ItemCardSkeleton />
              </View>
            ),
          )}
          {row.length < columns
            ? Array.from({ length: columns - row.length }, (_, index) => <View key={`pad-${index}`} style={styles.cell} />)
            : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 22 },
  row: { flexDirection: 'row', gap: 14 },
  cell: { flex: 1 },
});


