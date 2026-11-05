import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeftRight, Check, CircleAlert, CircleCheck, Clock, Info, MessageCircle, Package, X } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Badge, Button, PressableScale, type BadgeTone } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';
import type { OfferAction, OfferListing, TradeOffer } from '@/types/trades';
import { firstName } from '@/utils/format';
import { offerActionLink, offerDate, offerProgress, type OfferProgressTone } from '@/utils/trades';
import { OfferResolutionNote, OfferTradeProgress } from './OfferDetails';

type TradeOfferCardProps = {
  offer: TradeOffer;
  userId: string;
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

const progressIcons: Record<OfferProgressTone, typeof Clock> = { waiting: Clock, accepted: Info, completed: CircleCheck, closed: Info, problem: CircleAlert };

export const TradeOfferCard = memo(function TradeOfferCard({ offer, userId, onRespond }: TradeOfferCardProps) {
  const { colors } = useTheme();
  const received = offer.recipient.id === userId;
  const other = received ? offer.proposer : offer.recipient;
  const first = firstName(other.fullName) || 'Trader';
  const completed = offer.tradeStatus === 'completed';
  const progress = offerProgress(offer, received, first);
  const ProgressIcon = progressIcons[progress.tone];
  const nextStepIsChat = offer.status === 'accepted' && !completed && offer.tradeStatus !== 'cancelled';
  const actionLink = offerActionLink(offer);
  const chat = offer.status === 'accepted' || offer.conversationStarted;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={styles.head}>
        <PressableScale accessibilityRole="button" accessibilityLabel={`View ${other.fullName}'s profile`} onPress={() => router.push(`/traders/${other.id}`)} scaleTo={0.96} style={styles.person}>
          <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="xsmall" />
          <View style={styles.flex}>
            <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
              {other.fullName || 'Trader'}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {offerDate(offer.createdAt)}
            </AppText>
          </View>
        </PressableScale>
        <Badge label={completed ? 'Completed' : labels[offer.status]} tone={completed ? 'blue' : tones[offer.status]} />
      </View>

      <View style={styles.status}>
        <ProgressIcon size={14} color={colors.muted} />
        <AppText variant="caption" numberOfLines={progress.text.length > ONE_LINE_STATUS ? 2 : 1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.flex}>
          {progress.text}
        </AppText>
      </View>

      <View style={styles.exchange}>
        <OfferItem item={received ? offer.offered : offer.requested} label="You get" />
        <View style={[styles.swap, { backgroundColor: colors.surface2 }]}>
          <ArrowLeftRight size={13} color={colors.orangeDark} />
        </View>
        <OfferItem item={received ? offer.requested : offer.offered} label="You give" />
      </View>

      {offer.message ? (
        <View style={styles.message}>
          <AppText variant="caption" weight="bold">
            {received ? `Message from ${first}` : 'Your message'}
          </AppText>
          <AppText variant="small" color="ink">
            {offer.message}
          </AppText>
        </View>
      ) : null}

      <OfferResolutionNote offer={offer} userId={userId} />
      <OfferTradeProgress offer={offer} userId={userId} />

      {offer.status === 'pending' && received ? (
        <View style={styles.actions}>
          <Button label="Accept" icon={Check} singleLine disabled={!offer.available} style={styles.action} onPress={() => onRespond('accept')} />
          <Button label="Decline" icon={X} variant="secondary" singleLine style={styles.action} onPress={() => onRespond('decline')} />
        </View>
      ) : null}
      {offer.status === 'pending' && !received ? <Button label="Withdraw proposal" icon={X} variant="secondary" onPress={() => onRespond('cancel')} /> : null}
      {actionLink || chat ? (
        <View style={styles.actions}>
          {actionLink ? <Button label={actionLink.label} icon={CircleCheck} singleLine style={styles.action} onPress={() => router.push(actionLink.href)} /> : null}
          {chat ? (
            <Button
              label="Open trade chat"
              icon={MessageCircle}
              variant={nextStepIsChat && !actionLink ? 'primary' : 'secondary'}
              singleLine
              style={styles.action}
              onPress={() => router.push(`/messages/${offer.id}`)}
            />
          ) : null}
        </View>
      ) : null}
      {nextStepIsChat ? (
        <Pressable accessibilityRole="button" hitSlop={4} onPress={() => onRespond('cancel')} style={styles.quiet}>
          <AppText variant="caption" weight="bold">
            Cancel accepted trade
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
});

function OfferItem({ item, label }: { item: OfferListing; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.item}>
      <AppText variant="caption" weight="medium">
        {label}
      </AppText>
      <Pressable
        accessibilityRole={item.id ? 'link' : undefined}
        accessibilityLabel={`${label}: ${item.title}`}
        disabled={!item.id}
        onPress={() => router.push(`/items/${item.id}`)}
        style={styles.itemLink}>
        <View style={[styles.thumb, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
          {item.imageUrl ? <Image source={item.imageUrl} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={18} color={colors.muted} />}
        </View>
        <AppText variant="small" color="ink" weight="semibold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.flex}>
          {item.title}
        </AppText>
      </Pressable>
      {!item.id ? (
        <AppText variant="caption" color="red">
          Listing removed
        </AppText>
      ) : null}
    </View>
  );
}

const THUMB = 48;
/** Longer status copy would shrink past reading size on one line, so it keeps a second line instead of being cut off. */
const ONE_LINE_STATUS = 64;

const styles = StyleSheet.create({
  card: { gap: 10, borderRadius: 20, padding: 12 },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  person: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exchange: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  item: { flex: 1, minWidth: 0, gap: 4 },
  itemLink: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: THUMB },
  thumb: { width: THUMB, height: THUMB, borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  swap: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  message: { gap: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  // Tighter than a regular button, so two fit side by side with their labels on one line.
  action: { flex: 1, minWidth: 0, gap: 6, paddingHorizontal: 10 },
  quiet: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
