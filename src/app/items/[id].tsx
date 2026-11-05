import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  Heart,
  MapPin,
  Maximize2,
  Package,
  Share2,
  ShieldCheck,
  Star,
  Tag,
  User,
  UserCheck,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProposeSwapSheet, ReportSheet } from '@/components/marketplace';
import { AppText, Avatar, Badge, Button, EmptyState, IconButton, LoadingView, PressableScale, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useResponsive } from '@/hooks/useResponsive';
import { queryClient, useAuth, useMarketplace, useTheme, useToast } from '@/providers';
import { itemService, tradeService, userService } from '@/services';
import { fonts, maxFontScale, neu } from '@/theme';
import { errorMessage } from '@/utils/format';
import { openItem } from '@/utils/navigation';
import { proposalReturn } from '@/utils/proposalReturn';
import { shareItem } from '@/utils/share';
import { queryKeys } from '@/services/queryKeys';

/** The dark glass over photos; the same in both themes so it reads on any picture. */
const GLASS = 'rgba(30, 27, 24, 0.84)';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width, contentWidth, innerWidth, gutter } = useResponsive();
  const { requireAuth, authenticated } = useAuth();
  const showToast = useToast();
  const { items, savedIds, heartedIds, counts, toggleSaved, toggleHeart, recordView } = useMarketplace();
  const { data: fetched, loading, error } = useAsync(queryKeys.item(id), () => itemService.getItem(id));
  const [activeImage, setActiveImage] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapSeed, setSwapSeed] = useState<{ selected: string | null; message: string }>({ selected: null, message: '' });
  // Set while the user is adding a listing from the proposal; the proposal reopens on return.
  const pendingProposal = useRef<{ message: string } | null>(null);
  const galleryRef = useRef<ScrollView>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const swapMounted = useMountOnOpen(swapOpen);
  const reportMounted = useMountOnOpen(reportOpen);

  // The fetched detail is authoritative; the feed copy only fills in while it loads.
  const item = fetched ?? items.find((entry) => entry.id === id);
  const ownerId = item?.userId;
  const loadedId = item?.id;

  useEffect(() => {
    if (loadedId) recordView(loadedId);
  }, [loadedId, recordView]);

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
  const hearts = counts[item.id]?.hearts ?? item.hearts;
  const views = counts[item.id]?.views ?? item.views;
  const more = items.filter((other) => other.userId === item.userId && other.id !== item.id && other.status !== 'Traded');
  const photoHeight = Math.round(Math.min(innerWidth, height * 0.7));
  const sideInset = Math.max(gutter, (width - contentWidth) / 2 + gutter);

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

  function showPhoto(index: number) {
    setActiveImage(index);
    galleryRef.current?.scrollTo({ x: index * innerWidth, animated: true });
  }

  const viewTrader = () => item.userId && router.push(`/traders/${item.userId}`);
  const unavailable = item.status !== 'Active';
  const primaryLabel = item.mine ? 'Your listing' : unavailable ? 'Not available for trade' : 'Propose a Trade';
  const FollowIcon = item.mine ? User : following ? UserCheck : UserPlus;
  const statusTone = item.status === 'Active' ? { bg: colors.greenSoft, fg: colors.green } : { bg: colors.orangeSoft, fg: colors.orange };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { maxWidth: contentWidth, paddingHorizontal: gutter, paddingTop: insets.top + 8, paddingBottom: ACTION_BAR_SPACE + Math.max(insets.bottom, 12) },
        ]}>
        <View style={styles.head}>
          <IconButton icon={ArrowLeft} label="Go back" dimension={42} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[styles.title, { color: colors.ink }]}>
            {item.title}
          </Text>
        </View>

        <View style={styles.owner}>
          <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.owner}’s profile`} onPress={viewTrader} style={styles.ownerLink}>
            <Avatar initials={item.ownerAvatar} imageUrl={item.ownerAvatarUrl} size="medium" />
            <View style={styles.flex}>
              <AppText variant="h3" weight="bold" numberOfLines={1}>
                {item.owner}
              </AppText>
              <View style={styles.rating}>
                <Star size={14} color={colors.orange} fill={item.rating == null ? 'none' : colors.orange} />
                <AppText variant="caption" numberOfLines={1} style={styles.flex}>
                  {item.rating ?? 'No reviews'} · {item.trades} completed trades
                </AppText>
              </View>
            </View>
          </Pressable>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={item.mine ? 'View profile' : following ? `Unfollow ${item.owner}` : `Follow ${item.owner}`}
            accessibilityState={{ selected: following, disabled: followBusy }}
            disabled={followBusy}
            onPress={item.mine ? viewTrader : toggleFollow}
            scaleTo={0.95}
            style={[styles.follow, { backgroundColor: colors.surface }, neu(colors, 1), followBusy && styles.dimmed]}>
            <FollowIcon size={18} color={following ? colors.orange : colors.ink} />
            <AppText variant="caption" color={following ? 'orange' : 'ink'} weight="bold" numberOfLines={1}>
              {item.mine ? 'View profile' : following ? 'Following' : 'Follow'}
            </AppText>
          </PressableScale>
        </View>

        <View>
          <View style={[styles.photoShadow, { height: photoHeight, backgroundColor: colors.surface2 }, neu(colors, 2)]}>
            <View style={styles.photoClip}>
              <ScrollView
                ref={galleryRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => setActiveImage(Math.round(event.nativeEvent.contentOffset.x / innerWidth))}>
                {gallery.map((uri, index) => (
                  <Pressable key={uri + index} accessibilityRole="imagebutton" accessibilityLabel={`${item.title} photo ${index + 1}, view full size`} onPress={() => setViewerOpen(true)}>
                    <Image source={uri} cachePolicy="memory-disk" priority={index === 0 ? 'high' : 'normal'} style={{ width: innerWidth, height: photoHeight }} contentFit="cover" transition={250} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View pointerEvents="none" style={styles.badges}>
              <PhotoBadge label={item.category} background={colors.orangeSoft} color={colors.orange} />
              <PhotoBadge label={item.status} background={statusTone.bg} color={statusTone.fg} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="View photo" hitSlop={6} onPress={() => setViewerOpen(true)} style={styles.zoom}>
              <Maximize2 size={16} color={colors.onPhoto} strokeWidth={2.25} />
            </Pressable>
            {activeImage > 0 ? <GalleryArrow icon={ChevronLeft} label="Previous photo" side="left" onPress={() => showPhoto(activeImage - 1)} /> : null}
            {activeImage < gallery.length - 1 ? <GalleryArrow icon={ChevronRight} label="Next photo" side="right" onPress={() => showPhoto(activeImage + 1)} /> : null}

            <View pointerEvents="none" style={styles.photoMetaWrap}>
              <View style={styles.photoMeta}>
                <View style={styles.photoMetaEntry}>
                  <Clock size={14} color={colors.onPhoto} />
                  <Text maxFontSizeMultiplier={maxFontScale} style={[styles.photoMetaText, { color: colors.onPhoto }]}>
                    Posted {item.age}
                  </Text>
                </View>
                <View style={styles.photoMetaEntry}>
                  <Eye size={14} color={colors.onPhoto} />
                  <Text maxFontSizeMultiplier={maxFontScale} style={[styles.photoMetaText, { color: colors.onPhoto }]}>
                    {views} {views === 1 ? 'view' : 'views'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.photoActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Heart item, ${hearts} ${hearts === 1 ? 'heart' : 'hearts'}`}
                accessibilityState={{ selected: hearted }}
                onPress={() => toggleHeart(item)}
                style={styles.photoHeart}>
                <Heart size={18} color={hearted ? colors.orange : colors.onPhoto} fill={hearted ? colors.orange : 'none'} />
                <Text maxFontSizeMultiplier={1.2} style={[styles.photoHeartCount, { color: hearted ? colors.orange : colors.onPhoto }]}>
                  {hearts}
                </Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved items' : 'Save item'} accessibilityState={{ selected: saved }} onPress={toggleSave} style={styles.photoAction}>
                <Bookmark size={18} color={saved ? colors.orange : colors.onPhoto} fill={saved ? colors.orange : 'none'} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Share item" onPress={() => void shareItem(item)} style={styles.photoAction}>
                <Share2 size={18} color={colors.onPhoto} />
              </Pressable>
            </View>
          </View>

          {gallery.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {gallery.map((uri, index) => (
                <Pressable
                  key={uri + index}
                  accessibilityRole="button"
                  accessibilityLabel={`Show photo ${index + 1}`}
                  accessibilityState={{ selected: activeImage === index }}
                  onPress={() => showPhoto(index)}
                  style={[styles.thumb, { backgroundColor: colors.surface2 }, activeImage === index ? { borderColor: colors.orange } : styles.thumbIdle]}>
                  <Image source={uri} cachePolicy="memory-disk" style={styles.fill} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.location}>
          <MapPin size={16} color={colors.orange} style={styles.locationIcon} />
          <AppText variant="small" style={styles.flex}>
            {item.location || 'Trader location not added'}
          </AppText>
        </View>

        <View style={styles.facts}>
          <View style={[styles.leadBorder, { backgroundColor: colors.surface, borderColor: `${colors.orange}55` }]}>
            <LinearGradient colors={[`${colors.orange}24`, `${colors.yellow}24`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }} style={styles.lead}>
              <View style={styles.leadMark}>
                <ArrowLeftRight size={60} color={colors.orange} strokeWidth={1.5} opacity={0.22} />
              </View>
              <View style={styles.factLabel}>
                <ArrowLeftRight size={15} color={colors.orange} />
                <AppText variant="caption" color="ink" weight="semibold">
                  Looking for
                </AppText>
              </View>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.leadValue, { color: colors.ink }]}>
                {item.wanted.trim() || 'Not specified'}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.factRow}>
            <Fact icon={BadgeCheck} label="Condition" value={item.condition} />
            <Fact icon={Tag} label="Category" value={item.category} />
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" weight="bold">
            About this item
          </AppText>
          <AppText variant="body" style={styles.description}>
            {item.description}
          </AppText>
          {item.tags?.length ? (
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} tone="neutral" />
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.safe, { backgroundColor: colors.greenSoft }]}>
          <ShieldCheck size={23} color={colors.green} />
          <View style={styles.flex}>
            <AppText variant="small" color="green" weight="bold">
              Trade safely
            </AppText>
            <AppText variant="caption" color="green">
              Meet in a public place, inspect the item, and confirm together in Barterdito.
            </AppText>
          </View>
        </View>

        {more.length ? (
          <View>
            <SectionHeading eyebrow="Discover" title={`More from ${item.owner}`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -gutter }} contentContainerStyle={[styles.moreRow, { paddingHorizontal: gutter }]}>
              {more.map((other) => (
                <PressableScale
                  key={other.id}
                  accessibilityRole="button"
                  accessibilityLabel={other.title}
                  onPress={() => openItem(other)}
                  style={[styles.mini, { width: Math.round(innerWidth * 0.78), backgroundColor: colors.surface }, neu(colors, 1)]}>
                  <Image source={other.image} cachePolicy="memory-disk" style={[styles.miniImage, { backgroundColor: colors.surface2 }]} contentFit="cover" />
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
      </ScrollView>

      <View style={[styles.actionbar, { bottom: Math.max(insets.bottom, 12), left: sideInset, right: sideInset, backgroundColor: colors.surface }, neu(colors, 2)]}>
        <Button label={primaryLabel} icon={ArrowRight} style={styles.flex} disabled={!item.mine && unavailable} onPress={primaryAction} />
        {!item.mine ? <IconButton icon={Flag} label="Report this item" dimension={48} onPress={() => requireAuth(() => setReportOpen(true))} /> : null}
      </View>

      {viewerOpen ? <PhotoViewer images={gallery} title={item.title} initial={activeImage} onClose={() => setViewerOpen(false)} onSelect={showPhoto} /> : null}

      {swapMounted ? (
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
      ) : null}

      {reportMounted ? (
        <ReportSheet
          visible={reportOpen}
          title="Report this item"
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason, details) => {
            await itemService.reportItem(item.id, reason, details);
            showToast(`Report submitted: ${reason}`);
          }}
        />
      ) : null}
    </View>
  );
}

