import { router } from 'expo-router';
import { Ban, Check, CircleAlert, MessageCircle, Quote, Undo2, X } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Badge, Button, Card, PressableScale, type BadgeTone } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';
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

const steps = ['Proposed', 'Accepted', 'Completed'] as const;
const DOT = 20;

function note(offer: TradeOffer, received: boolean, first: string): string | null {
  if (offer.status === 'unavailable') return 'An item was removed, is no longer active, or was reserved for another proposal.';
  if (offer.status === 'pending' && !offer.available) return 'These items are no longer both available for acceptance.';
  if (offer.status === 'pending') return received ? `Review ${first}'s offer, then accept or decline.` : `Waiting for ${first} to respond.`;
  if (offer.status === 'accepted') {
    return offer.tradeStatus === 'completed'
      ? 'Both traders confirmed the exchange.'
      : 'Arrange your meetup and confirm the exchange in your trade chat.';
  }
  return null;
}

export const TradeOfferCard = memo(function TradeOfferCard({ offer, userId, busy, disabled, onRespond }: TradeOfferCardProps) {
  const { colors } = useTheme();
  const received = offer.recipient.id === userId;
  const other = received ? offer.proposer : offer.recipient;
  const first = firstName(other.fullName) || 'Trader';
  const completed = offer.tradeStatus === 'completed';
  const closed = offer.status === 'declined' || offer.status === 'cancelled' || offer.status === 'unavailable';
  const hint = note(offer, received, first);
  const reached = completed ? 2 : offer.status === 'accepted' ? 1 : 0;

  return (
    <Card style={[styles.card, closed && styles.closed]}>
      <View style={styles.head}>
        <PressableScale onPress={() => router.push(`/traders/${other.id}`)} scaleTo={0.96} style={styles.person}>
          <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
          <View style={styles.flex}>
            <AppText variant="h3" numberOfLines={1}>
              {other.fullName}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {received ? 'Sent you a proposal' : 'You sent a proposal'} · {offerDate(offer.createdAt)}
            </AppText>
          </View>
        </PressableScale>
        <Badge label={completed ? 'Completed' : labels[offer.status]} tone={completed ? 'blue' : tones[offer.status]} dot />
      </View>

      {closed ? null : <Progress reached={reached} />}

      <TradePair
        left={{ item: received ? offer.offered : offer.requested, label: 'You get' }}
        right={{ item: received ? offer.requested : offer.offered, label: 'You give' }}
      />

      {offer.message ? (
        <View style={[styles.message, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
          <Quote size={14} color={colors.orange} fill={colors.orange} />
          <AppText variant="small" color="ink" style={styles.flex}>
            {offer.message}
          </AppText>
        </View>
      ) : null}

      {hint ? (
        <View style={styles.hint}>
          {closed ? <Ban size={14} color={colors.muted} /> : <CircleAlert size={14} color={colors.orange} />}
          <AppText variant="caption" style={styles.flex}>
            {hint}
          </AppText>
        </View>
      ) : null}

      {offer.status === 'pending' && received ? (
        <View style={styles.actions}>
          <Button label="Decline" icon={X} variant="secondary" disabled={disabled} style={styles.flex} onPress={() => onRespond('decline')} />
          <Button label="Accept" icon={Check} loading={busy} disabled={disabled || !offer.available} style={styles.grow} onPress={() => onRespond('accept')} />
        </View>
      ) : null}

      {offer.status === 'pending' && !received ? (
        <Button label="Withdraw proposal" icon={Undo2} variant="secondary" loading={busy} disabled={disabled} onPress={() => onRespond('cancel')} />
      ) : null}

      {offer.status === 'accepted' || offer.conversationStarted ? (
        <View style={styles.actions}>
          <Button label="Open trade chat" icon={MessageCircle} style={styles.grow} onPress={() => router.push(`/messages/${offer.id}`)} />
          {offer.status === 'accepted' && !completed ? (
            <Button label="Cancel" variant="danger" loading={busy} disabled={disabled} style={styles.flex} onPress={() => onRespond('cancel')} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
});

/** Where this proposal is in the trade flow: proposed → accepted → completed. */
function Progress({ reached }: { reached: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
      <View style={styles.rail}>
        {steps.slice(1).map((step, index) => (
          <View key={step} style={[styles.line, { backgroundColor: index < reached ? colors.orange : colors.line }]} />
        ))}
      </View>
      {steps.map((step, index) => {
        const done = index <= reached;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, done ? { backgroundColor: colors.orange } : [{ backgroundColor: colors.surface }, neu(colors, 1)]]}>
              {done ? <Check size={11} color={colors.onPrimary} strokeWidth={3.4} /> : null}
            </View>
            <AppText variant="caption" color={done ? 'ink' : 'muted'} weight={done ? 'bold' : 'medium'} numberOfLines={1}>
              {step}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: 16 },
  closed: { opacity: 0.72 },
  flex: { flex: 1 },
  grow: { flex: 1.6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flexDirection: 'row', borderRadius: 18, paddingHorizontal: 6, paddingVertical: 10 },
  // Runs dot-center to dot-center behind the three equal columns.
  rail: { position: 'absolute', top: 10 + DOT / 2 - 1, left: '16.6%', right: '16.6%', flexDirection: 'row', gap: DOT + 8 },
  step: { flex: 1, alignItems: 'center', gap: 5 },
  line: { flex: 1, height: 2, borderRadius: 1 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
