import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, RotateCcw, Search, ShieldAlert } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Chip, EmptyState, LoadingView, ProgressBar, SegmentedControl, TextField } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useTheme } from '@/providers';
import { activityService, daysAgo, type ActivityAccount, type MonitoringGroup, type MonitoringPage } from '@/services/activityService';
import { queryKeys } from '@/services/queryKeys';
import { errorMessage } from '@/utils/format';

const noPersist = { persist: false };
const ranges = [7, 30, 90];
const time = (value: string) => new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const selectGroups = (page: MonitoringPage) => page.groups;

/** The window is computed once per choice, so refreshing keeps asking for the same report. */
function useRange() {
  const [days, setDays] = useState(7);
  const since = useMemo(() => daysAgo(days), [days]);
  const picker = (
    <View style={styles.chips}>
      {ranges.map((value) => (
        <Chip key={value} label={`Last ${value} days`} active={days === value} onPress={() => setDays(value)} />
      ))}
    </View>
  );
  return { days, since, picker };
}

export function ActivityPanel() {
  const { days, since, picker } = useRange();
  const [source, setSource] = useState('');
  const [account, setAccount] = useState<ActivityAccount | null>(null);
  const [search, setSearch] = useState('');
  const [needle, setNeedle] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setNeedle(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const actorId = account?.id;
  const events = useInfiniteQuery({
    queryKey: queryKeys.activityEvents(`${days}:${source}:${actorId ?? ''}`),
    meta: noPersist,
    queryFn: ({ pageParam }) => activityService.getEvents({ source, actorId, since }, pageParam),
    initialPageParam: null as Awaited<ReturnType<typeof activityService.getEvents>>['next_cursor'],
    getNextPageParam: (last) => last.next_cursor,
  });
  const accounts = useQuery({ queryKey: queryKeys.activityAccounts(needle), meta: noPersist, enabled: needle.length >= 2, queryFn: () => activityService.findAccounts(needle) });
  const summary = useQuery({
    queryKey: queryKeys.activityReport(`account:${actorId}`, String(days)),
    meta: noPersist,
    enabled: Boolean(actorId),
    queryFn: () => activityService.getAccount(actorId!, since),
  });
  const rows = events.data?.pages.flatMap((page) => page.events) ?? [];

  return (
    <>
      <AppText variant="small">Browser records are unverified observations. Backend records confirm successful actions.</AppText>
      {picker}
      <View style={styles.chips}>
        <Chip label="All sources" active={!source} onPress={() => setSource('')} />
        <Chip label="Backend" active={source === 'backend'} onPress={() => setSource('backend')} />
        <Chip label="Browser" active={source === 'browser'} onPress={() => setSource('browser')} />
      </View>
      {account ? (
        <Card style={styles.card}>
          <AppText variant="h3">Activity for {account.full_name}</AppText>
          {summary.data ? (
            <AppText variant="small">
              {summary.data.counts.backend} confirmed actions · {summary.data.counts.browser} browser observations
            </AppText>
          ) : null}
          <Button label="All accounts" variant="secondary" compact onPress={() => setAccount(null)} />
        </Card>
      ) : (
        <>
          <TextField icon={Search} value={search} onChangeText={setSearch} placeholder="Find an account by name" maxLength={120} autoCorrect={false} />
          {needle.length >= 2 && accounts.data?.accounts.map((entry) => (
            <Button
              key={entry.id}
              label={entry.full_name}
              variant="secondary"
              compact
              onPress={() => {
                setAccount(entry);
                setSearch('');
              }}
            />
          ))}
        </>
      )}
      {events.isPending ? (
        <LoadingView variant="list" inline />
      ) : events.isError && !rows.length ? (
        <EmptyState icon={Activity} title="Could not load activity" text={errorMessage(events.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void events.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon={Activity} title="No activity in this view" text="Try a different filter or a longer date range." />
      ) : (
        <>
          {rows.map((event) => (
            <Card key={event.id} style={styles.card}>
              <View style={styles.heading}>
                <AppText variant="h3" numberOfLines={1} style={styles.flex}>
                  {event.event_name}
                </AppText>
                <Badge label={event.source === 'backend' ? 'Backend' : 'Browser'} tone={event.source === 'backend' ? 'green' : 'neutral'} />
              </View>
              {event.actor_id ? (
                <Pressable accessibilityRole="button" hitSlop={6} onPress={() => setAccount({ id: event.actor_id!, full_name: event.actor_name || 'Account', is_active: true })}>
                  <AppText variant="small" color="orange" weight="semibold">
                    {event.actor_name || 'Account'}
                  </AppText>
                </Pressable>
              ) : (
                <AppText variant="small">{event.actor_kind === 'system' ? 'Backend operator' : 'Guest'}</AppText>
              )}
              <AppText variant="caption">
                {time(event.received_at)}
                {event.page ? ` · ${event.page}` : ''}
                {event.target_type ? ` · ${event.target_type}` : ''}
              </AppText>
            </Card>
          ))}
          {events.hasNextPage ? <Button label="Load more activity" variant="secondary" loading={events.isFetchingNextPage} onPress={() => void events.fetchNextPage()} /> : null}
        </>
      )}
    </>
  );
}

export function AnalyticsPanel() {
  const { days, since, picker } = useRange();
  const [tab, setTab] = useState<'usage' | 'funnel'>('usage');
  return (
    <>
      <SegmentedControl<'usage' | 'funnel'>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'usage', label: 'Usage' },
          { value: 'funnel', label: 'Trade funnel' },
        ]}
      />
      {picker}
      {tab === 'usage' ? <UsageReport days={days} since={since} /> : <FunnelReportView days={days} since={since} />}
    </>
  );
}

