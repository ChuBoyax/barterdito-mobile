import { Globe, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, BottomSheet, Button, SegmentedControl, SelectField } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { NEARBY_RADIUS_KM } from '@/services/itemService';
import { fonts, maxFontScale } from '@/theme';
import type { ItemFilters, Place } from '@/types/models';
import { PlaceSearch } from './PlaceSearch';

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  filters: ItemFilters;
  conditions: string[];
  onChange: (next: Partial<ItemFilters>) => void;
  area: Place | null;
  profileArea: Place | null;
  onAreaChange: (place: Place | null) => void;
};

export const sortOptions: ItemFilters['sort'][] = ['Nearest first', 'Newest first', 'Most hearts', 'Most viewed'];

type Scope = 'all' | 'profile' | 'other';

export function FilterSheet({ visible, onClose, filters, conditions, onChange, area, profileArea, onAreaChange }: FilterSheetProps) {
  const { colors } = useTheme();
  // "Other place" stays selected while the user is still choosing one.
  const [choosing, setChoosing] = useState(false);
  useEffect(() => {
    if (!visible) setChoosing(false);
  }, [visible]);
  const scope: Scope = choosing ? 'other' : !area ? 'all' : profileArea && area.id === profileArea.id ? 'profile' : 'other';

  function chooseScope(next: Scope) {
    setChoosing(next === 'other');
    // "Other place" stays open so a place can be picked; everything else applies and closes right away.
    if (next === 'other') return;
    onAreaChange(next === 'all' ? null : profileArea);
    onClose();
  }

  return (
    <BottomSheet visible={visible} flat onClose={onClose} eyebrow="Refine" title="Filters">
      <SelectField
        flat
        label="Condition"
        value={filters.condition}
        options={['Any condition', ...conditions]}
        onChange={(condition) => {
          onChange({ condition });
          onClose();
        }}
      />
      <SelectField
        flat
        label="Sort by"
        value={filters.sort}
        options={sortOptions}
        onChange={(sort) => {
          onChange({ sort: sort as ItemFilters['sort'] });
          onClose();
        }}
      />
      <View style={styles.location}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>Location</Text>
        <SegmentedControl<Scope>
          flat
          value={scope}
          onChange={chooseScope}
          segments={[
            { value: 'all', label: 'Anywhere' },
            ...(profileArea ? [{ value: 'profile' as const, label: 'My area' }] : []),
            { value: 'other', label: 'Other place' },
          ]}
        />
        {scope === 'all' ? (
          <Hint icon={Globe} text="Showing items from every location." />
        ) : scope === 'profile' && area ? (
          <Hint icon={MapPin} text={`Within ${NEARBY_RADIUS_KM} km of ${area.label}`} />
        ) : area && !choosing ? (
          <View style={[styles.picked, { backgroundColor: colors.orangeSoft }]}>
            <MapPin size={17} color={colors.orange} />
            <AppText variant="small" color="ink" weight="semibold" numberOfLines={2} style={styles.flex}>
              {`Within ${NEARBY_RADIUS_KM} km of ${area.label}`}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => setChoosing(true)} hitSlop={8}>
              <AppText variant="caption" color="orange" weight="bold">
                Change
              </AppText>
            </Pressable>
          </View>
        ) : (
          <PlaceSearch
            flat
            onSelect={(place) => {
              setChoosing(false);
              onAreaChange(place);
              onClose();
            }}
          />
        )}
      </View>
      <Button
        label="Clear filters"
        variant="ghost"
        onPress={() => {
          setChoosing(false);
          onChange({ condition: 'Any condition', sort: 'Nearest first' });
          onAreaChange(profileArea);
          onClose();
        }}
      />
    </BottomSheet>
  );
}

function Hint({ icon: Icon, text }: { icon: typeof Globe; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.hint}>
      <Icon size={14} color={colors.muted} />
      <AppText variant="caption" numberOfLines={2} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  location: { gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12 },
});
