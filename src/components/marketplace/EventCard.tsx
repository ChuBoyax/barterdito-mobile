import { Check, Clock3, MapPin, Sparkles, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, Button } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { avatarPalette, fonts, maxFontScale, neu } from '@/theme';
import type { TradeEvent } from '@/types/models';

type EventCardProps = { event: TradeEvent; going: boolean; onRsvp: () => void; variant?: 'featured' | 'compact'; last?: boolean };

const attendees = ['MS', 'PR', 'BM'];

/** "Aug 02 · 10:00 AM–4:00 PM" → "10:00 AM–4:00 PM". */
function timeOf(event: TradeEvent) {
  return event.date.split('·').pop()?.trim() || event.date;
}

export function EventCard({ variant = 'compact', ...props }: EventCardProps) {
  return variant === 'featured' ? <FeaturedEvent {...props} /> : <CompactEvent {...props} />;
}

function FeaturedEvent({ event, going, onRsvp }: EventCardProps) {
  const { colors } = useTheme();
  const count = event.attending + (going ? 1 : 0);
  return (
    <View style={[styles.featured, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <View style={[styles.banner, { backgroundColor: event.color }]}>
        <View style={[styles.orb, styles.orbLarge]} />
        <View style={[styles.orb, styles.orbSmall]} />
        <Users size={120} color={colors.onPhoto} strokeWidth={1.2} style={styles.bannerArt} />
        <View style={styles.bannerTop}>
          <View style={styles.nextUp}>
            <Sparkles size={12} color={colors.onPhoto} />
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.nextUpText, { color: colors.onPhoto }]}>NEXT UP</Text>
          </View>
          <DateTile event={event} size="large" />
        </View>
        <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={2} style={[styles.bannerTitle, { color: colors.onPhoto }]}>
          {event.title}
        </Text>
      </View>
      <View style={styles.featuredBody}>
        <View style={styles.facts}>
          <Fact icon={Clock3} text={timeOf(event)} />
          <Fact icon={MapPin} text={event.location} />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <View style={styles.footer}>
          <Attendees count={count} />
          <RsvpButton going={going} onPress={onRsvp} />
        </View>
      </View>
    </View>
  );
}

function CompactEvent({ event, going, onRsvp, last }: EventCardProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.timelineRow}>
      <View style={styles.rail}>
        <DateTile event={event} />
        {last ? null : <View style={[styles.railLine, { backgroundColor: colors.line }]} />}
      </View>
      <View style={[styles.compact, { backgroundColor: colors.surface }, neu(colors, 2)]}>
        <View style={[styles.accent, { backgroundColor: event.color }]} />
        <AppText variant="h3" numberOfLines={2}>
          {event.title}
        </AppText>
        <View style={styles.facts}>
          <Fact icon={Clock3} text={timeOf(event)} />
          <Fact icon={MapPin} text={event.location} />
        </View>
        <View style={styles.footer}>
          <AppText variant="caption" weight="bold">
            <AppText variant="caption" color="ink" weight="extrabold">
              {event.attending + (going ? 1 : 0)}
            </AppText>{' '}
            going
          </AppText>
          <RsvpButton going={going} onPress={onRsvp} />
        </View>
      </View>
    </View>
  );
}

function DateTile({ event, size = 'small' }: { event: TradeEvent; size?: 'small' | 'large' }) {
  const { colors } = useTheme();
  const large = size === 'large';
  return (
    <View style={[styles.date, large ? styles.dateLarge : styles.dateSmall, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.month, { color: colors.orange }]}>{event.month}</Text>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.day, large && styles.dayLarge, { color: colors.ink }]}>{event.day}</Text>
    </View>
  );
}

function Fact({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Icon size={14} color={colors.muted} strokeWidth={2.1} />
      <AppText variant="small" numberOfLines={1} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

function Attendees({ count }: { count: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.people}>
      {attendees.map((initials, index) => (
        <View key={initials} style={[styles.stack, { marginLeft: index ? -10 : 0, borderColor: colors.surface }]}>
          <Avatar initials={initials} color={avatarPalette[index % avatarPalette.length]} size="small" />
        </View>
      ))}
      <AppText variant="caption" style={styles.going}>
        <AppText variant="caption" color="ink" weight="extrabold">
          {count}
        </AppText>{' '}
        going
      </AppText>
    </View>
  );
}

function RsvpButton({ going, onPress }: { going: boolean; onPress: () => void }) {
  return <Button label={going ? 'Going' : 'RSVP'} icon={going ? Check : undefined} variant={going ? 'success' : 'primary'} compact onPress={onPress} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  featured: { borderRadius: 28, overflow: 'hidden' },
  banner: { height: 176, padding: 18, justifyContent: 'space-between', overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  orbLarge: { width: 220, height: 220, right: -70, top: -90 },
  orbSmall: { width: 110, height: 110, left: -40, bottom: -50 },
  bannerArt: { position: 'absolute', right: -14, bottom: -18, opacity: 0.16 },
  bannerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nextUp: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.18)' },
  nextUpText: { fontFamily: fonts.extrabold, fontSize: 10.5, letterSpacing: 1.2 },
  bannerTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 27, letterSpacing: -0.5, maxWidth: '88%' },
  featuredBody: { padding: 18, gap: 14 },
  facts: { gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  divider: { height: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  people: { flexDirection: 'row', alignItems: 'center' },
  stack: { borderWidth: 2, borderRadius: 999 },
  going: { marginLeft: 8 },

  timelineRow: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 56 },
  railLine: { flex: 1, width: 2, borderRadius: 1, marginTop: 8, marginBottom: -14 },
  compact: { flex: 1, borderRadius: 22, padding: 16, paddingLeft: 20, gap: 8, overflow: 'hidden' },
  accent: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },

  date: { alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  dateSmall: { width: 56, height: 60 },
  dateLarge: { width: 62, height: 68, borderRadius: 18 },
  month: { fontFamily: fonts.extrabold, fontSize: 10.5, letterSpacing: 1.3 },
  day: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 26 },
  dayLarge: { fontSize: 26, lineHeight: 30 },
});
