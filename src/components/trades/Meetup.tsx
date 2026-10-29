import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, CheckCircle2, Clock3, MapPin, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, TextField } from '@/components/ui';
import type { TradeConversationState } from '@/hooks/useTradeConversation';
import { useTheme } from '@/providers/ThemeProvider';
import { tradeService } from '@/services';
import { neu } from '@/theme';
import type { TradeMeetup } from '@/types/trades';
import { confirmations, meetupDate } from '@/utils/trades';

type MeetupRowProps = { meetup: TradeMeetup; userId: string; state: TradeConversationState; locked: boolean; paused: boolean; showOwner?: boolean };

/** One proposed or agreed meetup, with the replies allowed for the viewer. */
export function MeetupRow({ meetup, userId, state, locked, paused, showOwner = true }: MeetupRowProps) {
  const { colors } = useTheme();
  const id = state.data!.offer.id;
  const agreed = meetup.status === 'accepted';
  const fromMe = meetup.proposedBy === userId;
  const respond = (action: 'accept' | 'decline' | 'cancel') => void state.act(() => tradeService.respondMeetup(id, meetup.id, action));
  return (
    <View style={[styles.inset, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
      {!agreed && showOwner ? (
        <AppText variant="caption" weight="semibold">
          {fromMe ? 'Waiting for their reply' : 'Proposed by the other trader'}
        </AppText>
      ) : null}
      <Detail icon={Clock3} text={meetupDate(meetup.startsAt)} strong />
      <Detail icon={MapPin} text={meetup.location} />
      {meetup.notes ? <AppText variant="caption">{meetup.notes}</AppText> : null}
      {!locked ? (
        <View style={styles.row}>
          {meetup.status === 'pending' && !fromMe ? (
            <>
              <Button label="Decline" variant="secondary" compact disabled={state.busy || paused} style={styles.flex} onPress={() => respond('decline')} />
              <Button label="Accept" compact disabled={state.busy || paused} style={styles.flex} onPress={() => respond('accept')} />
            </>
          ) : null}
          {agreed || fromMe ? (
            <Button label={agreed ? 'Cancel meetup' : 'Withdraw'} variant="ghost" compact disabled={state.busy || paused} onPress={() => respond('cancel')} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Detail({ icon: Icon, text, strong }: { icon: LucideIcon; text: string; strong?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Icon size={15} color={colors.muted} />
      <AppText variant="small" color="ink" weight={strong ? 'semibold' : 'medium'} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

/** Tomorrow at 10:00, a sensible starting point for the pickers. */
function defaultTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

/** Date or time shown as a pressed-in field that opens the native picker. */
function PickerField({ label, icon: Icon, value, placeholder, onPress }: { label: string; icon: LucideIcon; value?: string; placeholder: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.flexGap}>
      <AppText variant="small" color="ink" weight="bold">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? 'not set'}`}
        onPress={onPress}
        style={[styles.picker, { backgroundColor: colors.background }, neu(colors, 2, true)]}>
        <Icon size={17} color={value ? colors.orange : colors.muted} />
        <AppText variant="small" color={value ? 'ink' : 'muted2'} weight={value ? 'semibold' : 'medium'} numberOfLines={1} style={styles.flex}>
          {value ?? placeholder}
        </AppText>
      </Pressable>
    </View>
  );
}

/** Form to propose a public meetup; the other trader must accept it. */
export function MeetupForm({ state, paused, onSent, secondary }: { state: TradeConversationState; paused: boolean; onSent?: () => void; secondary?: boolean }) {
  const [when, setWhen] = useState<Date | null>(null);
  const [hasTime, setHasTime] = useState(false);
  const [picking, setPicking] = useState<'date' | 'time' | null>(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const id = state.data!.offer.id;

  function pick(event: DateTimePickerEvent, value?: Date) {
    const mode = picking;
    if (Platform.OS === 'android') setPicking(null);
    if (event.type !== 'set' || !value || !mode) return;
    setError('');
    if (mode === 'time') setHasTime(true);
    setWhen((current) => {
      const next = new Date(current ?? defaultTime());
      if (mode === 'date') next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      else next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      return next;
    });
  }

  async function submit() {
    if (!when || !hasTime) return setError('Pick a date and time.');
    if (when.getTime() <= Date.now()) return setError('Pick a future date and time.');
    if (location.trim().length < 2) return setError('Add a public place.');
    if (await state.act(() => tradeService.proposeMeetup(id, when, location, notes))) {
      setWhen(null);
      setHasTime(false);
      setLocation('');
      setNotes('');
      onSent?.();
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.pair}>
        <PickerField
          label="Date"
          icon={CalendarDays}
          value={when ? when.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : undefined}
          placeholder="Choose"
          onPress={() => setPicking('date')}
        />
        <PickerField
          label="Time"
          icon={Clock3}
          value={when && hasTime ? when.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : undefined}
          placeholder="Choose"
          onPress={() => setPicking('time')}
        />
      </View>
      {picking ? (
        <View>
          <DateTimePicker
            value={when ?? defaultTime()}
            mode={picking}
            minimumDate={picking === 'date' ? new Date() : undefined}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={pick}
          />
          {Platform.OS === 'ios' ? <Button label="Done" variant="ghost" compact onPress={() => setPicking(null)} /> : null}
        </View>
      ) : null}
      <TextField
        label="Place"
        icon={MapPin}
        value={location}
        onChangeText={(value) => {
          setLocation(value);
          setError('');
        }}
        maxLength={200}
        placeholder="e.g. SM North EDSA, main entrance"
      />
      <TextField label="Notes" multiline value={notes} onChangeText={setNotes} maxLength={1000} placeholder="Optional" style={styles.notes} />
      {error ? (
        <AppText variant="small" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <Button label="Send proposal" variant={secondary ? 'secondary' : 'primary'} loading={state.busy} disabled={paused} onPress={() => void submit()} />
    </View>
  );
}

/** The Schedule Meetup screen: current plan first, then a focused proposal form. */
export function MeetupScheduler({ state, userId, onSent }: { state: TradeConversationState; userId: string; onSent: () => void }) {
  const { colors } = useTheme();
  const data = state.data;
  if (!data) return null;
  const { mine, theirs } = confirmations(data, userId);
  const locked = Boolean(mine || theirs) || data.status !== 'active';
  const paused = data.issues.some((entry) => entry.status === 'open');
  const agreed = data.meetups.find((entry) => entry.status === 'accepted');
  const pending = data.meetups.find((entry) => entry.status === 'pending');

  return (
    <View style={styles.wrap}>
      {agreed ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <CheckCircle2 size={18} color={colors.green} />
            <AppText variant="h3" style={styles.flex}>
              Agreed meetup
            </AppText>
            <Badge label="Confirmed" tone="green" />
          </View>
          <MeetupRow meetup={agreed} userId={userId} state={state} locked={locked} paused={paused} />
        </Card>
      ) : null}

      {pending ? (
        <Card style={styles.card}>
          <AppText variant="h3">{pending.proposedBy === userId ? 'Your proposal' : 'Their proposal'}</AppText>
          <MeetupRow meetup={pending} userId={userId} state={state} locked={locked} paused={paused} showOwner={false} />
        </Card>
      ) : null}

      {locked ? (
        <AppText variant="small" align="center">
          {data.status === 'active' ? 'The exchange is being confirmed, so the meetup can no longer change.' : 'This trade is closed.'}
        </AppText>
      ) : (
        <Card style={styles.card}>
          <AppText variant="h3">{pending || agreed ? 'Suggest another time' : 'Propose a time'}</AppText>
          {/* Accepting their proposal is the main action; a counter-proposal stays secondary. */}
          <MeetupForm state={state} paused={paused} onSent={onSent} secondary={Boolean(pending && pending.proposedBy !== userId)} />
        </Card>
      )}

      {paused ? (
        <AppText variant="small" color="orange" align="center">
          A problem was reported. Resolve it before changing the meetup.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { gap: 12 },
  inset: { gap: 8, borderRadius: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  flexGap: { flex: 1, gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
  picker: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, paddingHorizontal: 14 },
  form: { gap: 14 },
  notes: { minHeight: 60 },
});
