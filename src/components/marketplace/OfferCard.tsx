import { CalendarDays, Check, CheckCircle2, MessageCircle } from 'lucide-react-native';
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
        <Avatar initials={offer.initials} size="small" />
        <View style={styles.flex}>
          <AppText variant="h3">{offer.person}</AppText>
          <AppText variant="caption">{offer.time}</AppText>
        </View>
        <Badge label={offer.status} tone={statusTone[offer.status]} />
      </View>
      <SwapPreview theirs={offer.theirs} yours={offer.yours} />
      <View style={styles.actions}>
        <Button label="View chat" icon={MessageCircle} variant="secondary" compact onPress={onChat} />
        {pendingReceived ? <Button label="Accept" icon={Check} compact onPress={() => onUpdate('Accepted')} /> : null}
        {pendingReceived ? (
          <Button label="Decline" variant="ghost" compact onPress={() => onUpdate('Declined')} />
        ) : null}
        {offer.status === 'Accepted' ? (
          <Button label="Mark completed" icon={CheckCircle2} compact onPress={() => onUpdate('Completed')} />
        ) : null}
        {!offer.received && offer.status !== 'Completed' ? (
          <Button label="Schedule meetup" icon={CalendarDays} variant="secondary" compact onPress={onMeetup} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
