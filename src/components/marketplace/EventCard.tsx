import { Clock3, MapPin, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, Button, Card } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { avatarPalette, fonts, maxFontScale } from '@/theme';
import type { TradeEvent } from '@/types/models';

type EventCardProps = { event: TradeEvent; going: boolean; onRsvp: () => void };

const attendees = ['MS', 'PR', 'BM'];

export function EventCard({ event, going, onRsvp }: EventCardProps) {
  const { colors } = useTheme();
  return (
    <Card padded={false} style={styles.card}>
      <View style={[styles.banner, { backgroundColor: event.color }]}>
        <View style={[styles.date, { backgroundColor: colors.surface }]}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.day, { color: colors.ink }]}>{event.day}</Text>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.month, { color: colors.orange }]}>{event.month}</Text>
        </View>
        <Users size={44} color={colors.onPrimary} strokeWidth={1.6} style={styles.bannerIcon} />
      </View>
      <View style={styles.body}>
        <AppText variant="h2">{event.title}</AppText>
        <View style={styles.row}>
          <Clock3 size={14} color={colors.muted} />
          <AppText variant="small">{event.date}</AppText>
        </View>
        <View style={styles.row}>
          <MapPin size={14} color={colors.muted} />
          <AppText variant="small">{event.location}</AppText>
        </View>
        <View style={styles.footer}>
          <View style={styles.people}>
            {attendees.map((initials, index) => (
              <View key={initials} style={[styles.stack, { marginLeft: index ? -10 : 0, borderColor: colors.surface }]}>
                <Avatar initials={initials} color={avatarPalette[index % avatarPalette.length]} size="small" />
              </View>
            ))}
            <AppText variant="caption" weight="bold" style={styles.going}>
              +{event.attending + (going ? 1 : 0)} going
            </AppText>
          </View>
          <Button label={going ? 'Going' : 'RSVP'} variant={going ? 'secondary' : 'primary'} compact onPress={onRsvp} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  banner: { height: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  bannerIcon: { opacity: 0.85 },
  date: { alignItems: 'center', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 6 },
  day: { fontFamily: fonts.extrabold, fontSize: 22 },
  month: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.2 },
  body: { padding: 18, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  people: { flexDirection: 'row', alignItems: 'center' },
  stack: { borderWidth: 2, borderRadius: 999 },
  going: { marginLeft: 8 },
});
