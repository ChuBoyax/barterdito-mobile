import { useState } from 'react';

import { BottomSheet, Button, SelectField, TextField } from '@/components/ui';

const reasons = ['Spam', 'Inappropriate', 'Scam', 'Counterfeit', 'Other'];

type ReportSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void> | void;
};

export function ReportSheet({ visible, title, onClose, onSubmit }: ReportSheetProps) {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit(reason, details);
      setDetails('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Safety" title={title}>
      <SelectField label="Reason" value={reason} options={reasons} onChange={setReason} />
      <TextField
        label="Additional details"
        multiline
        value={details}
        onChangeText={setDetails}
        placeholder="Tell the moderation team what happened…"
      />
      <Button label="Submit report" loading={submitting} onPress={() => void submit()} />
    </BottomSheet>
  );
}
