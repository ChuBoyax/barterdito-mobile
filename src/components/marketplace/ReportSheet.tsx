import { useState } from 'react';

import { BottomSheet, Button, SelectField, TextField } from '@/components/ui';

const reasons = ['Spam', 'Inappropriate', 'Scam', 'Counterfeit', 'Other'];

type ReportSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void> | void;
};

const MIN_DETAILS = 10;

export function ReportSheet({ visible, title, onClose, onSubmit }: ReportSheetProps) {
  // No default reason: a pre-selected one would let people send a report without choosing.
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const reasonError = !reason ? 'Choose a reason for your report.' : undefined;
  const detailsError = details.trim().length < MIN_DETAILS ? `Tell us what happened (at least ${MIN_DETAILS} characters).` : undefined;

  async function submit() {
    if (submitting) return;
    setAttempted(true);
    if (reasonError || detailsError) return;
    setSubmitting(true);
    try {
      await onSubmit(reason, details.trim());
      setReason('');
      setDetails('');
      setAttempted(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Safety" title={title}>
      <SelectField label="Reason" required value={reason} options={reasons} onChange={setReason} placeholder="Choose a reason" error={attempted ? reasonError : undefined} />
      <TextField
        label="Additional details"
        required
        multiline
        value={details}
        onChangeText={setDetails}
        maxLength={1000}
        showCount
        placeholder="Tell the moderation team what happened…"
        error={attempted ? detailsError : undefined}
      />
      <Button label="Submit report" loading={submitting} onPress={() => void submit()} />
    </BottomSheet>
  );
}
