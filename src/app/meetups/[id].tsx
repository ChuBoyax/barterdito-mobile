import { Redirect, useLocalSearchParams } from 'expo-router';

/** Meetups are now arranged in the trade chat; older notifications still link here. */
export default function MeetupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/messages/${id}`} />;
}
