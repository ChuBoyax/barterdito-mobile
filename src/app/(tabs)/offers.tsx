import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';

import { AppHeader, RequireAuth } from '@/components/layout';
import { OfferCard } from '@/components/marketplace';
import { EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { tradeService } from '@/services';
import type { Offer, OfferStatus } from '@/types/models';

type Tab = 'received' | 'sent';

export default function OffersScreen() {
  return (
    <RequireAuth>
      <OffersContent />
    </RequireAuth>
  );
}

function OffersContent() {
  const showToast = useToast();
  const [tab, setTab] = useState<Tab>('received');
  const { data: offers = [], loading, setData, reload } = useAsync(() => tradeService.getOffers(), []);
  const list = offers.filter((offer) => offer.received === (tab === 'received'));

  async function updateOffer(offer: Offer, status: OfferStatus) {
    const updated = await tradeService.updateOfferStatus(offer.id, status);
    setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    showToast(`Offer ${status.toLowerCase()}`);
    if (status === 'Accepted') router.push(`/messages/${offer.id}`);
    if (status === 'Completed') router.push(`/trade-complete/${offer.id}`);
  }

  return (
    <Screen
      refreshing={loading}
      onRefresh={() => void reload()}
      header={<AppHeader eyebrow="Your swaps" title="Trade Offers" subtitle="Review proposals, accept fair swaps, and plan safe meetups." />}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'received', label: 'Received', count: offers.filter((offer) => offer.received).length },
          { value: 'sent', label: 'Sent', count: offers.filter((offer) => !offer.received).length },
        ]}
      />
      {loading && !offers.length ? (
        <LoadingView label="Loading offers…" />
      ) : list.length ? (
        list.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onChat={() => router.push(`/messages/${offer.id}`)}
            onMeetup={() => router.push(`/meetups/${offer.id}`)}
            onUpdate={(status) => void updateOffer(offer, status)}
          />
        ))
      ) : (
        <EmptyState
          icon={ArrowRight}
          title={tab === 'received' ? 'No offers yet' : 'No sent offers'}
          text="Browse the marketplace and propose a trade to get started."
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      )}
    </Screen>
  );
}
