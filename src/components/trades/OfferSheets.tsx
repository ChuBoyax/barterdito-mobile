import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Check, Package, RefreshCw, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BottomSheet, Button, SelectField, TextField } from '@/components/ui';
import { useTheme } from '@/providers';
import { ApiError, tradeService } from '@/services';
import type { OfferCloseKind, OfferListing, OfferReasonCode, TradeOffer } from '@/types/trades';
import { errorMessage } from '@/utils/format';
import { offerCloseLabels, offerReasonLabels } from '@/utils/trades';

const NO_REASON = 'No reason selected';
const reasonCodes = Object.keys(offerReasonLabels) as OfferReasonCode[];

/** A lost response may still have been saved: only these failures are worth checking before showing an error. */
const uncertain = (caught: unknown) => !(caught instanceof ApiError) || caught.status === undefined || caught.status >= 500;
const changed = (caught: unknown) => caught instanceof ApiError && caught.status === 409;

type AcceptOfferSheetProps = { id: string; onClose: () => void; onAccepted: (offer: TradeOffer) => void };

/** Shows the current details before accepting; the backend rejects the acceptance if they change meanwhile. */
export function AcceptOfferSheet({ id, onClose, onAccepted }: AcceptOfferSheetProps) {
  const [offer, setOffer] = useState<TradeOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setOffer(await tradeService.getOffer(id));
      setError('');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load the current item details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const issue = !offer
    ? ''
    : offer.status !== 'pending' || !offer.available
      ? 'This proposal can no longer be accepted.'
      : !offer.acceptReviewToken
        ? 'Reviewing is unavailable. Update the backend and try again.'
        : '';

  async function confirm() {
    if (!offer?.acceptReviewToken || busy) return;
    setBusy(true);
    setError('');
    try {
      onAccepted(await tradeService.accept(id, offer.acceptReviewToken));
    } catch (caught) {
      if (uncertain(caught)) {
        const current = await tradeService.getOffer(id).catch(() => null);
        if (current?.status === 'accepted') return onAccepted(current);
      }
      setError(changed(caught) ? 'This proposal changed. Review the latest details before accepting.' : errorMessage(caught, 'Could not accept this proposal. Please try again.'));
      setBusy(false);
      void refresh();
    }
  }

  return (
    <BottomSheet visible onClose={() => !busy && onClose()} eyebrow="Trade proposal" title="Review before accepting">
      {offer ? (
        <>
          <View style={styles.trader}>
            <Avatar initials={offer.proposer.initials} imageUrl={offer.proposer.avatarUrl} size="small" />
            <View>
              <AppText variant="caption">Trading with</AppText>
              <AppText variant="h3">{offer.proposer.fullName || 'Trader'}</AppText>
            </View>
          </View>
          <ReviewItem item={offer.offered} label="You receive" onOpen={onClose} />
          <ReviewItem item={offer.requested} label="You give" onOpen={onClose} />
        </>
      ) : loading ? (
        <AppText variant="small">Loading current item details…</AppText>
      ) : null}
      <AppText variant="h3">What happens when you accept</AppText>
      <AppText variant="small">• Both items become reserved for this trade. Other pending proposals involving either item become unavailable.</AppText>
      <AppText variant="small">• Arrange a public meetup in your trade chat. Inspect both items before you each confirm the exchange.</AppText>
      <AppText variant="small" color="ink" weight="semibold">
        Accepting does not complete the exchange.
      </AppText>
      {issue || error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error || issue}
        </AppText>
      ) : null}
      <Button label="Refresh review" icon={RefreshCw} variant="ghost" compact disabled={busy || loading} onPress={() => void refresh()} />
      <View style={styles.actions}>
        <Button label="Go back" variant="secondary" style={styles.flex} disabled={busy} onPress={onClose} />
        <Button label="Confirm" icon={Check} style={styles.flex} loading={busy} disabled={!offer || Boolean(issue) || loading} onPress={() => void confirm()} />
      </View>
    </BottomSheet>
  );
}

function ReviewItem({ item, label, onOpen }: { item: OfferListing; label: string; onOpen: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.item, { backgroundColor: colors.surface2 }]}>
      <View style={[styles.thumb, { backgroundColor: colors.background }]}>
        {item.imageUrl ? <Image source={item.imageUrl} style={styles.fill} contentFit="cover" /> : <Package size={22} color={colors.muted} />}
      </View>
      <View style={styles.flex}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="h3" numberOfLines={2}>
          {item.title}
        </AppText>
        {item.condition ? <AppText variant="caption">{item.condition.replaceAll('_', ' ')}</AppText> : null}
        {item.id ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View item details: ${item.title}`}
            hitSlop={6}
            onPress={() => {
              onOpen();
              router.push(`/items/${item.id}`);
            }}>
            <AppText variant="caption" color="orange" weight="bold">
              View item details
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="caption">Listing removed</AppText>
        )}
      </View>
    </View>
  );
}

type CloseOfferSheetProps = { id: string; userId: string; kind: OfferCloseKind; onClose: () => void; onResolved: (offer: TradeOffer) => void };

/** Decline, withdraw, or cancel, with an optional reason the other trader can read. */
export function CloseOfferSheet({ id, userId, kind, onClose, onResolved }: CloseOfferSheetProps) {
  const copy = offerCloseLabels[kind];
  const [label, setLabel] = useState(NO_REASON);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (busy) return;
    const reason = reasonCodes.find((code) => offerReasonLabels[code] === label) ?? null;
    setBusy(true);
    setError('');
    try {
      onResolved(await tradeService.close(id, kind, reason, note));
    } catch (caught) {
      if (uncertain(caught)) {
        const current = await tradeService.getOffer(id).catch(() => null);
        const saved = current?.resolution;
        if (current && saved && saved.actorId === userId && saved.action === kind && saved.reasonCode === reason && saved.reasonNote === note.trim()) return onResolved(current);
      }
      setError(changed(caught) ? 'This proposal changed. Close this and review the current offer.' : errorMessage(caught, 'Could not update this proposal. Please try again.'));
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible onClose={() => !busy && onClose()} eyebrow="Trade proposal" title={copy.title}>
      <AppText variant="small" color="ink">
        {copy.description}
      </AppText>
      <AppText variant="caption">You can leave a reason to help the other trader understand. Your reason and explanation will be visible to them.</AppText>
      <SelectField label="Reason (optional)" value={label} options={[NO_REASON, ...reasonCodes.map((code) => offerReasonLabels[code])]} onChange={setLabel} />
      <TextField label="Additional explanation (optional)" multiline value={note} onChangeText={setNote} maxLength={500} showCount placeholder="Add a short explanation, if you want." />
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Button label={copy.back} variant="secondary" style={styles.flex} disabled={busy} onPress={onClose} />
        <Button label={copy.confirm} icon={X} variant="danger" style={styles.flex} loading={busy} onPress={() => void confirm()} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  trader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
});
