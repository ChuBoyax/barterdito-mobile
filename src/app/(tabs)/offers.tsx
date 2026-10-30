import { router, useLocalSearchParams } from 'expo-router';
import { Inbox, ListFilter, RotateCcw, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { TradeOfferCard } from '@/components/trades';
import { Button, ChipRow, EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { queryClient, useAuth, useMarketplaceActions, useToast } from '@/providers';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useResponsive } from '@/hooks/useResponsive';
import { tradeService } from '@/services';
import type { OfferAction, OfferDirection, OfferFilter, OffersPage, TradeOffer } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';
import { offerFilterFor, offerFilterLabels } from '@/utils/trades';
import { queryKeys } from '@/services/queryKeys';

const filterOptions = Object.keys(offerFilterLabels) as OfferFilter[];

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
  const { gutter } = useResponsive();
  const params = useLocalSearchParams<{ tab?: OfferDirection; offer?: string }>();
  const [tab, setTab] = useState<OfferDirection>(params.tab === 'sent' ? 'sent' : 'received');
  // Like the website, both tabs open on All, which also keeps declined/unavailable history.
  const [statusFilter, setStatusFilter] = useState<OfferFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [focused, setFocused] = useState<TradeOffer | null>(null);
  const focusedFor = useRef('');
  const key = queryKeys.offers(tab, statusFilter);
  const query = usePagedQuery(key, (offset) => tradeService.getOffers(tab, offset, statusFilter), selectOffers);
  const counts = query.firstPage;

  // A notification link (`?tab=…&offer=…`) opens the tab and filter that offer currently belongs to.
  useEffect(() => {
    const offerId = params.offer;
    const userId = user?.id;
    if (!offerId || !userId) return;
    let active = true;
    tradeService
      .getOffer(offerId)
      .then((offer) => {
        if (!active) return;
        setFocused(offer);
        if (focusedFor.current === offerId) return;
        focusedFor.current = offerId;
        setTab(offer.recipient.id === userId ? 'received' : 'sent');
        setStatusFilter(offerFilterFor(offer));
      })
      .catch((caught) => active && showToast(errorMessage(caught, 'Could not load this proposal.')));
    return () => {
      active = false;
    };
  }, [params.offer, user?.id, showToast]);

  // Keep the linked offer on top while it matches the current tab and filter.
  const pinned =
    focused && user && focused.id === params.offer && (statusFilter === 'all' || offerFilterFor(focused) === statusFilter) &&
    (tab === 'received' ? focused.recipient.id === user.id : focused.proposer.id === user.id)
      ? focused
      : null;
  const offers = pinned ? [pinned, ...query.rows.filter((offer) => offer.id !== pinned.id)] : query.rows;

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
      queryClient.setQueryData(key, (current: typeof query.data) =>
        current && { ...current, pages: current.pages.map((page) => ({ ...page, offers: page.offers.map((entry) => (entry.id === updated.id ? updated : entry)) })) },
      );
      if (focused?.id === updated.id) setFocused(updated);
      // Follow the offer to its new status so the result stays visible.
      if (action !== 'accept') setStatusFilter(offerFilterFor(updated));
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
      <View style={{ marginHorizontal: -gutter }}>
        <ChipRow
          inset={gutter}
          options={filterOptions.map((status) => offerFilterLabels[status])}
          value={offerFilterLabels[statusFilter]}
          onChange={(label) => setStatusFilter(filterOptions.find((status) => offerFilterLabels[status] === label) ?? 'all')}
        />
      </View>
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
      ) : statusFilter !== 'all' ? (
        <EmptyState
          icon={tab === 'received' ? Inbox : Send}
          title={`No ${offerFilterLabels[statusFilter].toLowerCase()} ${tab} offers`}
          text="Offers matching this status will appear here. Choose another filter to view your other offers."
          action="Show all offers"
          actionIcon={ListFilter}
          onAction={() => setStatusFilter('all')}
        />
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
