import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Square, SquareCheck, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, InfoNote, TextField } from '@/components/ui';
import type { TradeConversationState } from '@/hooks/useTradeConversation';
import { useTheme } from '@/providers/ThemeProvider';
import { tradeService } from '@/services';
import type { TradeMeetup } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { confirmations, meetupDate } from '@/utils/trades';

type TradeControlsProps = { state: TradeConversationState; userId: string; meetupForm?: boolean };

/** Meetup, two-person confirmation and problem reports — the same rules the backend enforces. */
export function TradeControls({ state, userId, meetupForm = false }: TradeControlsProps) {
  const { colors } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);
  const [issue, setIssue] = useState('');
  const [reporting, setReporting] = useState(false);
  const data = state.data;
  if (!data) return null;
  const id = data.offer.id;

  if (data.status === 'completed') {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <CheckCircle2 size={22} color={colors.green} />
          <View style={styles.flex}>
            <AppText variant="h3">Trade completed</AppText>
            <AppText variant="caption">Both traders confirmed the exchange. Both items are marked traded.</AppText>
          </View>
        </View>
        <Button label="Rate your trade" icon={Star} compact onPress={() => router.push(`/trade-review/${id}`)} />
      </Card>
    );
  }
  if (data.status === 'cancelled') {
    return <InfoNote icon={AlertTriangle} title="Trade cancelled" text="This trade was cancelled. The conversation is read-only." />;
  }

  const { mine, theirs } = confirmations(data, userId);
  const fixed = Boolean(mine || theirs);
  const agreed = data.meetups.some((entry) => entry.status === 'accepted');
  const openIssues = data.issues.filter((entry) => entry.status === 'open');
  const paused = openIssues.length > 0;
  const myOpenIssue = openIssues.some((entry) => entry.reporterId === userId);

  async function confirm() {
    const ok = await confirmAction({
      title: 'Confirm the exchange?',
      message: 'Only confirm after you received and inspected your item. This cannot be undone.',
      confirmLabel: 'Confirm exchange',
    });
    if (ok) void state.act(() => tradeService.confirmExchange(id));
  }

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <AppText variant="h3">Meetup & exchange</AppText>
            <AppText variant="caption">Meet in a public place and inspect both items before confirming.</AppText>
          </View>
        </View>
        {data.meetups.map((meetup) => (
          <MeetupRow key={meetup.id} meetup={meetup} userId={userId} state={state} locked={fixed} paused={paused} />
        ))}
        {!data.meetups.length ? <AppText variant="caption">No meetup proposed yet.</AppText> : null}
        {!meetupForm && !fixed ? (
          <Button label="Propose meetup" icon={CalendarDays} variant="secondary" compact onPress={() => router.push(`/meetups/${id}`)} />
        ) : null}
        {meetupForm && !fixed ? <MeetupForm state={state} paused={paused} /> : null}
      </Card>

      <Card style={styles.card}>
        <AppText variant="h3">Confirm the exchange</AppText>
        <AppText variant="caption">
          {mine
            ? 'You confirmed the exchange. Waiting for the other trader.'
            : theirs
              ? 'The other trader has confirmed. Confirm only after you receive and inspect your item.'
              : 'Both traders must confirm separately. Your items stay reserved until then.'}
        </AppText>
        {!agreed ? (
          <AppText variant="caption" color="orange" weight="bold">
            Agree on a meetup before confirming.
          </AppText>
        ) : null}
        {!mine ? (
          <>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAcknowledged(!acknowledged)} style={styles.row}>
              {acknowledged ? <SquareCheck size={20} color={colors.orange} /> : <Square size={20} color={colors.muted} />}
              <AppText variant="small" color="ink" style={styles.flex}>
                I inspected the item and completed the exchange.
              </AppText>
            </Pressable>
            <Button
              label="Confirm exchange"
              icon={CheckCircle2}
              variant="success"
              loading={state.busy}
              disabled={!agreed || !acknowledged || paused}
              onPress={() => void confirm()}
            />
          </>
        ) : null}
      </Card>

      {paused ? (
        <Card style={[styles.card, { borderColor: colors.orange }]}>
          <View style={styles.row}>
            <AlertTriangle size={18} color={colors.orange} />
            <AppText variant="h3">Completion paused: reported problem</AppText>
          </View>
          {openIssues.map((entry) => (
            <View key={entry.id} style={[styles.issue, { backgroundColor: colors.surface2 }]}>
              <AppText variant="small" color="ink">
                {entry.body}
              </AppText>
              {entry.reporterId === userId ? (
                <Button
                  label="Mark problem resolved"
                  variant="secondary"
                  compact
                  disabled={state.busy}
                  onPress={() => void state.act(() => tradeService.resolveIssue(id, entry.id))}
                />
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => setReporting(!reporting)} style={styles.row}>
          <ShieldCheck size={18} color={colors.muted} />
          <AppText variant="h3" style={styles.flex}>
            Report a problem with this trade
          </AppText>
        </Pressable>
        {reporting ? (
          <>
            <AppText variant="caption">
              The report is shared with the other trader and pauses completion. You can mark it resolved after you agree on a solution.
            </AppText>
            <TextField label="Describe the problem" multiline value={issue} onChangeText={setIssue} maxLength={2000} showCount />
            <Button
              label="Submit problem report"
              variant="secondary"
              loading={state.busy}
              disabled={issue.trim().length < 10 || myOpenIssue}
              onPress={async () => {
                if (await state.act(() => tradeService.reportIssue(id, issue))) {
                  setIssue('');
                  setReporting(false);
                }
              }}
            />
            {myOpenIssue ? <AppText variant="caption">You already have an open report for this trade.</AppText> : null}
          </>
        ) : null}
      </Card>
    </View>
  );
}

function MeetupRow({ meetup, userId, state, locked, paused }: { meetup: TradeMeetup; userId: string; state: TradeConversationState; locked: boolean; paused: boolean }) {
  const { colors } = useTheme();
  const id = state.data!.offer.id;
  const agreed = meetup.status === 'accepted';
  const fromMe = meetup.proposedBy === userId;
  const respond = (action: 'accept' | 'decline' | 'cancel') => void state.act(() => tradeService.respondMeetup(id, meetup.id, action));
  return (
    <View style={[styles.meetup, { backgroundColor: agreed ? colors.greenSoft : colors.surface2 }]}>
      <AppText variant="eyebrow" color={agreed ? 'green' : 'orange'}>
        {agreed ? 'Agreed meetup' : fromMe ? 'You proposed' : 'Proposed meetup'}
      </AppText>
      <View style={styles.row}>
        <Clock3 size={14} color={colors.muted} />
        <AppText variant="small" color="ink" weight="bold" style={styles.flex}>
          {meetupDate(meetup.startsAt)}
        </AppText>
      </View>
      <View style={styles.row}>
        <MapPin size={14} color={colors.muted} />
        <AppText variant="small" color="ink" style={styles.flex}>
          {meetup.location}
        </AppText>
      </View>
      {meetup.notes ? <AppText variant="caption">{meetup.notes}</AppText> : null}
      {!locked ? (
        <View style={styles.row}>
          {meetup.status === 'pending' && !fromMe ? (
            <>
              <Button label="Accept" compact disabled={state.busy || paused} style={styles.flex} onPress={() => respond('accept')} />
              <Button label="Decline" variant="secondary" compact disabled={state.busy || paused} style={styles.flex} onPress={() => respond('decline')} />
            </>
          ) : null}
          {agreed || fromMe ? (
            <Button
              label={agreed ? 'Cancel meetup' : 'Withdraw meetup'}
              variant="ghost"
              compact
              disabled={state.busy || paused}
              onPress={() => respond('cancel')}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function MeetupForm({ state, paused }: { state: TradeConversationState; paused: boolean }) {
  const { colors } = useTheme();
  const [when, setWhen] = useState<Date | null>(null);
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
    setWhen((current) => {
      const next = new Date(current ?? defaultTime());
      if (mode === 'date') next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      else next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      return next;
    });
  }

  async function submit() {
    if (!when) return setError('Choose the meetup date and time.');
    if (when.getTime() <= Date.now()) return setError('Choose a future meetup date and time.');
    if (location.trim().length < 2) return setError('Add a public meetup location.');
    if (await state.act(() => tradeService.proposeMeetup(id, when, location, notes))) {
      setWhen(null);
      setLocation('');
      setNotes('');
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <Button
          label={when ? when.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}
          icon={CalendarDays}
          variant="secondary"
          compact
          style={styles.flex}
          onPress={() => setPicking('date')}
        />
        <Button
          label={when ? when.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : 'Pick time'}
          icon={Clock3}
          variant="secondary"
          compact
          style={styles.flex}
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
      <AppText variant="caption">Time is in your phone’s timezone.</AppText>
      <TextField
        label="Public location"
        icon={MapPin}
        value={location}
        onChangeText={(value) => {
          setLocation(value);
          setError('');
        }}
        maxLength={200}
        placeholder="Mall entrance or another busy public place"
      />
      <TextField label="Meetup notes" multiline value={notes} onChangeText={setNotes} maxLength={1000} placeholder="Landmark, what to bring, how to find you…" />
      {error ? (
        <AppText variant="small" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <Button label="Send meetup proposal" icon={CalendarDays} loading={state.busy} disabled={paused} onPress={() => void submit()} />
      <AppText variant="caption" style={{ color: colors.muted }}>
        The other trader must accept. A previously agreed meetup stays in place until a replacement is accepted.
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

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  meetup: { gap: 6, borderRadius: 14, padding: 12 },
  issue: { gap: 8, borderRadius: 12, padding: 10 },
  form: { gap: 12 },
});
