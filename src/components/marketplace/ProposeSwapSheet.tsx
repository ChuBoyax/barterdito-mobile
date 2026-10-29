import { Image } from 'expo-image';
import { ArrowRight, Check, CheckCircle2, Package, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, Button, PressableScale, TextField } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers/ThemeProvider';
import { itemService } from '@/services';
import type { Item } from '@/types/models';
import { errorMessage, firstName } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

type ProposeSwapSheetProps = {
  visible: boolean;
  onClose: () => void;
  target: Item;
  onPostItem: () => void;
  onViewOffers: () => void;
  onSubmit: (offeredListingId: string, message: string) => Promise<void>;
};

/** One of your active listings for theirs, with an optional note — same as the website's dialog. */
export function ProposeSwapSheet({ visible, onClose, target, onPostItem, onViewOffers, onSubmit }: ProposeSwapSheetProps) {
  const { colors } = useTheme();
  const { data: mine = [], loading, error, reload } = useAsync(queryKeys.myItems, () => itemService.getMyItems());
  const options = mine.filter((item) => item.status === 'Active' && item.id !== target.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setMessage('');
    setSendError('');
    setSent(false);
    void reload();
    // Reload my listings each time the sheet opens so statuses are current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const choice = options.find((item) => item.id === selected);

  async function submit() {
    if (!choice || sending) return setSendError('Choose one of your active items to offer.');
    setSending(true);
    setSendError('');
    try {
      await onSubmit(choice.id, message);
      setSent(true);
    } catch (caught) {
      setSendError(errorMessage(caught, 'Could not send your proposal. Please try again.'));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <BottomSheet visible={visible} onClose={onClose} eyebrow="One item for another" title="Trade proposal sent">
        <View style={styles.success}>
          <CheckCircle2 size={44} color={colors.green} />
          <AppText variant="h3" align="center">
            Your offer is on its way to {firstName(target.owner)}.
          </AppText>
          <AppText variant="small" align="center">
            Your items stay available until a proposal is accepted. You can follow the status or withdraw it in Sent offers.
          </AppText>
        </View>
        <Button label="View sent offers" onPress={onViewOffers} />
        <Button label="Keep browsing" variant="secondary" onPress={onClose} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="One item for another" title="Propose a trade">
      <AppText variant="small">
        You are requesting <AppText variant="small" color="ink" weight="bold">{target.title}</AppText> from {target.owner}. {firstName(target.owner)} is looking for{' '}
        <AppText variant="small" color="ink" weight="bold">{target.wanted}</AppText>.
      </AppText>

      <AppText variant="h3">Choose the item you will offer</AppText>
      {loading && !mine.length ? <AppText variant="caption">Loading your active items…</AppText> : null}
      {error ? (
        <View style={styles.row}>
          <AppText variant="caption" color="red" style={styles.flex}>
            {error}
          </AppText>
          <Button label="Try again" variant="secondary" compact onPress={() => void reload()} />
        </View>
      ) : null}
      {!loading && !error && !options.length ? (
        <View style={styles.empty}>
          <Package size={26} color={colors.muted} />
          <AppText variant="small" align="center">
            You need an active listing before proposing a trade.
          </AppText>
          <Button label="Add an item" icon={Plus} variant="secondary" onPress={onPostItem} />
        </View>
      ) : null}
      <View style={styles.list}>
        {options.map((item) => (
          <Option key={item.id} item={item} selected={selected === item.id} onPress={() => setSelected(item.id)} />
        ))}
      </View>

      <TextField
        label={`Message (optional · ${message.length}/1000)`}
        multiline
        value={message}
        onChangeText={setMessage}
        maxLength={1000}
        placeholder="Tell the owner why this would be a good swap…"
      />
      {choice ? (
        <View style={styles.row}>
          <AppText variant="caption" color="ink" weight="bold" numberOfLines={1} style={styles.shrink}>
            {choice.title}
          </AppText>
          <ArrowRight size={14} color={colors.muted} />
          <AppText variant="caption" color="ink" weight="bold" numberOfLines={1} style={styles.shrink}>
            {target.title}
          </AppText>
        </View>
      ) : null}
      <AppText variant="caption">Sending a proposal does not transfer ownership or reserve either item. The owner must accept it first.</AppText>
      {sendError ? (
        <AppText variant="small" color="red" weight="semibold">
          {sendError}
        </AppText>
      ) : null}
      <Button label="Send proposal" loading={sending} disabled={!choice} onPress={() => void submit()} />
    </BottomSheet>
  );
}

function Option({ item, selected, onPress }: { item: Item; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={item.title}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.option, { backgroundColor: selected ? colors.orangeSoft : colors.surface, borderColor: selected ? colors.orange : colors.hairline }]}>
      <Image source={item.image} cachePolicy="memory-disk" style={styles.thumb} contentFit="cover" />
      <View style={styles.flex}>
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {item.condition} · {item.location}
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
  shrink: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { gap: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  success: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 18, padding: 10 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
