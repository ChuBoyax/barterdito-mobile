import { CalendarDays, CircleAlert, CircleCheck, Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';
import type { TradeOffer } from '@/types/trades';
import { firstName } from '@/utils/format';
import { meetupDate, offerDate, offerReasonLabels } from '@/utils/trades';

const closeVerbs = { decline: 'Declined', withdraw: 'Withdrawn', cancel: 'Cancelled' } as const;

/** The optional reason shared when a proposal closed. */
export function OfferResolutionNote({ offer, userId }: { offer: TradeOffer; userId: string }) {
  const { colors } = useTheme();
  const saved = offer.resolution;
  if (!saved || (!saved.reasonCode && !saved.reasonNote)) return null;
  const actor = saved.actorId === userId ? 'you' : saved.actorId === offer.proposer.id ? offer.proposer.fullName : offer.recipient.fullName;
  return (
    <View style={[styles.box, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
      <AppText variant="caption">
        {closeVerbs[saved.action]} by {actor} · {offerDate(saved.createdAt)}
      </AppText>
      {saved.reasonCode ? <AppText variant="h3">{offerReasonLabels[saved.reasonCode]}</AppText> : null}
      {saved.reasonNote ? (
        <AppText variant="small" color="ink">
          {saved.reasonNote}
        </AppText>
      ) : null}
    </View>
  );
}

/** Where an accepted trade stands. Older meetup records stay visible; new trades arrange details in chat. */
export function OfferTradeProgress({ offer, userId }: { offer: TradeOffer; userId: string }) {
  const { colors } = useTheme();
  if (offer.status !== 'accepted' || offer.tradeStatus === 'cancelled') return null;
  const progress = offer.progress;
  if (!progress) return <AppText variant="caption">Trade progress is temporarily unavailable. Open trade chat for the latest details.</AppText>;
  const meetup = progress.agreedMeetup ?? progress.pendingMeetup;
  const parties = [
    { person: offer.proposer, at: progress.proposerConfirmedAt },
    { person: offer.recipient, at: progress.recipientConfirmedAt },
  ].sort((a, b) => Number(b.person.id === userId) - Number(a.person.id === userId));
  return (
    <View style={[styles.box, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
      <AppText variant="h3">Trade progress</AppText>
      <View style={styles.row}>
        <CalendarDays size={14} color={colors.orange} />
        <View style={styles.flex}>
          {meetup ? (
            <>
              <AppText variant="small" color="ink" weight="semibold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {progress.agreedMeetup ? 'Meetup agreed' : 'Meetup proposed'} · {meetupDate(meetup.startsAt)}
              </AppText>
              <AppText variant="caption">{meetup.location}</AppText>
            </>
          ) : (
            <AppText variant="small" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              Agree on the details in your trade chat.
            </AppText>
          )}
        </View>
      </View>
      {parties.map(({ person, at }) => (
        <View key={person.id} style={styles.row}>
          {at ? <CircleCheck size={14} color={colors.green} /> : <Clock size={14} color={colors.muted} />}
          <AppText variant="small" color="ink" numberOfLines={1} style={styles.flex}>
            {person.id === userId ? 'You' : firstName(person.fullName) || 'Other trader'}
          </AppText>
          <AppText variant="caption" color={at ? 'green' : 'muted'} weight="semibold">
            {at ? 'Confirmed' : 'Not confirmed'}
          </AppText>
        </View>
      ))}
      {progress.openIssueCount > 0 ? (
        <View style={styles.row}>
          <CircleAlert size={14} color={colors.orange} />
          <AppText variant="small" color="orange" weight="semibold">
            {progress.openIssueCount} unresolved {progress.openIssueCount === 1 ? 'problem' : 'problems'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  box: { gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
