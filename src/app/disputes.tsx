import { Image } from 'expo-image';
import { AlertTriangle, ImagePlus, ShieldCheck, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Badge, Button, Card, Screen, SectionHeading, SelectField, TextField } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useTheme, useToast } from '@/providers';
import { tradeService } from '@/services';

const reasons = ['Item not as described', 'Counterfeit item', 'Unsafe meetup', 'Other'];
const timeline = ['Filed', 'Under review', 'Resolution'];

export default function DisputesScreen() {
  return (
    <RequireAuth>
      <DisputeContent />
    </RequireAuth>
  );
}

function DisputeContent() {
  const { colors } = useTheme();
  const showToast = useToast();
  const pickImages = useImagePicker();
  const { data: trades = [] } = useAsync(() => tradeService.getCompletedTrades(), []);
  const [trade, setTrade] = useState('');
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!trade) return showToast('Select a completed trade');
    if (details.trim().length < 20) return showToast('Describe what happened (at least 20 characters)');
    setSubmitting(true);
    await tradeService.fileDispute({ trade, reason, details, evidence });
    setSubmitting(false);
    setSubmitted(true);
    showToast('Dispute evidence uploaded');
  }

  if (submitted) {
    return (
      <Screen>
        <Card style={styles.card}>
          <Badge label="Under review" tone="orange" />
          <AppText variant="h1">Your dispute was filed</AppText>
          <AppText variant="small">Sentinel moderators will review the description and evidence. Updates will appear in Notifications.</AppText>
          <View style={styles.timeline}>
            {timeline.map((label, index) => (
              <View key={label} style={styles.stage}>
                <View style={[styles.stageDot, { backgroundColor: index === 0 ? colors.green : index === 1 ? colors.orange : colors.line }]} />
                <AppText variant="caption" color={index < 2 ? 'ink' : 'muted'} weight="bold">
                  {label}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <SectionHeading eyebrow="Safety support" title="File a trade dispute" />
        <SelectField label="Trade offer" value={trade} options={trades} onChange={setTrade} placeholder="Select a completed trade" />
        <SelectField label="Reason" value={reason} options={reasons} onChange={setReason} />
        <TextField
          label="What happened?"
          multiline
          value={details}
          onChangeText={setDetails}
          placeholder="Include dates, agreements, and what resolution you are requesting…"
        />
        <Pressable
          onPress={() => void pickImages(5 - evidence.length).then((uris) => setEvidence((current) => [...current, ...uris].slice(0, 5)))}
          style={[styles.upload, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
          <ImagePlus size={22} color={colors.orange} />
          <View style={styles.flex}>
            <AppText variant="h3">Attach evidence</AppText>
            <AppText variant="caption">Up to 5 photos</AppText>
          </View>
        </Pressable>
        {evidence.length ? (
          <View style={styles.evidence}>
            {evidence.map((uri, index) => (
              <Pressable key={uri + index} onPress={() => setEvidence((current) => current.filter((_, i) => i !== index))} style={styles.thumb}>
                <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={[styles.remove, { backgroundColor: colors.scrim }]}>
                  <X size={11} color={colors.onPhoto} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Button label="Submit dispute" icon={ShieldCheck} loading={submitting} onPress={() => void submit()} />
        <View style={styles.row}>
          <AlertTriangle size={13} color={colors.muted} />
          <AppText variant="caption">Disputes can be filed within 7 days of trade completion.</AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upload: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 14 },
  evidence: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden' },
  remove: { position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stage: { alignItems: 'center', gap: 6, flex: 1 },
  stageDot: { width: 16, height: 16, borderRadius: 8 },
});
