import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useMarketplace } from '@/providers';
import type { Item } from '@/types/models';
import { ItemCard, ItemCardSkeleton } from './ItemCard';

const openItem = (id: string) => router.push(`/items/${id}`);

/** A grid row: items, or `null` placeholders while loading. */
export type GridRow = { key: string; cells: (Item | null)[] };

/** Splits items into fixed-width rows (shared by the plain and virtualized grids). */
export function useGridRows(items: Item[], loading: boolean | undefined, columns: number): GridRow[] {
  return useMemo(() => {
    const cells: (Item | null)[] = loading && !items.length ? Array.from({ length: columns * 2 }, () => null) : items;
    const rows: GridRow[] = [];
    for (let index = 0; index < cells.length; index += columns) {
      const slice = cells.slice(index, index + columns);
      rows.push({ key: slice.map((cell, offset) => cell?.id ?? `skeleton-${index + offset}`).join('|'), cells: slice });
    }
    return rows;
  }, [items, loading, columns]);
}

/** Saved/hearted lookups as Sets: O(1) per card instead of scanning arrays for every cell. */
export function useInteractionSets() {
  const { savedIds, heartedIds, toggleSaved, toggleHeart } = useMarketplace();
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const hearted = useMemo(() => new Set(heartedIds), [heartedIds]);
  return { saved, hearted, toggleSaved, toggleHeart };
}

type ItemGridRowProps = {
  row: GridRow;
  columns: number;
  saved: Set<string>;
  hearted: Set<string>;
  onSave: (id: string) => void;
  onHeart: (id: string) => void;
};

export const ItemGridRow = memo(function ItemGridRow({ row, columns, saved, hearted, onSave, onHeart }: ItemGridRowProps) {
  return (
    <View style={styles.row}>
      {row.cells.map((item, index) => (
        <View key={item?.id ?? `skeleton-${index}`} style={styles.cell}>
          {item ? (
            <ItemCard item={item} saved={saved.has(item.id)} hearted={hearted.has(item.id)} onOpen={openItem} onSave={onSave} onHeart={onHeart} />
          ) : (
            <ItemCardSkeleton />
          )}
        </View>
      ))}
      {row.cells.length < columns
        ? Array.from({ length: columns - row.cells.length }, (_, index) => <View key={`pad-${index}`} style={styles.cell} />)
        : null}
    </View>
  );
});

type ItemGridProps = {
  items: Item[];
  loading?: boolean;
  columns?: number;
};

/** Plain grid for short lists inside a scrolling screen. Long feeds use a FlatList with ItemGridRow. */
export function ItemGrid({ items, loading, columns: columnsOverride }: ItemGridProps) {
  const { columns: responsiveColumns } = useResponsive();
  const columns = columnsOverride ?? responsiveColumns;
  const rows = useGridRows(items, loading, columns);
  const { saved, hearted, toggleSaved, toggleHeart } = useInteractionSets();

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <ItemGridRow key={row.key} row={row} columns={columns} saved={saved} hearted={hearted} onSave={toggleSaved} onHeart={toggleHeart} />
      ))}
    </View>
  );
}

export const gridStyles = StyleSheet.create({
  rowGap: { height: 22 },
});

const styles = StyleSheet.create({
  grid: { gap: 22 },
  row: { flexDirection: 'row', gap: 16 },
  cell: { flex: 1 },
});
