import { router } from 'expo-router';
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, MessageCircle, Square, SquareCheck, Star } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, TextField } from '@/components/ui';
import type { TradeConversationState } from '@/hooks/useTradeConversation';
import { useTheme } from '@/providers/ThemeProvider';
import { tradeService } from '@/services';
import { neu } from '@/theme';
import { confirmAction } from '@/utils/confirm';
import { confirmations, meetupDate } from '@/utils/trades';

type TradeControlsProps = { state: TradeConversationState; userId: string };

/** Two-person confirmation and problem reports — the same rules the backend enforces. */
export function TradeControls({ state, userId }: TradeControlsProps) {
  const { colors } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);
  const [issue, setIssue] = useState('');
  const [reporting, setReporting] = useState(false);
  const data = state.data;
  if (!data) return null;
  const id = data.offer.id;

  if (data.status === 'completed') {
    return (
      <Card style={styles.done}>
        <CheckCircle2 size={36} color={colors.green} />
        <AppText variant="h2" align="center">
          Trade completed
        </AppText>
        <Button label="Rate your trade" icon={Star} onPress={() => router.push(`/trade-review/${id}`)} />
      </Card>
    );
  }
  if (data.status === 'cancelled') {
    return (
      <Card style={styles.done}>
        <AlertTriangle size={32} color={colors.muted} />
        <AppText variant="h2" align="center">
          Trade cancelled
        </AppText>
      </Card>
    );
  }

  const { mine, theirs } = confirmations(data, userId);
  // Older trades may have saved meetups; new ones arrange the details in chat.
  const legacyMeetups = data.meetups.filter((entry) => entry.status === 'accepted' || entry.status === 'pending');
  const openIssues = data.issues.filter((entry) => entry.status === 'open');
  const paused = openIssues.length > 0;
  const myOpenIssue = openIssues.some((entry) => entry.reporterId === userId);

  async function confirm() {
    const ok = await confirmAction({
      title: 'Confirm the exchange?',
      message: 'Only confirm after you received and inspected your item. This cannot be undone.',
      confirmLabel: 'Confirm',
    });
    if (ok) void state.act(() => tradeService.confirmExchange(id));
  }

  return (
    <View style={styles.wrap}>
      {paused ? (
        <Card style={styles.card}>
          <SectionTitle icon={<AlertTriangle size={16} color={colors.orange} />} title="Problem reported" badge={<Badge label="Paused" tone="orange" />} />
          {openIssues.map((entry) => (
            <View key={entry.id} style={[styles.inset, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
              <AppText variant="small" color="ink">
                {entry.body}
              </AppText>
              {entry.reporterId === userId ? (
                <Button label="Mark resolved" variant="secondary" compact disabled={state.busy} onPress={() => void state.act(() => tradeService.resolveIssue(id, entry.id))} />
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.card}>
        <SectionTitle icon={<CalendarDays size={16} color={colors.orange} />} title="Meetup" />
        <AppText variant="small">Agree on a time and a public place in your trade chat.</AppText>
        {legacyMeetups.map((meetup) => (
          <View key={meetup.id} style={[styles.inset, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
            <AppText variant="small" color="ink" weight="semibold">
              {meetupDate(meetup.startsAt)}
            </AppText>
            <AppText variant="caption">
              {meetup.location} · Saved earlier{meetup.status === 'accepted' ? ', agreed' : ''}
            </AppText>
          </View>
        ))}
        <Button label="Open trade chat" icon={MessageCircle} variant="secondary" compact onPress={() => router.push(`/messages/${id}`)} />
      </Card>

      <Card style={styles.card}>
        <SectionTitle icon={<CheckCircle2 size={16} color={colors.orange} />} title="Exchange" />
        <View style={[styles.inset, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
          <Party label="You" done={Boolean(mine)} />
          <Party label="Other trader" done={Boolean(theirs)} />
        </View>
        {!mine ? (
          <>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acknowledged }} onPress={() => setAcknowledged(!acknowledged)} style={styles.row}>
              {acknowledged ? <SquareCheck size={20} color={colors.orange} /> : <Square size={20} color={colors.muted} />}
              <AppText variant="small" color="ink" style={styles.flex}>
                I inspected the item and completed the exchange
              </AppText>
            </Pressable>
            <Button
              label="Confirm exchange"
              icon={CheckCircle2}
              variant="success"
              loading={state.busy}
              disabled={!acknowledged || paused}
              onPress={() => void confirm()}
            />
          </>
        ) : null}
      </Card>

      {reporting ? (
        <Card style={styles.card}>
          <SectionTitle icon={<AlertTriangle size={16} color={colors.muted} />} title="Report a problem" />
          <TextField multiline value={issue} onChangeText={setIssue} maxLength={2000} placeholder="What went wrong? (min. 10 characters)" />
          <View style={styles.row}>
            <Button label="Cancel" variant="ghost" compact style={styles.flex} onPress={() => setReporting(false)} />
            <Button
              label="Submit"
              variant="secondary"
              compact
              loading={state.busy}
              disabled={issue.trim().length < 10 || myOpenIssue}
              style={styles.flex}
              onPress={async () => {
                if (await state.act(() => tradeService.reportIssue(id, issue))) {
                  setIssue('');
                  setReporting(false);
                }
              }}
            />
          </View>
        </Card>
      ) : !myOpenIssue ? (
        <Pressable accessibilityRole="button" onPress={() => setReporting(true)} hitSlop={8} style={styles.reportLink}>
          <AlertTriangle size={14} color={colors.muted} />
          <AppText variant="caption" weight="semibold">
            Report a problem
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionTitle({ icon, title, badge }: { icon: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <View style={styles.row}>
      {icon}
      <AppText variant="h3" style={styles.flex}>
        {title}
      </AppText>
      {badge}
    </View>
  );
}

function Party({ label, done }: { label: string; done: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {done ? <CheckCircle2 size={18} color={colors.green} /> : <Circle size={18} color={colors.muted2} />}
      <AppText variant="small" color="ink" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="caption" color={done ? 'green' : 'muted'} weight="semibold">
        {done ? 'Confirmed' : 'Pending'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { gap: 12 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  inset: { gap: 8, borderRadius: 16, padding: 12 },
  reportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
});
