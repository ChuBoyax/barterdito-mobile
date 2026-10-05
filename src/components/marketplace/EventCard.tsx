import { Clock3, MapPin, Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Badge, Button, Card } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';
import type { TradeEvent } from '@/types/models';

type EventCardProps = { event: TradeEvent; going: boolean; onRsvp: () => void };

export function EventCard({ event, going, onRsvp }: EventCardProps) {
  const { colors } = useTheme();
  return (
    <Card padded={false} style={styles.card}>
      <View style={[styles.banner, { backgroundColor: event.color }]}>
        <View style={styles.date}>
          <Text style={styles.day}>{event.day}</Text>
          <Text style={styles.month}>{event.month}</Text>
        </View>
        <Users size={42} color="rgba(255,255,255,0.85)" />
      </View>
      <View style={styles.body}>
        <Badge label="Community event" tone="blue" />
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
          <AppText variant="caption">{event.attending + (going ? 1 : 0)} traders going</AppText>
          <Button label={going ? 'Going' : 'RSVP'} variant={going ? 'secondary' : 'primary'} compact onPress={onRsvp} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  banner: { height: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  date: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  day: { fontFamily: fonts.extrabold, fontSize: 22, color: '#2c2c2c' },
  month: { fontFamily: fonts.extrabold, fontSize: 10, color: '#8a8582', letterSpacing: 1 },
  body: { padding: 16, gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
});
