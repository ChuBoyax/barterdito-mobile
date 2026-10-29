import { router, useLocalSearchParams } from 'expo-router';
import { Inbox, RotateCcw, Send } from 'lucide-react-native';
import { useState } from 'react';

import { AppHeader, RequireAuth } from '@/components/layout';
import { TradeOfferCard } from '@/components/trades';
import { Button, EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { queryClient, useAuth, useMarketplaceActions, useToast } from '@/providers';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { tradeService } from '@/services';
import type { OfferAction, OfferDirection, OffersPage, TradeOffer } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

export default function OffersScreen() {
  return (
    <RequireAuth>
      <OffersContent />
    </RequireAuth>
  );
}

const toasts: Record<OfferAction, string> = {
  accept: 'Trade accepted. Both items are now reserved.',
  decline: 'Proposal declined.',
  cancel: 'Proposal cancelled.',
};

const selectOffers = (page: OffersPage) => page.offers;

function OffersContent() {
  const showToast = useToast();
  const { user } = useAuth();
  const { refresh: refreshListings } = useMarketplaceActions();
  const params = useLocalSearchParams<{ tab?: OfferDirection }>();
  const [tab, setTab] = useState<OfferDirection>(params.tab === 'sent' ? 'sent' : 'received');
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = usePagedQuery(queryKeys.offers(tab), (offset) => tradeService.getOffers(tab, offset), selectOffers);
  const offers = query.rows;
  const counts = query.firstPage;

  async function respond(offer: TradeOffer, action: OfferAction) {
    if (busyId || !user) return;
    if (action === 'cancel' && offer.status === 'accepted') {
      const ok = await confirmAction({
        title: 'Cancel this trade?',
        message: 'The accepted trade will be cancelled and both items become available again.',
        confirmLabel: 'Cancel trade',
        cancelLabel: 'Keep trade',
        destructive: true,
      });
      if (!ok) return;
    }
    setBusyId(offer.id);
    try {
      const updated = await tradeService.respond(offer.id, action);
      queryClient.setQueryData(queryKeys.offers(tab), (current: typeof query.data) =>
        current && { ...current, pages: current.pages.map((page) => ({ ...page, offers: page.offers.map((entry) => (entry.id === updated.id ? updated : entry)) })) },
      );
      // Accepting reserves items and can close other proposals for them.
      void queryClient.invalidateQueries({ queryKey: queryKeys.offers() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myItems });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      void refreshListings();
      showToast(toasts[action]);
      if (action === 'accept') router.push(`/messages/${offer.id}`);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not update this proposal. Please try again.'));
      void query.refetch();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      header={<AppHeader eyebrow="Your swaps" title="Trade Offers" subtitle="Review proposals, accept fair swaps, and plan safe meetups." />}>
      <SegmentedControl<OfferDirection>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'received', label: 'Received', count: counts?.receivedCount || undefined },
          { value: 'sent', label: 'Sent', count: counts?.sentCount || undefined },
        ]}
      />
      {query.isPending ? (
        <LoadingView variant="cards" inline label="Loading offers" />
      ) : query.isError && !offers.length ? (
        <EmptyState
          icon={Inbox}
          title="Could not load offers"
          text={errorMessage(query.error)}
          action="Try again"
          actionIcon={RotateCcw}
          onAction={() => void query.refetch()}
        />
      ) : offers.length && user ? (
        <>
          {offers.map((offer) => (
            <TradeOfferCard
              key={offer.id}
              offer={offer}
              userId={user.id}
              busy={busyId === offer.id}
              disabled={Boolean(busyId)}
              onRespond={(action) => void respond(offer, action)}
            />
          ))}
          {query.hasNextPage ? (
            <Button label="Load more offers" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          ) : null}
        </>
      ) : tab === 'received' ? (
        <EmptyState
          icon={Inbox}
          title="No received proposals yet"
          text="When someone offers an item for yours, their proposal will appear here."
          action="My items"
          onAction={() => router.navigate('/my-items')}
        />
      ) : (
        <EmptyState
          icon={Send}
          title="You have not sent a proposal yet"
          text="Find an item you like and offer one of your active listings."
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      )}
    </Screen>
  );
}
