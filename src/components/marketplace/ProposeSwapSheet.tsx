import { Image } from 'expo-image';
import { Check, MessageCircle, Plus, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, Button, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { Item } from '@/types/models';

type ProposeSwapSheetProps = {
  visible: boolean;
  onClose: () => void;
  target: Item;
  myItems: Item[];
  onPostItem: () => void;
  // `myItemId` is undefined when the user wants to discuss the offer instead of picking a listing.
  onSubmit: (myItemId: string | undefined) => Promise<void>;
};

const OPEN_OFFER = 'open-offer';

export function ProposeSwapSheet({ visible, onClose, target, myItems, onPostItem, onSubmit }: ProposeSwapSheetProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) setSelected(myItems.length ? myItems[0].id : OPEN_OFFER);
  }, [visible, myItems]);

  async function submit() {
    if (!selected) return;
    setSending(true);
    try {
      await onSubmit(selected === OPEN_OFFER ? undefined : selected);
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Propose a swap" title="What will you offer?">
      <AppText variant="small">
        {target.owner.split(' ')[0]} is looking for <AppText variant="small" color="ink" weight="bold">{target.wanted}</AppText>. Pick the item you
        want to trade for <AppText variant="small" color="ink" weight="bold">{target.title}</AppText>.
      </AppText>

      <View style={styles.list}>
        {myItems.map((item) => (
          <Option key={item.id} selected={selected === item.id} onPress={() => setSelected(item.id)} title={item.title} subtitle={item.condition} image={item.image} />
        ))}
        <Option
          selected={selected === OPEN_OFFER}
          onPress={() => setSelected(OPEN_OFFER)}
          title="Discuss an offer"
          subtitle="Start the conversation and agree on the swap together"
          icon={MessageCircle}
        />
      </View>

      {!myItems.length ? (
        <Button label="Post an item to offer" icon={Plus} variant="secondary" onPress={onPostItem} />
      ) : null}
      <Button label="Send proposal" loading={sending} disabled={!selected} onPress={() => void submit()} />
    </BottomSheet>
  );
}

type OptionProps = {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle: string;
  image?: Item['image'];
  icon?: LucideIcon;
};

function Option({ selected, onPress, title, subtitle, image, icon: Icon }: OptionProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.option, { backgroundColor: selected ? colors.orangeSoft : colors.surface, borderColor: selected ? colors.orange : colors.hairline }]}>
      {image ? (
        <Image source={image} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.iconThumb, { backgroundColor: colors.surface2 }]}>
          {Icon ? <Icon size={20} color={colors.ink} strokeWidth={2.2} /> : null}
        </View>
      )}
      <View style={styles.flex}>
        <AppText variant="h3" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.orange : colors.muted2, backgroundColor: selected ? colors.orange : 'transparent' }]}>
        {selected ? <Check size={13} color={colors.onPrimary} strokeWidth={3} /> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  list: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 18, padding: 10 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  iconThumb: { alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
