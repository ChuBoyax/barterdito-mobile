import { router } from 'expo-router';
import { Inbox, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';

import { AppHeader, RequireAuth } from '@/components/layout';
import { OfferCard } from '@/components/marketplace';
import { EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { offerStatusOrder } from '@/constants/status';
import { useAsync } from '@/hooks/useAsync';
import { queryClient, useToast } from '@/providers';
import { tradeService } from '@/services';
import type { Offer, OfferStatus } from '@/types/models';
import { confirmAction, type ConfirmOptions } from '@/utils/confirm';
import { firstName } from '@/utils/format';

type Tab = 'received' | 'sent';


const confirmations: Partial<Record<OfferStatus, (offer: Offer) => ConfirmOptions>> = {
  Declined: (offer) => ({
    title: 'Decline this offer?',
    message: `${offer.person} will be notified. This can't be undone.`,
    confirmLabel: 'Decline',
    destructive: true,
  }),
  Completed: (offer) => ({
    title: 'Mark trade as completed?',
    message: `Only confirm once you've exchanged items with ${offer.person}.`,
    confirmLabel: 'Confirm',
    cancelLabel: 'Not yet',
  }),
};

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
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: offers = [], loading, refreshing, setData, reload } = useAsync(['tradeService.getOffers'], () => tradeService.getOffers());

  const list = useMemo(
    () => offers.filter((offer) => offer.received === (tab === 'received')).sort((a, b) => offerStatusOrder[a.status] - offerStatusOrder[b.status]),
    [offers, tab],
  );

  const receivedPending = offers.filter((offer) => offer.received && offer.status === 'Pending').length;
  const sentActive = offers.filter((offer) => !offer.received && (offer.status === 'Pending' || offer.status === 'Accepted')).length;

  async function applyStatus(offer: Offer, status: OfferStatus) {
    setBusyId(offer.id);
    try {
      const updated = await tradeService.updateOfferStatus(offer.id, status);
      setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
     
      queryClient.setQueryData(['tradeService.getOffer', updated.id], updated);
      const first = firstName(offer.person);
      if (status === 'Accepted') showToast(`Offer accepted. Plan a meetup with ${first}.`);
      if (status === 'Declined') showToast(`Offer declined. ${first} has been notified.`);
      if (status === 'Completed') router.push(`/trade-complete/${offer.id}`);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function updateOffer(offer: Offer, status: OfferStatus) {
    const ask = confirmations[status];
    if (ask && !(await confirmAction(ask(offer)))) return;
    await applyStatus(offer, status);
  }

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => void reload()}
      header={<AppHeader eyebrow="Your swaps" title="Trade Offers" subtitle="Review proposals, accept fair swaps, and plan safe meetups." />}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'received', label: 'Received', count: receivedPending || undefined },
          { value: 'sent', label: 'Sent', count: sentActive || undefined },
        ]}
      />
      {loading && !offers.length ? (
        <LoadingView variant="cards" inline label="Loading offers" />
      ) : list.length ? (
        list.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            busy={busyId === offer.id}
            onChat={() => router.push(`/messages/${offer.id}`)}
            onMeetup={() => router.push(`/meetups/${offer.id}`)}
            onReview={() => router.push(`/trade-review/${offer.id}`)}
            onOpenItem={(itemId) => router.push(`/items/${itemId}`)}
            onUpdate={(status) => void updateOffer(offer, status)}
          />
        ))
      ) : tab === 'received' ? (
        <EmptyState
          icon={Inbox}
          title="No offers yet"
          text="When someone wants to swap for one of your items, their offer will show up here."
          action="Post an item"
          onAction={() => router.push('/post-item')}
        />
      ) : (
        <EmptyState
          icon={Send}
          title="You haven't sent any offers"
          text="Find something you like and propose a swap with one of your items."
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      )}
    </Screen>
  );
}
