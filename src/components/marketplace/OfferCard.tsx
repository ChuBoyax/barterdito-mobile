import { CalendarDays, Check, CheckCircle2, Clock, Info, MessageCircle, Star, X, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, IconButton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { Offer, OfferStatus } from '@/types/models';
import { firstName } from '@/utils/format';
import { OfferStatusBadge } from './StatusBadge';
import { SwapPreview } from './SwapPreview';

type OfferCardProps = {
  offer: Offer;
  busy?: boolean;
  onChat: () => void;
  onUpdate: (status: OfferStatus) => void;
  onMeetup: () => void;
  onReview: () => void;
  onOpenItem: (itemId: string) => void;
};

// One short line telling the user where this offer stands and what happens next.
function nextStep(offer: Offer): { icon: LucideIcon; text: string } {
  const first = firstName(offer.person);
  switch (offer.status) {
    case 'Pending':
      return offer.received
        ? { icon: Info, text: `Review the swap, then accept or decline. ${first} will be notified.` }
        : { icon: Clock, text: `Waiting for ${first} to respond.` };
    case 'Accepted':
      return { icon: CalendarDays, text: 'Offer accepted. Plan a safe meetup, then mark the trade as completed.' };
    case 'Declined':
      return { icon: Info, text: offer.received ? 'You declined this offer.' : `${first} declined this offer.` };
    case 'Completed':
      return { icon: CheckCircle2, text: 'Trade completed. Leave a review to help the community.' };
  }
}

export function OfferCard({ offer, busy, onChat, onUpdate, onMeetup, onReview, onOpenItem }: OfferCardProps) {
  const { colors } = useTheme();
  const pendingReceived = offer.received && offer.status === 'Pending';
  const step = nextStep(offer);
  const StepIcon = step.icon;
  const closed = offer.status === 'Declined';

  return (
    <Card style={[styles.card, closed && styles.closed]}>
      <View style={styles.head}>
        <Avatar initials={offer.initials} size="small" online={!closed} />
        <View style={styles.flex}>
          <AppText variant="h3">{offer.person}</AppText>
          <AppText variant="caption">
            {offer.received ? 'Sent you an offer' : 'You sent an offer'} · {offer.time}
          </AppText>
        </View>
        <OfferStatusBadge status={offer.status} />
      </View>

      <SwapPreview
        theirs={offer.theirs}
        yours={offer.yours}
        theirsLabel="You get"
        yoursLabel="You give"
        onPressTheirs={() => onOpenItem(offer.theirs.id)}
        onPressYours={() => onOpenItem(offer.yours.id)}
      />

      <View style={[styles.step, { backgroundColor: colors.surface2 }]}>
        <StepIcon size={14} color={colors.muted} strokeWidth={2.3} />
        <AppText variant="caption" style={styles.flex}>
          {step.text}
        </AppText>
      </View>

      {pendingReceived ? (
        <View style={styles.row}>
          <Button label="Decline" icon={X} variant="secondary" compact disabled={busy} style={styles.flex} onPress={() => onUpdate('Declined')} />
          <Button label="Accept" icon={Check} compact loading={busy} style={styles.flex} onPress={() => onUpdate('Accepted')} />
          <IconButton icon={MessageCircle} label={`Message ${offer.person}`} size={17} dimension={40} onPress={onChat} />
        </View>
      ) : null}

      {offer.status === 'Pending' && !offer.received ? (
        <Button label="Message" icon={MessageCircle} variant="secondary" compact onPress={onChat} />
      ) : null}

      {offer.status === 'Accepted' ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <Button label="Plan meetup" icon={CalendarDays} compact style={styles.flex} onPress={onMeetup} />
            <Button label="Message" icon={MessageCircle} variant="secondary" compact style={styles.flex} onPress={onChat} />
          </View>
          <Button label="Mark as completed" icon={CheckCircle2} variant="success" compact loading={busy} onPress={() => onUpdate('Completed')} />
        </View>
      ) : null}

      {offer.status === 'Completed' ? (
        <View style={styles.row}>
          <Button label="Leave a review" icon={Star} compact style={styles.flex} onPress={onReview} />
          <IconButton icon={MessageCircle} label={`Message ${offer.person}`} size={17} dimension={40} onPress={onChat} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  closed: { opacity: 0.7 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  flex: { flex: 1 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stack: { gap: 8 },
});
