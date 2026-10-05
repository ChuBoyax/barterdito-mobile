import { router } from 'expo-router';
import { Inbox, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { OfferCard } from '@/components/marketplace';
import { EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { tradeService } from '@/services';
import type { Offer, OfferStatus } from '@/types/models';

type Tab = 'received' | 'sent';

// Offers that still need something from the user come first.
const statusOrder: Record<OfferStatus, number> = { Pending: 0, Accepted: 1, Completed: 2, Declined: 3 };

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
  const { data: offers = [], loading, setData, reload } = useAsync(() => tradeService.getOffers(), []);

  const list = useMemo(
    () => offers.filter((offer) => offer.received === (tab === 'received')).sort((a, b) => statusOrder[a.status] - statusOrder[b.status]),
    [offers, tab],
  );
  // Badge counts only show what needs attention, not every offer ever made.
  const receivedPending = offers.filter((offer) => offer.received && offer.status === 'Pending').length;
  const sentActive = offers.filter((offer) => !offer.received && (offer.status === 'Pending' || offer.status === 'Accepted')).length;

  async function applyStatus(offer: Offer, status: OfferStatus) {
    setBusyId(offer.id);
    try {
      const updated = await tradeService.updateOfferStatus(offer.id, status);
      setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      const first = offer.person.split(' ')[0];
      if (status === 'Accepted') showToast(`Offer accepted. Plan a meetup with ${first}.`);
      if (status === 'Declined') showToast(`Offer declined. ${first} has been notified.`);
      if (status === 'Completed') router.push(`/trade-complete/${offer.id}`);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  function updateOffer(offer: Offer, status: OfferStatus) {
    if (status === 'Declined') {
      Alert.alert('Decline this offer?', `${offer.person} will be notified. This can't be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => void applyStatus(offer, status) },
      ]);
      return;
    }
    if (status === 'Completed') {
      Alert.alert('Mark trade as completed?', `Only confirm once you've exchanged items with ${offer.person}.`, [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Confirm', onPress: () => void applyStatus(offer, status) },
      ]);
      return;
    }
    void applyStatus(offer, status);
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
          { value: 'received', label: 'Received', count: receivedPending || undefined },
          { value: 'sent', label: 'Sent', count: sentActive || undefined },
        ]}
      />
      {loading && !offers.length ? (
        <LoadingView label="Loading offers…" />
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
            onUpdate={(status) => updateOffer(offer, status)}
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
