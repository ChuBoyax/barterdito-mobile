import { Flag, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrivatePhoto, reportReasons } from '@/components/chat';
import { AppText, Badge, Button, Card, Chip, EmptyState, LoadingView, TextField, type BadgeTone } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useTheme } from '@/providers';
import { directMessageService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import type { MessageReport, MessageReportReason, MessageReportStatus } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

const filters: { value: MessageReportStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];
const statusTones: Record<MessageReportStatus, BadgeTone> = { open: 'orange', resolved: 'green', dismissed: 'neutral' };
const selectReports = (page: { reports: MessageReport[]; total: number }) => page.reports;

const when = (value: string) => new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function ReportsPanel({ canReview }: { canReview: boolean }) {
  const [status, setStatus] = useState<MessageReportStatus>('open');
  const reports = usePagedQuery(queryKeys.messageReports(status), (offset) => directMessageService.getReports(status, offset), selectReports, { persist: false });

  return (
    <>
      <View style={styles.filters}>
        {filters.map((filter) => (
          <Chip key={filter.value} label={filter.label} active={status === filter.value} onPress={() => setStatus(filter.value)} />
        ))}
      </View>
      {reports.isPending ? (
        <LoadingView variant="list" inline />
      ) : reports.isError && !reports.rows.length ? (
        <EmptyState icon={Flag} title="Could not load reports" text={errorMessage(reports.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void reports.refetch()} />
      ) : !reports.rows.length ? (
        <EmptyState icon={Flag} title={`No ${status} reports`} text="Messages reported by traders appear here for review." />
      ) : (
        <>
          {reports.rows.map((report) => (
            <ReportCard key={report.id} report={report} canReview={canReview} onReviewed={() => void reports.refetch()} />
          ))}
          {reports.hasNextPage ? <Button label="Load more reports" variant="secondary" loading={reports.isFetchingNextPage} onPress={() => void reports.fetchNextPage()} /> : null}
        </>
      )}
    </>
  );
}

function ReportCard({ report, canReview, onReviewed }: { report: MessageReport; canReview: boolean; onReviewed: () => void }) {
  const { colors } = useTheme();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'resolved' | 'dismissed' | null>(null);
  const [error, setError] = useState('');

  async function review(status: 'resolved' | 'dismissed') {
    if (busy) return;
    setBusy(status);
    setError('');
    try {
      await directMessageService.reviewReport(report.id, status, notes.trim());
      onReviewed();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save this review. Try again.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <AppText variant="h3" style={styles.flex}>
          {reportReasons[report.reason as MessageReportReason] ?? report.reason}
        </AppText>
        <Badge label={report.status} tone={statusTones[report.status]} />
      </View>
      <AppText variant="caption">
        {report.reporter.fullName} reported {report.sender.fullName} · {when(report.createdAt)}
      </AppText>
      <View style={[styles.quote, { backgroundColor: colors.surface2, borderLeftColor: colors.orange }]}>
        {report.photo ? (
          <PrivatePhoto path={directMessageService.reportPhotoPath(report.id)} photo={report.photo} label="Reported photo" />
        ) : (
          <AppText variant="small" color="ink">
            {report.messageBody}
          </AppText>
        )}
      </View>
      {report.details ? <AppText variant="small">{report.details}</AppText> : null}
      {report.status === 'open' && canReview ? (
        <>
          <TextField label="Review notes" multiline value={notes} onChangeText={setNotes} maxLength={1000} placeholder="Optional notes for other moderators" />
          {error ? (
            <AppText variant="caption" color="red" weight="semibold">
              {error}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button label="Dismiss" variant="secondary" compact fullWidth={false} style={styles.flex} loading={busy === 'dismissed'} disabled={busy !== null} onPress={() => void review('dismissed')} />
            <Button label="Resolve" compact fullWidth={false} style={styles.flex} loading={busy === 'resolved'} disabled={busy !== null} onPress={() => void review('resolved')} />
          </View>
        </>
      ) : null}
      {report.reviewedAt ? (
        <AppText variant="caption">
          Reviewed {when(report.reviewedAt)}
          {report.reviewNotes ? ` · ${report.reviewNotes}` : ''}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quote: { borderLeftWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  actions: { flexDirection: 'row', gap: 10 },
});
