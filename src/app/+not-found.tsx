import { router, Stack } from 'expo-router';
import { Compass, MapPin } from 'lucide-react-native';

import { EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen>
        <EmptyState
          icon={MapPin}
          title="This page wandered off"
          text="The link may be broken or the listing was already traded."
          action="Back to browse"
          actionIcon={Compass}
          onAction={() => router.navigate('/')}
        />
      </Screen>
    </>
  );
}
