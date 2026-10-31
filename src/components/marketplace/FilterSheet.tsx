import { Globe, LocateFixed, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, BottomSheet, Button, SelectField } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { NEARBY_RADIUS_KM } from '@/services/itemService';
import { fonts, maxFontScale, neu } from '@/theme';
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

export function FilterSheet({ visible, onClose, filters, conditions, onChange, area, profileArea, onAreaChange }: FilterSheetProps) {
  const { colors } = useTheme();
  const nearProfile = Boolean(area && profileArea && area.id === profileArea.id);
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
        options={sortOptions}
        onChange={(sort) => onChange({ sort: sort as ItemFilters['sort'] })}
      />
      <View style={styles.location}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>Location</Text>
        <View style={[styles.current, { backgroundColor: colors.background }, neu(colors, 2, true)]}>
          {area ? <MapPin size={17} color={colors.orange} /> : <Globe size={17} color={colors.muted} />}
          <AppText variant="small" color="ink" weight="semibold" numberOfLines={2} style={styles.flex}>
            {area ? `Within ${NEARBY_RADIUS_KM} km of ${area.label}` : 'All locations'}
          </AppText>
        </View>
        <PlaceSearch onSelect={onAreaChange} />
        <View style={styles.choices}>
          {area ? <Choice icon={Globe} label="Any location" onPress={() => onAreaChange(null)} /> : null}
          {profileArea && !nearProfile ? <Choice icon={LocateFixed} label="Near my profile location" onPress={() => onAreaChange(profileArea)} /> : null}
        </View>
      </View>
      <Button label="Show results" onPress={onClose} />
      <Button
        label="Clear filters"
        variant="ghost"
        onPress={() => {
          onChange({ condition: 'Any condition', sort: 'Nearest first' });
          onAreaChange(profileArea);
        }}
      />
    </BottomSheet>
  );
}

function Choice({ icon: Icon, label, onPress }: { icon: typeof Globe; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={[styles.choice, { backgroundColor: colors.orangeSoft }]}>
      <Icon size={14} color={colors.orange} />
      <AppText variant="caption" color="orange" weight="bold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  location: { gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
