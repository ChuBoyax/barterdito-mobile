import { router } from 'expo-router';
import { Check, Info, MessageCircle, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Badge, Button, Card, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { BadgeTone } from '@/components/ui';
import type { OfferAction, TradeOffer } from '@/types/trades';
import { firstName } from '@/utils/format';
import { offerDate } from '@/utils/trades';
import { TradePair } from './TradePair';

type TradeOfferCardProps = {
  offer: TradeOffer;
  userId: string;
  busy?: boolean;
  disabled?: boolean;
  onRespond: (action: OfferAction) => void;
};

const labels: Record<TradeOffer['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  cancelled: 'Cancelled',
  unavailable: 'Unavailable',
};

const tones: Record<TradeOffer['status'], BadgeTone> = {
  pending: 'orange',
  accepted: 'green',
  declined: 'neutral',
  cancelled: 'neutral',
  unavailable: 'red',
};

function note(offer: TradeOffer): string | null {
  if (offer.status === 'unavailable') return 'An item was removed, is no longer active, or was reserved for another proposal.';
  if (offer.status === 'pending' && !offer.available) return 'These items are no longer both available for acceptance.';
  if (offer.status === 'accepted') {
    return offer.tradeStatus === 'completed'
      ? 'Both traders confirmed the exchange.'
      : 'Arrange your meetup and confirm the exchange in your trade chat.';
  }
  return null;
}

export function TradeOfferCard({ offer, userId, busy, disabled, onRespond }: TradeOfferCardProps) {
  const { colors } = useTheme();
  const received = offer.recipient.id === userId;
  const other = received ? offer.proposer : offer.recipient;
  const first = firstName(other.fullName) || 'Trader';
  const completed = offer.tradeStatus === 'completed';
  const hint = note(offer);
  const closed = ['declined', 'cancelled', 'unavailable'].includes(offer.status);

  return (
    <Card style={[styles.card, closed && styles.closed]}>
      <PressableScale onPress={() => router.push(`/traders/${other.id}`)} scaleTo={0.98} style={styles.head}>
        <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
        <View style={styles.flex}>
          <AppText variant="h3" numberOfLines={1}>
            {other.fullName}
          </AppText>
          <AppText variant="caption">
            {received ? 'Sent you a proposal' : 'You sent a proposal'} · {offerDate(offer.createdAt)}
          </AppText>
        </View>
        <Badge label={completed ? 'Completed' : labels[offer.status]} tone={completed ? 'blue' : tones[offer.status]} dot />
      </PressableScale>

      <TradePair
        left={{ item: received ? offer.offered : offer.requested, label: received ? `${first} offers` : `${first}'s item` }}
        right={{ item: received ? offer.requested : offer.offered, label: 'You offer' }}
      />

      {offer.message ? (
        <View style={[styles.message, { backgroundColor: colors.surface2 }]}>
          <AppText variant="small" color="ink">
            “{offer.message}”
          </AppText>
        </View>
      ) : null}

      {hint ? (
        <View style={styles.note}>
          <Info size={14} color={colors.muted} />
          <AppText variant="caption" style={styles.flex}>
            {hint}
          </AppText>
        </View>
      ) : null}

      {offer.status === 'pending' && received ? (
        <View style={styles.row}>
          <Button label="Decline" icon={X} variant="secondary" compact disabled={disabled} style={styles.flex} onPress={() => onRespond('decline')} />
          <Button
            label="Accept"
            icon={Check}
            compact
            loading={busy}
            disabled={disabled || !offer.available}
            style={styles.flex}
            onPress={() => onRespond('accept')}
          />
        </View>
      ) : null}

      {offer.status === 'pending' && !received ? (
        <Button label="Withdraw proposal" icon={X} variant="secondary" compact loading={busy} disabled={disabled} onPress={() => onRespond('cancel')} />
      ) : null}

      {offer.status === 'accepted' || offer.conversationStarted ? (
        <View style={styles.row}>
          <Button label="Open trade chat" icon={MessageCircle} compact style={styles.flex} onPress={() => router.push(`/messages/${offer.id}`)} />
          {offer.status === 'accepted' && !completed ? (
            <Button label="Cancel trade" variant="secondary" compact loading={busy} disabled={disabled} style={styles.flex} onPress={() => onRespond('cancel')} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  closed: { opacity: 0.75 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  flex: { flex: 1 },
  message: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
