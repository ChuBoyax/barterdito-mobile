import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';

import { EventCard, HeroBanner } from '@/components/marketplace';
import { LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useToast } from '@/providers';
import { communityService } from '@/services';

export default function EventsScreen() {
  const { requireAuth } = useAuth();
  const showToast = useToast();
  const { data: events = [], loading } = useAsync(['communityService.getEvents'], () => communityService.getEvents());
  const [going, setGoing] = useState<string[]>([]);

  function rsvp(id: string) {
    requireAuth(() => {
      if (going.includes(id)) return;
      setGoing((current) => [...current, id]);
      void communityService.rsvpEvent(id).then(() => showToast('You’re on the guest list!'));
    });
  }

  return (
    <Screen>
      <HeroBanner
        badge="Swap in person"
        tone="green"
        icon={CalendarDays}
        title="Meet your trading community"
        text="Browse, barter, and build trust at verified local events."
      />
      {loading ? (
        <LoadingView variant="cards" inline />
      ) : (
        events.map((event) => <EventCard key={event.id} event={event} going={going.includes(event.id)} onRsvp={() => rsvp(event.id)} />)
      )}
    </Screen>
  );
}
