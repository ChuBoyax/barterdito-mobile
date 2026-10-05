import { BottomSheet, Button, SelectField } from '@/components/ui';
import type { ItemFilters } from '@/types/models';

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  filters: ItemFilters;
  locations: string[];
  conditions: string[];
  onChange: (next: Partial<ItemFilters>) => void;
};

export function FilterSheet({ visible, onClose, filters, locations, conditions, onChange }: FilterSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Refine" title="Filters">
      <SelectField
        label="Condition"
        value={filters.condition}
        options={['Any condition', ...conditions]}
        onChange={(condition) => onChange({ condition })}
      />
      <SelectField
        label="Sort by"
        value={filters.sort}
        options={['Newest first', 'Most hearts', 'Most viewed']}
        onChange={(sort) => onChange({ sort: sort as ItemFilters['sort'] })}
      />
      <SelectField
        label="Location"
        value={filters.location}
        options={['Any location', ...locations]}
        onChange={(location) => onChange({ location })}
      />
      <Button label="Show results" onPress={onClose} />
      <Button
        label="Clear filters"
        variant="ghost"
        onPress={() => onChange({ condition: 'Any condition', location: 'Any location', sort: 'Newest first' })}
      />
    </BottomSheet>
  );
}