function UsageReport({ days, since }: { days: number; since: string }) {
  const report = useQuery({ queryKey: queryKeys.activityReport('analytics', String(days)), meta: noPersist, queryFn: () => activityService.getAnalytics(since) });
  if (report.isPending) return <LoadingView variant="stats" inline />;
  if (!report.data) return <EmptyState icon={BarChart3} title="Could not load analytics" text={errorMessage(report.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void report.refetch()} />;
  const { totals, features, actions, pages } = report.data;
  const metrics: [string, number][] = [
    ['Active accounts', totals.active_accounts],
    ['Confirmed actions', totals.backend_actions],
    ['Browser observations', totals.browser_interactions],
    ['Page views', totals.page_views],
    ['Completed trades', totals.completed_trades],
    ['Guest sessions', totals.guest_sessions],
  ];
  return (
    <>
      <AppText variant="small">Real event counts for this period. Guest sessions are page-load sessions, not unique people.</AppText>
      <View style={styles.metrics}>
        {metrics.map(([label, value]) => (
          <Card key={label} style={styles.metric}>
            <AppText variant="h2">{value.toLocaleString()}</AppText>
            <AppText variant="caption">{label}</AppText>
          </Card>
        ))}
      </View>
      <StatList title="Feature adoption" empty="No recorded feature activity in this period." rows={features.map((row) => ({ key: `${row.source}:${row.feature}`, label: row.feature, note: `${row.source} · ${row.accounts} accounts`, count: row.count }))} />
      <StatList title="Most used actions" empty="No recorded actions in this period." rows={actions.map((row) => ({ key: `${row.source}:${row.event_name}`, label: row.event_name, note: row.source, count: row.count }))} />
      <StatList title="Page views" empty="No page views recorded in this period." rows={pages.map((row) => ({ key: row.page, label: row.page, count: row.count }))} />
    </>
  );
}

function StatList({ title, empty, rows }: { title: string; empty: string; rows: { key: string; label: string; note?: string; count: number }[] }) {
  return (
    <Card style={styles.card}>
      <AppText variant="h3">{title}</AppText>
      {!rows.length ? <AppText variant="small">{empty}</AppText> : null}
      {rows.map((row) => (
        <View key={row.key} style={styles.heading}>
          <View style={styles.flex}>
            <AppText variant="small" color="ink" numberOfLines={1}>
              {row.label}
            </AppText>
            {row.note ? <AppText variant="caption">{row.note}</AppText> : null}
          </View>
          <AppText variant="h3">{row.count.toLocaleString()}</AppText>
        </View>
      ))}
    </Card>
  );
}

function FunnelReportView({ days, since }: { days: number; since: string }) {
  const report = useQuery({ queryKey: queryKeys.activityReport('funnel', String(days)), meta: noPersist, queryFn: () => activityService.getFunnel(since) });
  if (report.isPending) return <LoadingView variant="stats" inline />;
  if (!report.data) return <EmptyState icon={BarChart3} title="Could not load the funnel" text={errorMessage(report.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void report.refetch()} />;
  const { definition, stages } = report.data;
  const base = stages[0]?.count || 1;
  return (
    <>
      <AppText variant="small">{definition}</AppText>
      {stages.map((stage, index) => (
        <Card key={stage.key} style={styles.card}>
          <View style={styles.heading}>
            <AppText variant="h3" style={styles.flex}>
              {stage.label}
            </AppText>
            <AppText variant="h3">{stage.count.toLocaleString()}</AppText>
          </View>
          <ProgressBar value={stage.count} max={base} />
          {index > 0 ? (
            <AppText variant="caption">
              {stage.conversion}% from the previous stage · {stage.drop_off.toLocaleString()} did not reach this stage
            </AppText>
          ) : null}
        </Card>
      ))}
      {!stages[0]?.count ? <AppText variant="small">No current listings were created in this period. Choose another date range.</AppText> : null}
    </>
  );
}

const states = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

export function MonitoringPanel({ canReview }: { canReview: boolean }) {
  const { days, since, picker } = useRange();
  const [state, setState] = useState('');
  const groups = usePagedQuery(queryKeys.monitoring(`${days}:${state}`), (offset) => activityService.getMonitoring({ since, state }, offset), selectGroups, { persist: false });
  const page = groups.firstPage;

  return (
    <>
      <AppText variant="small">Sanitized error codes and route templates. Browser reports are unverified observations.</AppText>
      {picker}
      <View style={styles.chips}>
        {states.map((entry) => (
          <Chip key={entry.value} label={entry.label} active={state === entry.value} onPress={() => setState(entry.value)} />
        ))}
      </View>
      {page ? (
        <AppText variant="caption">
          {page.total} groups · {page.attention_groups} need attention
        </AppText>
      ) : null}
      {groups.isPending ? (
        <LoadingView variant="list" inline />
      ) : groups.isError && !groups.rows.length ? (
        <EmptyState icon={ShieldAlert} title="Could not load monitoring" text={errorMessage(groups.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void groups.refetch()} />
      ) : !groups.rows.length ? (
        <EmptyState icon={ShieldAlert} title="No monitoring signals in this view" text="Try another review status or date range." />
      ) : (
        <>
          {groups.rows.map((group) => (
            <MonitoringCard key={group.fingerprint} group={group} canReview={canReview} onReviewed={() => void groups.refetch()} />
          ))}
          {groups.hasNextPage ? <Button label="Load more groups" variant="secondary" loading={groups.isFetchingNextPage} onPress={() => void groups.fetchNextPage()} /> : null}
        </>
      )}
    </>
  );
}

function MonitoringCard({ group, canReview, onReviewed }: { group: MonitoringGroup; canReview: boolean; onReviewed: () => void }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function review(status: 'acknowledged' | 'resolved') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await activityService.reviewMonitoring(group, status);
      onReviewed();
    } catch (caught) {
      setError(`${errorMessage(caught, 'Could not save the review.')} Refresh the group before trying again.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={[styles.card, group.alert && group.status === 'open' ? { borderColor: colors.red, borderWidth: 1 } : null]}>
      <View style={styles.heading}>
        <AppText variant="h3" numberOfLines={1} style={styles.flex}>
          {group.event_name}
        </AppText>
        <Badge label={group.alert && group.status === 'open' ? 'Needs attention' : group.status} tone={group.alert && group.status === 'open' ? 'red' : group.status === 'resolved' ? 'green' : 'neutral'} />
      </View>
      <AppText variant="small">
        {group.page}
        {group.status_code ? ` · HTTP ${group.status_code}` : ''} · {group.source}
      </AppText>
      <AppText variant="caption">
        {group.count} occurrences · {group.recent_count} in the last 15 minutes · latest {time(group.last_seen)}
      </AppText>
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      {canReview ? (
        <View style={styles.chips}>
          <Button label="Acknowledge" variant="secondary" compact fullWidth={false} style={styles.flex} disabled={busy || group.status === 'acknowledged'} onPress={() => void review('acknowledged')} />
          <Button label="Mark resolved" variant="secondary" compact fullWidth={false} style={styles.flex} disabled={busy || group.status === 'resolved'} onPress={() => void review('resolved')} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexGrow: 1, flexBasis: '45%', gap: 2 },
});