function PhotoBadge({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <View style={[styles.photoBadge, { backgroundColor: background }]}>
      <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.photoBadgeText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

function GalleryArrow({ icon: Icon, label, side, onPress }: { icon: LucideIcon; label: string; side: 'left' | 'right'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.arrow, side === 'left' ? styles.arrowLeft : styles.arrowRight]}>
      <Icon size={20} color={colors.onPhoto} strokeWidth={2.25} />
    </Pressable>
  );
}

function Fact({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={styles.factMark}>
        <Icon size={68} color={colors.ink} strokeWidth={1.5} opacity={0.06} />
      </View>
      <View style={styles.factLabel}>
        <Icon size={15} color={colors.orange} />
        <AppText variant="caption" weight="semibold" numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.factValue, { color: colors.ink }]}>
        {value}
      </Text>
    </View>
  );
}

type PhotoViewerProps = { images: string[]; title: string; initial: number; onClose: () => void; onSelect: (index: number) => void };

/** Full-screen photos; the gallery behind follows whichever one is showing. */
function PhotoViewer({ images, title, initial, onClose, onSelect }: PhotoViewerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initial * width, y: 0 }}
          onMomentumScrollEnd={(event) => onSelect(Math.round(event.nativeEvent.contentOffset.x / width))}>
          {images.map((uri, index) => (
            <Image key={uri + index} source={uri} cachePolicy="memory-disk" style={{ width }} contentFit="contain" accessibilityLabel={`${title} photo ${index + 1}`} />
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} style={[styles.viewerClose, { top: insets.top + 8 }]}>
          <X size={20} color={colors.onPhoto} />
        </Pressable>
      </View>
    </Modal>
  );
}

