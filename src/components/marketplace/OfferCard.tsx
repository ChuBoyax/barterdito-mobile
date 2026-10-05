import { CalendarDays, Check, CheckCircle2, MessageCircle, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Badge, Button, Card } from '@/components/ui';
import type { Offer, OfferStatus } from '@/types/models';
import { SwapPreview } from './SwapPreview';

type OfferCardProps = {
  offer: Offer;
  onChat: () => void;
  onUpdate: (status: OfferStatus) => void;
  onMeetup: () => void;
};

const statusTone = { Pending: 'orange', Accepted: 'green', Declined: 'red', Completed: 'blue' } as const;

export function OfferCard({ offer, onChat, onUpdate, onMeetup }: OfferCardProps) {
  const pendingReceived = offer.received && offer.status === 'Pending';
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Avatar initials={offer.initials} size="small" online />
        <View style={styles.flex}>
          <AppText variant="h3">{offer.person}</AppText>
          <AppText variant="caption">
            {offer.received ? 'Sent you an offer' : 'You sent an offer'} · {offer.time}
          </AppText>
        </View>
        <Badge label={offer.status} tone={statusTone[offer.status]} dot />
      </View>
      <SwapPreview theirs={offer.theirs} yours={offer.yours} />
      <View style={styles.actions}>
        {pendingReceived ? (
          <>
            <Button label="Accept" icon={Check} compact style={styles.flex} onPress={() => onUpdate('Accepted')} />
            <Button label="Decline" icon={X} variant="danger" compact style={styles.flex} onPress={() => onUpdate('Declined')} />
          </>
        ) : null}
        {offer.status === 'Accepted' ? (
          <Button label="Mark completed" icon={CheckCircle2} variant="success" compact style={styles.flex} onPress={() => onUpdate('Completed')} />
        ) : null}
        {!offer.received && offer.status !== 'Completed' ? (
          <Button label="Meetup" icon={CalendarDays} variant="secondary" compact style={styles.flex} onPress={onMeetup} />
        ) : null}
        <Button label="Chat" icon={MessageCircle} variant="secondary" compact style={pendingReceived ? undefined : styles.flex} onPress={onChat} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
});
