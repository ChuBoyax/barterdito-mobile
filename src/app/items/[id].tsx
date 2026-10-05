import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Bookmark,
  Eye,
  Flag,
  Heart,
  MapPin,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportSheet } from '@/components/marketplace';
import { AppText, Avatar, Badge, Button, EmptyState, Glass, IconButton, InfoNote, LoadingView, PhotoScrim, PressableScale, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth, useMarketplace, useTheme, useToast } from '@/providers';
import { itemService, tradeService, userService } from '@/services';
import { elevation, fonts, maxFontScale } from '@/theme';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height, contentWidth, gutter } = useResponsive();
  const { requireAuth } = useAuth();
  const showToast = useToast();
  const { items, savedIds, heartedIds, toggleSaved, toggleHeart } = useMarketplace();
  const { data: fetched, loading, error } = useAsync(() => itemService.getItem(id), [id]);
  const [activeImage, setActiveImage] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const item = items.find((entry) => entry.id === id) ?? fetched;
  if (loading && !item) return <LoadingView />;
  if (!item || error) {
    return (
      <Screen>
        <EmptyState icon={Package} title="Item not found" text="This listing may have been traded or removed." action="Browse items" onAction={() => router.navigate('/')} />
      </Screen>
    );
  }

  const gallery = item.imageUrls?.length ? item.imageUrls : [item.image];
  const saved = savedIds.includes(item.id);
  const hearted = heartedIds.includes(item.id);
  const more = items.filter((other) => other.userId === item.userId && other.id !== item.id);
  const heroHeight = Math.round(Math.min(width * 1.1, height * 0.62));
  const sideInset = Math.max(14, (width - contentWidth) / 2 + 14);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ height: heroHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setActiveImage(Math.round(event.nativeEvent.contentOffset.x / width))}>
            {gallery.map((uri, index) => (
              <Image key={uri + index} source={uri} style={{ width, height: heroHeight }} contentFit="cover" transition={250} accessibilityLabel={`${item.title} photo ${index + 1}`} />
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
            <Badge label={item.status} tone={item.status === 'Active' ? 'green' : 'orange'} dot />
            {item.hot ? <Badge label="Trending" tone="red" icon={Sparkles} /> : null}
          </View>
          <AppText variant="hero">{item.title}</AppText>
          <View style={styles.metaRow}>
            <Meta icon={MapPin} label={item.location} />
            <Meta icon={Eye} label={`${item.views} views`} />
            <Meta icon={Heart} label={`${item.hearts}`} />
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
            <Fact label="Category" value={item.category} />
            <Fact label="Posted" value={item.age} />
          </View>

          <View style={styles.section}>
            <AppText variant="h2">About this item</AppText>
            <AppText variant="body" color="muted">
              {item.description}
            </AppText>
          </View>

          <PressableScale
            onPress={() => item.userId && !item.mine && router.push(`/traders/${item.userId}`)}
            scaleTo={0.98}
            style={[styles.owner, { backgroundColor: colors.surface, borderColor: colors.hairline }, elevation(1, colors)]}>
            <Avatar initials={item.ownerAvatar} imageUrl={item.ownerAvatarUrl} size="large" ring online />
            <View style={styles.flex}>
              <AppText variant="eyebrow" color="muted">
                Offered by
              </AppText>
              <View style={styles.inline}>
                <AppText variant="h2">{item.owner}</AppText>
                <BadgeCheck size={16} color={colors.blue} fill={colors.blueSoft} />
              </View>
              <View style={styles.inline}>
                <Star size={12} color={colors.yellow} fill={colors.yellow} />
                <AppText variant="caption" color="ink" weight="bold">
                  {item.rating}
                </AppText>
                <AppText variant="caption">· {item.trades} completed trades</AppText>
              </View>
            </View>
            <IconButton
              icon={UserPlus}
              label={`Follow ${item.owner}`}
              onPress={() =>
                requireAuth(() => {
                  if (item.userId) void userService.setFollowing(item.userId, true);
                  showToast(`Following ${item.owner}`);
                })
              }
            />
          </PressableScale>

          <InfoNote icon={ShieldCheck} title="Trade safely" text="Meet in a public place, inspect the item, and confirm together in Barterdito." />

          {more.length ? (
            <View>
              <SectionHeading eyebrow="Same trader" title={`More from ${item.owner.split(' ')[0]}`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
                {more.map((other) => (
                  <PressableScale
                    key={other.id}
                    onPress={() => router.push(`/items/${other.id}`)}
                    style={[styles.mini, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                    <Image source={other.image} style={styles.miniImage} contentFit="cover" />
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

          <PressableScale onPress={() => setReportOpen(true)} style={styles.report}>
            <Flag size={14} color={colors.muted} />
            <AppText variant="caption" weight="bold">
              Report this listing
            </AppText>
          </PressableScale>
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
            onPress={() => void Share.share({ message: `${item.title} on Barterdito — https://barterdito.ph/items/${item.id}` })}
          />
          <IconButton icon={Heart} label="Heart item" tone="glass" size={18} active={hearted} filled={hearted} onPress={() => toggleHeart(item.id)} />
        </View>
      </View>

      <Glass strong intensity={70} style={[styles.actionbar, { bottom: Math.max(insets.bottom, 12), left: sideInset, right: sideInset }, elevation(3, colors)]}>
        <IconButton icon={Bookmark} label={saved ? 'Saved' : 'Save'} active={saved} filled={saved} onPress={() => toggleSaved(item.id)} />
        <Button
          label={item.mine ? 'This is your listing' : 'Propose a swap'}
          icon={ArrowRightLeft}
          style={styles.flex}
          disabled={item.mine}
          onPress={() => requireAuth(() => void tradeService.proposeTrade(item.id).then(() => showToast('Trade proposal started')))}
        />
      </Glass>

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

function Fact({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="h3" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 130 },
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
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, gap: 3, borderWidth: 1, borderRadius: 18, padding: 13 },
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