/** Room for the floating action bar so the last section is never hidden under it. */
const ACTION_BAR_SPACE = 88;
const ARROW = 44;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  content: { width: '100%', alignSelf: 'center', gap: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, minWidth: 0, fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, letterSpacing: -0.5, textAlign: 'right' },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerLink: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  follow: { minWidth: 80, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  dimmed: { opacity: 0.6 },
  photoShadow: { width: '100%', borderRadius: 20 },
  photoClip: { ...StyleSheet.absoluteFillObject, borderRadius: 20, overflow: 'hidden' },
  badges: { position: 'absolute', top: 12, left: 12, right: 60, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoBadge: { maxWidth: '100%', minHeight: 26, justifyContent: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)' },
  photoBadgeText: { fontFamily: fonts.bold, fontSize: 12 },
  zoom: { position: 'absolute', top: 12, right: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: GLASS },
  arrow: { position: 'absolute', top: '50%', marginTop: -ARROW / 2, width: ARROW, height: ARROW, borderRadius: ARROW / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: GLASS },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  photoMetaWrap: { position: 'absolute', left: 12, right: 64, bottom: 8, alignItems: 'flex-start' },
  photoMeta: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: 12, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 6, backgroundColor: GLASS },
  photoMetaEntry: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoMetaText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
  photoActions: { position: 'absolute', right: 16, bottom: 8, borderRadius: 999, backgroundColor: GLASS },
  photoHeart: { minWidth: 44, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 4 },
  photoHeartCount: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 12 },
  photoAction: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  thumbs: { gap: 8, paddingHorizontal: 4, paddingTop: 12, paddingBottom: 4 },
  thumb: { width: 88, height: 88, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbIdle: { opacity: 0.8 },
  location: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  locationIcon: { marginTop: 2 },
  facts: { gap: 10 },
  leadBorder: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  lead: { gap: 4, paddingVertical: 14, paddingLeft: 16, paddingRight: 76 },
  leadMark: { position: 'absolute', top: 0, bottom: 0, right: 14, justifyContent: 'center' },
  leadValue: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 23, letterSpacing: -0.3 },
  factRow: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, minWidth: 0, gap: 4, overflow: 'hidden', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  factMark: { position: 'absolute', right: -10, bottom: -14 },
  factLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factValue: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22 },
  section: { gap: 8 },
  description: { fontSize: 14, lineHeight: 23 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  safe: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16 },
  moreRow: { gap: 14, paddingTop: 2, paddingBottom: 18 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 10 },
  miniImage: { width: 72, height: 64, borderRadius: 12 },
  actionbar: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, padding: 8 },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', right: 14, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: GLASS },
});
