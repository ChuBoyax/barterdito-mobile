import { router } from 'expo-router';
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, MessageCircle, Square, SquareCheck, Star, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, TextField } from '@/components/ui';
import type { TradeConversationState } from '@/hooks/useTradeConversation';
import { useTheme } from '@/providers/ThemeProvider';
import { tradeService } from '@/services';
import { confirmAction } from '@/utils/confirm';
import { confirmations, meetupDate, otherTrader } from '@/utils/trades';

type TradeControlsProps = {
  state: TradeConversationState;
  userId: string;
  /** Already inside the trade chat, so no link back to it. */
  inChat?: boolean;
};

/** Two-person confirmation and problem reports — the same rules the backend enforces. */
export function TradeControls({ state, userId, inChat }: TradeControlsProps) {
  const { colors } = useTheme();
  const [acknowledged, setAcknowledged] = useState(false);
  const [issue, setIssue] = useState('');
  const [reporting, setReporting] = useState(false);
  const data = state.data;
  if (!data) return null;
  const id = data.offer.id;
  const flatCard = [styles.flat, { borderColor: colors.line }];
  const inset = [styles.inset, { backgroundColor: colors.background, borderColor: colors.line }];

  if (data.status === 'completed') {
    return (
      <Card style={[styles.done, flatCard]}>
        <CheckCircle2 size={36} color={colors.green} />
        <AppText variant="h2" align="center">
          Trade completed
        </AppText>
        <Button label="Rate your trade" icon={Star} style={styles.flatFilled} onPress={() => router.push(`/trade-review/${id}`)} />
      </Card>
    );
  }
  if (data.status === 'cancelled') {
    return (
      <Card style={[styles.done, flatCard]}>
        <AlertTriangle size={32} color={colors.muted} />
        <AppText variant="h2" align="center">
          Trade cancelled
        </AppText>
      </Card>
    );
  }

  const { mine, theirs } = confirmations(data, userId);
  const confirmedCount = Number(Boolean(mine)) + Number(Boolean(theirs));
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
        <Card style={[styles.card, flatCard]}>
          <SectionTitle icon={AlertTriangle} title="Problem reported" badge={<Badge label="Paused" tone="orange" />} />
          {openIssues.map((entry) => (
            <View key={entry.id} style={[inset, styles.insetPadded]}>
              <AppText variant="small" color="ink">
                {entry.body}
              </AppText>
              {entry.reporterId === userId ? (
                <Button
                  label="Mark resolved"
                  variant="secondary"
                  compact
                  disabled={state.busy}
                  style={[styles.flat, { borderColor: colors.line }]}
                  onPress={() => void state.act(() => tradeService.resolveIssue(id, entry.id))}
                />
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={[styles.card, flatCard]}>
        <SectionTitle icon={CalendarDays} title="Meetup" />
        <AppText variant="small" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          Agree on a time and a public place in your trade chat.
        </AppText>
        {legacyMeetups.map((meetup) => (
          <View key={meetup.id} style={[inset, styles.insetPadded]}>
            <AppText variant="small" color="ink" weight="semibold">
              {meetupDate(meetup.startsAt)}
            </AppText>
            <AppText variant="caption">
              {meetup.location} · Saved earlier{meetup.status === 'accepted' ? ', agreed' : ''}
            </AppText>
          </View>
        ))}
        {inChat ? null : (
          <Button label="Open trade chat" icon={MessageCircle} variant="secondary" compact style={[styles.flat, { borderColor: colors.line }]} onPress={() => router.push(`/messages/${id}`)} />
        )}
      </Card>

      <Card style={[styles.card, flatCard]}>
        <SectionTitle icon={CheckCircle2} title="Exchange" badge={<Badge label={`${confirmedCount} of 2 confirmed`} tone={confirmedCount ? 'green' : 'neutral'} />} />
        <View style={inset}>
          <Party label="You" done={Boolean(mine)} />
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <Party label={otherTrader(data.offer, userId).fullName} done={Boolean(theirs)} />
        </View>
        {!mine ? (
          <>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acknowledged }}
              onPress={() => setAcknowledged(!acknowledged)}
              style={[styles.check, { backgroundColor: acknowledged ? colors.orangeSoft : colors.background, borderColor: acknowledged ? colors.orange : colors.line }]}>
              {acknowledged ? <SquareCheck size={20} color={colors.orange} /> : <Square size={20} color={colors.muted} />}
              <AppText variant="small" color="ink" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.flex}>
                I inspected the item and completed the exchange
              </AppText>
            </Pressable>
            <Button
              label="Confirm exchange"
              icon={CheckCircle2}
              variant="success"
              loading={state.busy}
              disabled={!acknowledged || paused}
              style={styles.flatFilled}
              onPress={() => void confirm()}
            />
          </>
        ) : null}
      </Card>

      {reporting ? (
        <Card style={[styles.card, flatCard]}>
          <SectionTitle icon={AlertTriangle} muted title="Report a problem" />
          <TextField flat multiline value={issue} onChangeText={setIssue} maxLength={2000} placeholder="What went wrong? (min. 10 characters)" />
          <View style={styles.row}>
            <Button label="Cancel" variant="ghost" compact style={styles.flex} onPress={() => setReporting(false)} />
            <Button
              label="Submit"
              variant="secondary"
              compact
              loading={state.busy}
              disabled={issue.trim().length < 10 || myOpenIssue}
              style={[styles.flex, styles.flat, { borderColor: colors.line }]}
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

function SectionTitle({ icon: Icon, title, badge, muted }: { icon: LucideIcon; title: string; badge?: ReactNode; muted?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.titleRow}>
      <View style={[styles.iconChip, { backgroundColor: muted ? colors.surface2 : colors.orangeSoft }]}>
        <Icon size={17} color={muted ? colors.muted : colors.orange} />
      </View>
      <AppText variant="h3" numberOfLines={1} style={styles.flex}>
        {title}
      </AppText>
      {badge}
    </View>
  );
}

function Party({ label, done }: { label: string; done: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.party}>
      {done ? <CheckCircle2 size={18} color={colors.green} /> : <Circle size={18} color={colors.muted2} />}
      <AppText variant="small" color="ink" weight="semibold" numberOfLines={1} style={styles.flex}>
        {label}
      </AppText>
      <Badge label={done ? 'Confirmed' : 'Pending'} tone={done ? 'green' : 'neutral'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { gap: 14 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  // A thin border replaces the raised shadow these surfaces have by default.
  flat: { boxShadow: [], borderWidth: 1 },
  flatFilled: { boxShadow: [] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconChip: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  inset: { borderWidth: 1, borderRadius: 16 },
  insetPadded: { gap: 8, padding: 12 },
  party: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  divider: { height: StyleSheet.hairlineWidth },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  reportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
});
