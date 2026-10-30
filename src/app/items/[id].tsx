import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Bookmark,
  Eye,
  Flag,
  Heart,
  MapPin,
  MapPinned,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemStatusBadge, ProposeSwapSheet, ReportSheet } from '@/components/marketplace';
import { AppText, Avatar, Badge, Button, EmptyState, Glass, IconButton, InfoNote, LoadingView, PhotoScrim, PressableScale, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { queryClient, useAuth, useMarketplace, useTheme, useToast } from '@/providers';
import { itemService, tradeService, userService } from '@/services';
import { elevation, fonts, maxFontScale, neu } from '@/theme';
import { errorMessage, firstName } from '@/utils/format';
import { mapLink } from '@/utils/listing';
import { proposalReturn } from '@/utils/proposalReturn';
import { shareItem } from '@/utils/share';
import { queryKeys } from '@/services/queryKeys';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height, contentWidth, gutter } = useResponsive();
  const { requireAuth, authenticated } = useAuth();
  const showToast = useToast();
  const { items, savedIds, heartedIds, toggleSaved, toggleHeart } = useMarketplace();
  const { data: fetched, loading, error } = useAsync(queryKeys.item(id), () => itemService.getItem(id));
  const [activeImage, setActiveImage] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapSeed, setSwapSeed] = useState<{ selected: string | null; message: string }>({ selected: null, message: '' });
  // Set while the user is adding a listing from the proposal; the proposal reopens on return.
  const pendingProposal = useRef<{ message: string } | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // The fetched detail is authoritative; the feed copy only fills in while it loads.
  const item = fetched ?? items.find((entry) => entry.id === id);
  const ownerId = item?.userId;

  useEffect(() => {
    if (!authenticated || !ownerId || item?.mine) return;
    let active = true;
    userService
      .getProfile(ownerId)
      .then((profile) => active && setFollowing(profile.isFollowing))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [authenticated, ownerId, item?.mine]);

  useFocusEffect(
    useCallback(() => {
      const pending = pendingProposal.current;
      if (!pending) return;
      pendingProposal.current = null;
      setSwapSeed({ selected: proposalReturn.take(), message: pending.message });
      setSwapOpen(true);
    }, []),
  );

  if (loading && !item) return <LoadingView variant="detail" />;
  if (!item) {
    return (
      <Screen>
        <EmptyState
          icon={Package}
          title={error && !/not found/i.test(error) ? 'Could not load this item' : 'Item not found'}
          text={error && !/not found/i.test(error) ? error : 'This listing may have been traded or removed.'}
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  const gallery = item.imageUrls?.length ? item.imageUrls : [item.image];
  const saved = savedIds.includes(item.id);
  const hearted = heartedIds.includes(item.id);
  const more = items.filter((other) => other.userId === item.userId && other.id !== item.id);
  const heroHeight = Math.round(Math.min(width * 1.1, height * 0.62));
  const sideInset = Math.max(14, (width - contentWidth) / 2 + 14);
  const traded = item.status === 'Traded';
  const longDescription = item.description.length > 220;

  function toggleFollow() {
    requireAuth(async () => {
      if (!ownerId || followBusy) return;
      const next = !following;
      setFollowBusy(true);
      setFollowing(next);
      try {
        const profile = await userService.setFollowing(ownerId, next);
        setFollowing(profile.isFollowing);
        showToast(next ? `Following ${item!.owner}` : `Unfollowed ${item!.owner}`);
      } catch (caught) {
        setFollowing(!next);
        showToast(errorMessage(caught, 'Could not update follow status'));
      } finally {
        setFollowBusy(false);
      }
    });
  }

  function toggleSave() {
    if (authenticated) showToast(saved ? 'Removed from your wishlist' : 'Saved to your wishlist');
    toggleSaved(item!.id);
  }

  function primaryAction() {
    if (item!.mine) return router.push('/my-items');
    requireAuth(() => {
      setSwapSeed({ selected: null, message: '' });
      setSwapOpen(true);
    });
  }

  const unavailable = item.status !== 'Active';
  const pinned = item.latitude != null && item.longitude != null;
  const primaryLabel = item.mine ? 'Manage your listing' : traded ? 'Already traded' : unavailable ? 'In negotiation' : 'Propose a swap';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ACTION_BAR_SPACE + Math.max(insets.bottom, 12) }}>
        <View style={{ height: heroHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setActiveImage(Math.round(event.nativeEvent.contentOffset.x / width))}>
            {gallery.map((uri, index) => (
              <Image key={uri + index} source={uri} cachePolicy="memory-disk" style={{ width, height: heroHeight }} contentFit="cover" transition={250} accessibilityLabel={`${item.title} photo ${index + 1}`} />
            ))}
          </ScrollView>
          <PhotoScrim position="top" />
          {gallery.length > 1 ? (
            <View style={styles.dots}>
              {gallery.map((_, index) => (
                <View key={index} style={[styles.dot, { backgroundColor: colors.onPhoto }, index === activeImage ? styles.dotActive : styles.dotIdle]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.background, maxWidth: contentWidth, paddingHorizontal: gutter }]}>
          <View style={styles.badges}>
            <Badge label={item.category} tone="orange" icon={Tag} />
            <ItemStatusBadge status={item.status} />
            {item.hot ? <Badge label="Trending" tone="red" icon={Sparkles} /> : null}
          </View>
          <AppText variant="hero">{item.title}</AppText>
          <View style={styles.metaRow}>
            <Meta icon={Eye} label={`${item.views} views`} />
            <Meta icon={Heart} label={`${item.hearts} likes`} />
          </View>

          <View style={[styles.wants, { backgroundColor: colors.orangeSoft, borderColor: colors.orange }]}>
            <View style={[styles.wantsIcon, { backgroundColor: colors.orange }]}>
              <ArrowRightLeft size={20} color={colors.onPrimary} strokeWidth={2.2} />
            </View>
            <View style={styles.flex}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.wantsLabel, { color: colors.orange }]}>LOOKING TO SWAP FOR</Text>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.wantsText, { color: colors.ink }]}>{item.wanted}</Text>
            </View>
          </View>

          <View style={styles.facts}>
            <Fact label="Condition" value={item.condition} />
            <Fact label="Posted" value={item.age} />
          </View>

          {/* Full width so long barangay/city labels never get cut off. */}
          <PressableScale
            accessibilityRole={pinned ? 'link' : undefined}
            accessibilityLabel={pinned ? `Meetup area ${item.location}. Open pickup pin in OpenStreetMap` : `Meetup area ${item.location}`}
            disabled={!pinned}
            onPress={() => pinned && void Linking.openURL(mapLink(item.latitude!, item.longitude!))}
            scaleTo={0.98}
            style={[styles.place, { backgroundColor: colors.surface }, elevation(1, colors)]}>
            <View style={[styles.placeIcon, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
              <MapPin size={18} color={colors.orange} strokeWidth={2.3} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption">Meetup area</AppText>
              <AppText variant="h3" numberOfLines={3}>
                {item.location}
              </AppText>
            </View>
            {pinned ? (
              <View style={[styles.mapChip, { backgroundColor: colors.background }, neu(colors, 1)]}>
                <MapPinned size={14} color={colors.blue} />
                <AppText variant="caption" color="blue" weight="bold">
                  Map
                </AppText>
              </View>
            ) : null}
          </PressableScale>

          {item.tags?.length ? (
            <View style={styles.badges}>
              {item.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} tone="neutral" />
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="h2">About this item</AppText>
            <AppText variant="body" color="muted" numberOfLines={longDescription && !expanded ? 4 : undefined}>
              {item.description}
            </AppText>
            {longDescription ? (
              <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} hitSlop={8}>
                <AppText variant="small" color="orange" weight="bold">
                  {expanded ? 'Show less' : 'Read more'}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <PressableScale
            onPress={() => item.userId && !item.mine && router.push(`/traders/${item.userId}`)}
            scaleTo={0.98}
            style={[styles.owner, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>
            <Avatar initials={item.ownerAvatar} imageUrl={item.ownerAvatarUrl} size="large" ring />
            <View style={styles.flex}>
              <AppText variant="eyebrow" color="muted">
                Offered by
              </AppText>
              <View style={styles.inline}>
                <AppText variant="h2">{item.owner}</AppText>
                <BadgeCheck size={16} color={colors.blue} fill={colors.blueSoft} />
              </View>
              <AppText variant="caption">{item.mine ? 'This is your listing' : 'Tap to view profile'}</AppText>
            </View>
            {!item.mine ? (
              <IconButton
                icon={following ? UserCheck : UserPlus}
                label={following ? `Unfollow ${item.owner}` : `Follow ${item.owner}`}
                active={following}
                onPress={toggleFollow}
              />
            ) : null}
          </PressableScale>

          <InfoNote icon={ShieldCheck} title="Trade safely" text="Meet in a public place, inspect the item, and confirm together in Barterdito." />

          {more.length ? (
            <View>
              <SectionHeading eyebrow="Same trader" title={`More from ${firstName(item.owner)}`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
                {more.map((other) => (
                  <PressableScale
                    key={other.id}
                    onPress={() => router.push(`/items/${other.id}`)}
                    style={[styles.mini, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>
                    <Image source={other.image} cachePolicy="memory-disk" style={styles.miniImage} contentFit="cover" />
                    <View style={styles.flex}>
                      <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                        {other.title}
                      </AppText>
                      <AppText variant="caption">{other.condition}</AppText>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {item.mine ? null : (
            <PressableScale onPress={() => requireAuth(() => setReportOpen(true))} style={styles.report}>
              <Flag size={14} color={colors.muted} />
              <AppText variant="caption" weight="bold">
                Report this listing
              </AppText>
            </PressableScale>
          )}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8, left: gutter, right: gutter }]} pointerEvents="box-none">
        <IconButton icon={ArrowLeft} label="Back" tone="glass" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={styles.topRight}>
          <IconButton
            icon={Share2}
            label="Share item"
            tone="glass"
            size={18}
            onPress={() => void shareItem(item)}
          />
          <IconButton icon={Heart} label="Heart item" tone="glass" size={18} active={hearted} filled={hearted} onPress={() => toggleHeart(item.id)} />
        </View>
      </View>

      <Glass strong intensity={70} style={[styles.actionbar, { bottom: Math.max(insets.bottom, 12), left: sideInset, right: sideInset }, elevation(3, colors)]}>
        {!item.mine ? (
          <IconButton icon={Bookmark} label={saved ? 'Remove from wishlist' : 'Save to wishlist'} active={saved} filled={saved} onPress={toggleSave} />
        ) : null}
        <Button
          label={primaryLabel}
          icon={item.mine ? Package : ArrowRightLeft}
          variant={item.mine ? 'secondary' : 'primary'}
          style={styles.flex}
          disabled={!item.mine && unavailable}
          onPress={primaryAction}
        />
      </Glass>

      <ProposeSwapSheet
        visible={swapOpen}
        onClose={() => setSwapOpen(false)}
        target={item}
        initialSelected={swapSeed.selected}
        initialMessage={swapSeed.message}
        onPostItem={(message) => {
          pendingProposal.current = { message };
          setSwapOpen(false);
          router.push('/post-item?proposal=1');
        }}
        onViewOffers={() => {
          setSwapOpen(false);
          router.navigate('/offers?tab=sent');
        }}
        onSubmit={async (offeredId, message) => {
          await tradeService.proposeTrade(item.id, offeredId, message);
          void queryClient.invalidateQueries({ queryKey: queryKeys.offers() });
        }}
      />

      <ReportSheet
        visible={reportOpen}
        title="Report this item"
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          await itemService.reportItem(item.id, reason, details);
          showToast(`Report submitted: ${reason}`);
        }}
      />
    </View>
  );
}

function Meta({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.meta, { backgroundColor: colors.surface2 }]}>
      <Icon size={13} color={colors.muted} strokeWidth={2.3} />
      <AppText variant="caption" color="ink" weight="semibold">
        {label}
      </AppText>
    </View>
  );
}

function Fact({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: colors.surface }, elevation(1, colors)]}>
      <View style={styles.inline}>
        {Icon ? <Icon size={11} color={colors.muted} strokeWidth={2.4} /> : null}
        <AppText variant="caption" numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <AppText variant="h3" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {value}
      </AppText>
    </View>
  );
}

/** Room for the floating action bar so the last section is never hidden under it. */
const ACTION_BAR_SPACE = 96;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dots: { position: 'absolute', bottom: 44, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotIdle: { opacity: 0.55 },
  dotActive: { width: 22 },
  sheet: { width: '100%', alignSelf: 'center', marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, gap: 16 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  wants: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 1, padding: 14 },
  wantsIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  wantsLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.4 },
  wantsText: { fontFamily: fonts.bold, fontSize: 15.5, lineHeight: 21, marginTop: 2 },
  facts: { flexDirection: 'row', gap: 12 },
  fact: { flex: 1, minWidth: 0, gap: 3, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14 },
  placeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mapChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  section: { gap: 8 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 26, padding: 14 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moreRow: { gap: 10 },
  mini: { width: 230, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 20, padding: 8 },
  miniImage: { width: 58, height: 58, borderRadius: 14 },
  report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  topBar: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', gap: 8 },
  actionbar: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 30, padding: 8 },
});
