import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { Button, Card, InfoNote, Screen, SectionHeading, TextField } from '@/components/ui';
import { useToast } from '@/providers';
import { tradeService } from '@/services';

export default function MeetupScreen() {
  return (
    <RequireAuth>
      <MeetupForm />
    </RequireAuth>
  );
}

function MeetupForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToast();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!date.trim() || !time.trim() || !location.trim()) return showToast('Add a date, time, and public location');
    setSubmitting(true);
    await tradeService.proposeMeetup({ tradeId: id, date, time, location, notes });
    setSubmitting(false);
    showToast('Meetup proposal sent to both traders');
    router.back();
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <SectionHeading eyebrow="Trade coordination" title="Choose a safe meetup" />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="Date" icon={CalendarDays} value={date} onChangeText={setDate} placeholder="Aug 02" />
          </View>
          <View style={styles.flex}>
            <TextField label="Time" icon={Clock3} value={time} onChangeText={setTime} placeholder="3:00 PM" />
          </View>
        </View>
        <TextField label="Public location" icon={MapPin} value={location} onChangeText={setLocation} placeholder="Mall entrance, barangay hall, café…" />
        <TextField label="Notes" multiline value={notes} onChangeText={setNotes} placeholder="Landmark, contact instructions, or accessibility notes…" />
        <InfoNote icon={ShieldCheck} title="Meet in a busy public place" text="Inspect both items before either trader confirms completion." />
        <Button label="Send meetup proposal" icon={CalendarDays} loading={submitting} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
