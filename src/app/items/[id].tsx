import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Bookmark, Eye, Flag, Heart, MapPin, Package, Share2, ShieldCheck, Star, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ReportSheet } from '@/components/marketplace';
import { AppText, Avatar, Badge, Button, Card, EmptyState, IconButton, InfoNote, LoadingView, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useMarketplace, useTheme, useToast } from '@/providers';
import { itemService, tradeService, userService } from '@/services';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
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

  return (
    <>
      <Stack.Screen options={{ title: item.title }} />
      <Screen
        padded={false}
        contentStyle={styles.content}
        footer={
          <View style={[styles.actionbar, { backgroundColor: colors.surface, borderTopColor: colors.line }]}>
            <Button
              label="Propose a Trade"
              icon={ArrowRight}
              style={styles.flex}
              disabled={item.mine}
              onPress={() =>
                requireAuth(() => {
                  void tradeService.proposeTrade(item.id).then(() => showToast('Trade proposal started'));
                })
              }
            />
            <IconButton icon={Bookmark} label={saved ? 'Saved' : 'Save'} active={saved} filled={saved} onPress={() => toggleSaved(item.id)} />
            <IconButton icon={Flag} label="Report item" tone="danger" onPress={() => setReportOpen(true)} />
          </View>
        }>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setActiveImage(Math.round(event.nativeEvent.contentOffset.x / width))}>
            {gallery.map((uri, index) => (
              <Image key={uri + index} source={uri} style={{ width, height: width * 0.9 }} contentFit="cover" accessibilityLabel={`${item.title} photo ${index + 1}`} />
            ))}
          </ScrollView>
          <View style={styles.galleryActions}>
            <Pressable accessibilityLabel="Heart item" onPress={() => toggleHeart(item.id)} style={[styles.pill, { backgroundColor: colors.surface }]}>
              <Heart size={18} color={hearted ? colors.red : colors.ink} fill={hearted ? colors.red : 'none'} />
              <AppText variant="small" color="ink" weight="bold">
                {item.hearts}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityLabel="Share item"
              onPress={() => void Share.share({ message: `${item.title} on Barterdito — https://barterdito.ph/items/${item.id}` })}
              style={[styles.pill, { backgroundColor: colors.surface }]}>
              <Share2 size={18} color={colors.ink} />
            </Pressable>
          </View>
          {gallery.length > 1 ? (
            <View style={styles.dots}>
              {gallery.map((_, index) => (
                <View key={index} style={[styles.dot, { backgroundColor: index === activeImage ? colors.white : 'rgba(255,255,255,0.5)' }]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.badges}>
            <Badge label={item.category} tone="orange" />
            <Badge label={item.status} tone={item.status === 'Active' ? 'green' : 'orange'} />
          </View>
          <AppText variant="h1">{item.title}</AppText>
          <View style={styles.row}>
            <MapPin size={14} color={colors.muted} />
            <AppText variant="small">
              {item.location} · Posted {item.age}
            </AppText>
            <View style={styles.flex} />
            <Eye size={14} color={colors.muted} />
            <AppText variant="small">{item.views} views</AppText>
          </View>

          <View style={styles.facts}>
            <Fact label="Condition" value={item.condition} />
            <Fact label="Category" value={item.category} />
          </View>
          <Fact label="Looking for" value={item.wanted} />

          <View style={styles.section}>
            <AppText variant="h2">About this item</AppText>
            <AppText variant="body" color="muted">
              {item.description}
            </AppText>
          </View>

          <Card style={styles.owner}>
            <Avatar initials={item.ownerAvatar} imageUrl={item.ownerAvatarUrl} size="large" />
            <View style={styles.flex}>
              <AppText variant="caption">Offered by</AppText>
              <AppText variant="h3">{item.owner}</AppText>
              <View style={styles.row}>
                <Star size={12} color={colors.yellow} fill={colors.yellow} />
                <AppText variant="caption">
                  {item.rating} · {item.trades} completed trades
                </AppText>
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
          </Card>
          {item.userId && !item.mine ? (
            <Button label="View trader profile" variant="secondary" onPress={() => router.push(`/traders/${item.userId}`)} />
          ) : null}

          <InfoNote icon={ShieldCheck} title="Trade safely" text="Meet in a public place, inspect the item, and confirm together in Barterdito." />

          {more.length ? (
            <View>
              <SectionHeading eyebrow="" title={`More from ${item.owner}`} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
                {more.map((other) => (
                  <Pressable key={other.id} onPress={() => router.push(`/items/${other.id}`)} style={[styles.mini, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                    <Image source={other.image} style={styles.miniImage} contentFit="cover" />
                    <View style={styles.flex}>
                      <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                        {other.title}
                      </AppText>
                      <AppText variant="caption">{other.condition}</AppText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <ReportSheet
          visible={reportOpen}
          title="Report this item"
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason, details) => {
            await itemService.reportItem(item.id, reason, details);
            showToast(`Report submitted: ${reason}`);
          }}
        />
      </Screen>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: colors.surface2 }]}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="h3">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  galleryActions: { position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  dots: { position: 'absolute', bottom: 22, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { padding: 16, gap: 14 },
  badges: { flexDirection: 'row', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, gap: 2, borderRadius: 14, padding: 12 },
  section: { gap: 6 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moreRow: { gap: 10 },
  mini: { width: 220, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 8 },
  miniImage: { width: 54, height: 54, borderRadius: 10 },
  actionbar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
});
