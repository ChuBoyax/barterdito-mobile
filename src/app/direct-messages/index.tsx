import { Redirect } from 'expo-router';

/** Private messages live in Inbox › Messages, as on the website. */
export default function DirectMessagesScreen() {
  return <Redirect href="/inbox?tab=messages" />;
}
