import { History, RotateCcw } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { AppText, Button, Card, EmptyState, LoadingView } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { accessService, type AccessAudit } from '@/services/accessService';
import { queryKeys } from '@/services/queryKeys';
import { errorMessage } from '@/utils/format';

const selectEntries = (page: { entries: AccessAudit[]; total: number }) => page.entries;

const show = (value: unknown) => (Array.isArray(value) ? value.join(', ') || 'none' : value === null || value === undefined || value === '' ? 'none' : typeof value === 'object' ? JSON.stringify(value) : String(value));

/** Only what changed, as "field: before → after". */
function changes({ before, after }: AccessAudit) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].flatMap((key) => {
    const from = before?.[key];
    const to = after?.[key];
    return JSON.stringify(from) === JSON.stringify(to) ? [] : [`${key}: ${show(from)} → ${show(to)}`];
  });
}

export function HistoryPanel() {
  const audit = usePagedQuery(queryKeys.accessAudit, (offset) => accessService.getAudit(offset), selectEntries, { persist: false });

  if (audit.isPending) return <LoadingView variant="list" inline />;
  if (audit.isError && !audit.rows.length) {
    return <EmptyState icon={History} title="Could not load access history" text={errorMessage(audit.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void audit.refetch()} />;
  }
  if (!audit.rows.length) return <EmptyState icon={History} title="No access changes yet" text="Role and permission changes appear here." />;

  return (
    <>
      {audit.rows.map((entry) => (
        <Card key={entry.id} style={styles.card}>
          <AppText variant="h3">{entry.action.replace(/[._]/g, ' ')}</AppText>
          <AppText variant="caption">
            {entry.actorName || 'System'} · {entry.subjectType} {entry.subjectId} · {new Date(entry.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </AppText>
          {changes(entry).map((change) => (
            <AppText key={change} variant="small">
              {change}
            </AppText>
          ))}
        </Card>
      ))}
      {audit.hasNextPage ? <Button label="Load more history" variant="secondary" loading={audit.isFetchingNextPage} onPress={() => void audit.fetchNextPage()} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
});
