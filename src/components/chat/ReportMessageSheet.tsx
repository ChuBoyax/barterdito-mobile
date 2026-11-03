import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, Button, SelectField, TextField } from '@/components/ui';
import { useTheme } from '@/providers';
import { directMessageService } from '@/services';
import type { MessageReportReason } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

export const reportReasons: Record<MessageReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  scam: 'Scam or fraud',
  inappropriate: 'Inappropriate content',
  other: 'Other',
};

const MIN_OTHER_DETAILS = 10;

type ReportMessageSheetProps = {
  conversationId: string;
  message: { id: number; body: string };
  onClose: () => void;
};

/** Mount it with `key={message.id}` so each report starts empty. */
export function ReportMessageSheet({ conversationId, message, onClose }: ReportMessageSheetProps) {
  const { colors } = useTheme();
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const reason = (Object.keys(reportReasons) as MessageReportReason[]).find((key) => reportReasons[key] === label);
  const reasonError = reason ? undefined : 'Choose a reason for your report.';
  const detailsError = reason === 'other' && details.trim().length < MIN_OTHER_DETAILS ? `Explain what happened (at least ${MIN_OTHER_DETAILS} characters).` : undefined;

  async function submit() {
    if (busy) return;
    setAttempted(true);
    if (!reason || detailsError) return;
    setBusy(true);
    setError('');
    try {
      await directMessageService.reportMessage(conversationId, message.id, reason, details.trim());
      setDone(true);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save your report. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible onClose={onClose} eyebrow="Safety" title={done ? 'Report saved' : 'Report message'}>
      {done ? (
        <>
          <AppText variant="body">Your report has been saved for moderator review.</AppText>
          <AppText variant="small">Reporting does not block this user. You can block them from conversation options.</AppText>
          <Button label="Done" onPress={onClose} />
        </>
      ) : (
        <>
          <View style={[styles.quote, { backgroundColor: colors.surface2, borderLeftColor: colors.orange }]}>
            <AppText variant="small" color="ink" numberOfLines={5}>
              {message.body}
            </AppText>
          </View>
          <AppText variant="caption">The selected message and your explanation will be shared with authorized moderators. The other trader will not receive your report.</AppText>
          <SelectField label="Reason" required value={label} options={Object.values(reportReasons)} onChange={setLabel} placeholder="Choose a reason" error={attempted ? reasonError : undefined} />
          <TextField
            label="Explanation"
            required={reason === 'other'}
            multiline
            value={details}
            onChangeText={setDetails}
            maxLength={1000}
            showCount
            placeholder="Add anything that helps moderators understand this report…"
            error={attempted ? detailsError : undefined}
          />
          {error ? (
            <AppText variant="caption" color="red" weight="semibold">
              {error}
            </AppText>
          ) : null}
          <Button label="Submit report" loading={busy} onPress={() => void submit()} />
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  quote: { borderLeftWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
});
