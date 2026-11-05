import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDownUp, CircleCheck, Inbox, ListFilter, RotateCcw, Search, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { AcceptOfferSheet, CloseOfferSheet, TradeOfferCard } from '@/components/trades';
import { Button, EmptyState, FilterButton, FilterMenuSheet, ListRow, LoadingView, Screen, SearchField, SegmentedControl, SelectField } from '@/components/ui';
import { queryClient, useAuth, useMarketplaceActions, useTheme, useToast } from '@/providers';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { tradeService } from '@/services';
import { neu } from '@/theme';
import type { OfferAction, OfferCloseKind, OfferDirection, OfferFilter, OfferSort, OffersPage, TradeOffer } from '@/types/trades';
import { errorMessage } from '@/utils/format';
import { offerCloseLabels, offerFilterFor, offerFilterLabels } from '@/utils/trades';
import { queryKeys } from '@/services/queryKeys';

const filterOptions = Object.keys(offerFilterLabels) as OfferFilter[];
const SEARCH_DELAY_MS = 350;

export default function OffersScreen() {
  return (
    <RequireAuth>
      <OffersContent />
    </RequireAuth>
  );
}

const selectOffers = (page: OffersPage) => page.offers;

type Filters = { status: OfferFilter; search: string; sort: OfferSort; needsAction: boolean };
const defaultFilters = (): Filters => ({ status: 'pending', search: '', sort: 'newest', needsAction: false });

