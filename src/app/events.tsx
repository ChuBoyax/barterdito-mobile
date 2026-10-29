import { CalendarCheck2, CalendarDays, MapPin, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/marketplace';
import { AppText, EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { communityService } from '@/services';
import { neu } from '@/theme';

type Filter = 'all' | 'going';

export default function EventsScreen() {
  const { colors } = useTheme();
  const { requireAuth } = useAuth();
  const showToast = useToast();
  const { data: events = [], loading } = useAsync(['communityService.getEvents'], () => communityService.getEvents());
  const [going, setGoing] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  function rsvp(id: string) {
    requireAuth(() => {
      if (going.includes(id)) return;
      setGoing((current) => [...current, id]);
      void communityService.rsvpEvent(id).then(() => showToast('You’re on the guest list!'));
    });
  }

  const visible = filter === 'going' ? events.filter((event) => going.includes(event.id)) : events;
  const [next, ...rest] = visible;
  const totalGoing = events.reduce((sum, event) => sum + event.attending + (going.includes(event.id) ? 1 : 0), 0);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.intro}>
        <AppText variant="eyebrow" color="green">
          Swap in person
        </AppText>
        <AppText variant="hero">Community events</AppText>
        <AppText variant="small">Browse, barter, and build trust at verified local meetups.</AppText>
      </View>

      <View style={[styles.stats, { backgroundColor: colors.surface }, neu(colors, 2)]}>
        <Stat icon={CalendarDays} value={String(events.length)} label="Upcoming" tint={colors.orange} />
        <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
        <Stat icon={Users} value={totalGoing.toLocaleString()} label="Traders going" tint={colors.blue} />
        <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
        <Stat icon={MapPin} value={String(new Set(events.map((event) => event.location)).size)} label="Venues" tint={colors.green} />
      </View>

      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: 'All events', count: events.length },
          { value: 'going', label: 'My RSVPs', count: going.length },
        ]}
      />

      {loading ? (
        <LoadingView variant="cards" inline />
      ) : !next ? (
        <EmptyState
          icon={CalendarCheck2}
          title={filter === 'going' ? 'No RSVPs yet' : 'No events scheduled'}
          text={filter === 'going' ? 'Tap RSVP on an event to save your spot. It will show up here.' : 'New community swaps will appear here once they’re announced.'}
          action={filter === 'going' ? 'Browse events' : undefined}
          onAction={filter === 'going' ? () => setFilter('all') : undefined}
          actionIcon={CalendarDays}
        />
      ) : (
        <>
          <EventCard variant="featured" event={next} going={going.includes(next.id)} onRsvp={() => rsvp(next.id)} />
          {rest.length ? (
            <View style={styles.more}>
              <AppText variant="h2">Coming up</AppText>
              <View style={styles.timeline}>
                {rest.map((event, index) => (
                  <EventCard key={event.id} event={event} going={going.includes(event.id)} onRsvp={() => rsvp(event.id)} last={index === rest.length - 1} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Stat({ icon: Icon, value, label, tint }: { icon: typeof Users; value: string; label: string; tint: string }) {
  return (
    <View style={styles.stat}>
      <Icon size={18} color={tint} strokeWidth={2.1} />
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20, paddingBottom: 32 },
  intro: { gap: 6 },
  stats: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingVertical: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  more: { gap: 14 },
  timeline: { gap: 14 },
});
