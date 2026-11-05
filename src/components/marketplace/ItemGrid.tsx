import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useMarketplace } from '@/providers';
import type { Item } from '@/types/models';
import { openItem } from '@/utils/navigation';
import { ItemCard, ItemCardSkeleton } from './ItemCard';


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
  onHeart: (item: Item) => void;
  ageLabel?: (item: Item) => string;
};

function sameRow(previous: ItemGridRowProps, next: ItemGridRowProps) {
  if (previous.columns !== next.columns || previous.onSave !== next.onSave || previous.onHeart !== next.onHeart || previous.ageLabel !== next.ageLabel) return false;
  if (previous.row.cells.length !== next.row.cells.length) return false;
  return next.row.cells.every((item, index) => {
    if (item !== previous.row.cells[index]) return false;
    return !item || (previous.saved.has(item.id) === next.saved.has(item.id) && previous.hearted.has(item.id) === next.hearted.has(item.id));
  });
}

export const ItemGridRow = memo(function ItemGridRow({ row, columns, saved, hearted, onSave, onHeart, ageLabel }: ItemGridRowProps) {
  return (
    <View style={styles.row}>
      {row.cells.map((item, index) => (
        <View key={item?.id ?? `skeleton-${index}`} style={styles.cell}>
          {item ? (
            <ItemCard item={item} saved={saved.has(item.id)} hearted={hearted.has(item.id)} ageLabel={ageLabel?.(item)} onOpen={openItem} onSave={onSave} onHeart={onHeart} />
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
}, sameRow);

type ItemGridProps = {
  items: Item[];
  loading?: boolean;
  columns?: number;
  ageLabel?: (item: Item) => string;
};

/** Plain grid for short lists inside a scrolling screen. Long feeds use a FlatList with ItemGridRow. */
export function ItemGrid({ items, loading, columns: columnsOverride, ageLabel }: ItemGridProps) {
  const { columns: responsiveColumns } = useResponsive();
  const columns = columnsOverride ?? responsiveColumns;
  const rows = useGridRows(items, loading, columns);
  const { saved, hearted, toggleSaved, toggleHeart } = useInteractionSets();

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <ItemGridRow key={row.key} row={row} columns={columns} saved={saved} hearted={hearted} onSave={toggleSaved} onHeart={toggleHeart} ageLabel={ageLabel} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1 },
});