function OffersContent() {
  const { colors } = useTheme();
  const showToast = useToast();
  const { user } = useAuth();
  const { refresh: refreshListings } = useMarketplaceActions();
  const [filterOpen, setFilterOpen] = useState(false);
  const params = useLocalSearchParams<{ tab?: OfferDirection; offer?: string }>();
  const [tab, setTab] = useState<OfferDirection>(params.tab === 'sent' ? 'sent' : 'received');
  // Received and Sent each keep their own filters.
  const [filters, setFilters] = useState<Record<OfferDirection, Filters>>({ received: defaultFilters(), sent: defaultFilters() });
  const { status: statusFilter, search, sort, needsAction } = filters[tab];
  const update = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, [tab]: { ...current[tab], ...patch } }));
  const [applied, setApplied] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [closing, setClosing] = useState<{ id: string; kind: OfferCloseKind } | null>(null);
  const [focused, setFocused] = useState<TradeOffer | null>(null);
  const focusedFor = useRef('');

  useEffect(() => {
    const timer = setTimeout(() => setApplied(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const query = usePagedQuery(
    queryKeys.offers(tab, statusFilter, applied, sort, needsAction),
    (offset) => tradeService.getOffers(tab, offset, { status: statusFilter, query: applied, sort, needsAction }),
    selectOffers,
  );
  // The badges count every proposal, so they stay put while another filter loads.
  const filterCount = [statusFilter !== 'pending', sort !== 'newest', needsAction].filter(Boolean).length;
  const counts = useRef<{ receivedCount: number; sentCount: number } | null>(null);
  if (query.firstPage) counts.current = query.firstPage;

  // This tab stays mounted, so a later `/offers?tab=…` link arrives as a param change. Clearing it lets the same link work again.
  useEffect(() => {
    if (!params.tab) return;
    const next = params.tab === 'sent' ? 'sent' : 'received';
    setTab(next);
    setFilters((current) => ({ ...current, [next]: defaultFilters() }));
    router.setParams({ tab: undefined });
  }, [params.tab]);

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
        const direction = offer.recipient.id === userId ? 'received' : 'sent';
        setTab(direction);
        setFilters((current) => ({ ...current, [direction]: { ...defaultFilters(), status: offerFilterFor(offer) } }));
      })
      .catch((caught) => active && showToast(errorMessage(caught, 'Could not load this proposal.')));
    return () => {
      active = false;
    };
  }, [params.offer, user?.id, showToast]);

  // Keep the linked offer on top in the plain newest list; searches and sorted results keep the backend's order.
  const pinned =
    focused && user && focused.id === params.offer && !applied && !needsAction && sort === 'newest' && (statusFilter === 'all' || offerFilterFor(focused) === statusFilter) &&
    (tab === 'received' ? focused.recipient.id === user.id : focused.proposer.id === user.id)
      ? focused
      : null;
  const offers = pinned ? [pinned, ...query.rows.filter((offer) => offer.id !== pinned.id)] : query.rows;

  function open(offer: TradeOffer, action: OfferAction) {
    if (action === 'accept') return setReviewing(offer.id);
    setClosing({ id: offer.id, kind: action === 'decline' ? 'decline' : offer.status === 'accepted' ? 'cancel' : 'withdraw' });
  }

  function changed(updated: TradeOffer) {
    if (focused?.id === updated.id) setFocused(updated);
    // Accepting reserves items and can close other proposals for them.
    void queryClient.invalidateQueries({ queryKey: queryKeys.offers() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.myItems });
    void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    void refreshListings();
  }

  function accepted(updated: TradeOffer) {
    setReviewing(null);
    changed(updated);
    showToast('Trade accepted. Both items are now reserved.');
    router.push(`/messages/${updated.id}`);
  }

  function resolved(updated: TradeOffer, kind: OfferCloseKind) {
    setClosing(null);
    changed(updated);
    // Follow the offer to its new status so the result stays visible.
    if (!needsAction) update({ status: offerFilterFor(updated) });
    showToast(offerCloseLabels[kind].done);
  }

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      header={<AppHeader title="Trade Offers" />}>
      <View style={[styles.panel, { backgroundColor: colors.surface }, neu(colors, 2)]}>
        <SegmentedControl<OfferDirection>
          value={tab}
          onChange={(next) => {
            setTab(next);
            setApplied(filters[next].search.trim());
          }}
          segments={[
            { value: 'received', label: 'Received', count: counts.current?.receivedCount || undefined },
            { value: 'sent', label: 'Sent', count: counts.current?.sentCount || undefined },
          ]}
        />
        <View style={styles.tools}>
          <SearchField value={search} onChangeText={(value) => update({ search: value })} placeholder="Search items or traders" />
          <FilterButton count={filterCount} onPress={() => setFilterOpen(true)} />
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
              <TradeOfferCard key={offer.id} offer={offer} userId={user.id} onRespond={(action) => open(offer, action)} />
            ))}
            {query.hasNextPage ? (
              <Button label="Load more offers" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
            ) : null}
          </>
        ) : applied ? (
          <EmptyState
            icon={Search}
            title="No matching offers"
            text="Try another item or trader, clear your search, or choose a different status."
            action="Clear search"
            actionIcon={Search}
            onAction={() => {
              update({ search: '' });
              setApplied('');
            }}
          />
        ) : needsAction ? (
          <EmptyState
            icon={CircleCheck}
            title="No offers need your action"
            text="You’re caught up for this direction and status. Try another status, switch tabs, or show all offers."
            action="Show all offers"
            actionIcon={ListFilter}
            onAction={() => update({ needsAction: false })}
          />
        ) : statusFilter !== 'all' ? (
          <EmptyState
            icon={tab === 'received' ? Inbox : Send}
            title={`No ${offerFilterLabels[statusFilter].toLowerCase()} ${tab} offers`}
            text="Offers matching this status will appear here. Choose another filter to view your other offers."
            action="Show all offers"
            actionIcon={ArrowDownUp}
            onAction={() => update({ status: 'all' })}
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
      </View>
      <FilterMenuSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter and sort offers"
        count={filterCount}
        onReset={() => update({ status: 'pending', sort: 'newest', needsAction: false })}>
        <SelectField
          label="Status"
          value={offerFilterLabels[statusFilter]}
          options={filterOptions.map((status) => offerFilterLabels[status])}
          onChange={(label) => update({ status: filterOptions.find((status) => offerFilterLabels[status] === label) ?? 'all' })}
        />
        <SelectField label="Sort by" value={sort === 'newest' ? 'Newest first' : 'Oldest first'} options={['Newest first', 'Oldest first']} onChange={(label) => update({ sort: label === 'Oldest first' ? 'oldest' : 'newest' })} />
        <ListRow
          icon={CircleCheck}
          title="Needs your action"
          toggle={{ value: needsAction, onChange: (value) => update({ needsAction: value, ...(value ? { status: 'all' as const } : {}) }) }}
        />
      </FilterMenuSheet>
      {reviewing ? <AcceptOfferSheet key={reviewing} id={reviewing} onClose={() => setReviewing(null)} onAccepted={accepted} /> : null}
      {closing && user ? (
        <CloseOfferSheet
          key={closing.id}
          id={closing.id}
          userId={user.id}
          kind={closing.kind}
          onClose={() => setClosing(null)}
          onResolved={(updated) => resolved(updated, closing.kind)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 12, borderRadius: 20, padding: 12 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
