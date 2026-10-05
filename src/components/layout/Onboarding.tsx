import { ArrowRight, ArrowRightLeft, Bike, Camera, ShieldCheck, ShoppingBag, Users, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Logo } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation, tone as getTone, type Tone } from '@/theme';

const pages: { icon: LucideIcon; title: string; text: string; tone: Tone }[] = [
  { icon: ShoppingBag, title: 'From markets\nto gadgets', text: 'Discover useful finds from trusted traders in your community.', tone: 'orange' },
  { icon: ArrowRightLeft, title: 'Swap, don’t\nspend', text: 'Turn what you no longer use into something you really need.', tone: 'blue' },
  { icon: Users, title: 'Meet local\ntraders', text: 'Chat, make an offer, and schedule safe public meetups nearby.', tone: 'green' },
  { icon: ShieldCheck, title: 'Safe & trusted\nswaps', text: 'Profiles, ratings, reports, and trade records help everyone barter confidently.', tone: 'violet' },
];

export function Onboarding({ visible, onFinish }: { visible: boolean; onFinish: () => void }) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const current = pages[page];
  const palette = getTone(colors, current.tone);
  const Icon = current.icon;
  const last = page === pages.length - 1;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onFinish} statusBarTranslucent>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
        <View style={styles.top}>
          <Logo />
          <Pressable accessibilityRole="button" onPress={onFinish} hitSlop={10} style={[styles.skip, { backgroundColor: colors.surface2 }]}>
            <AppText variant="caption" color="ink" weight="bold">
              Skip
            </AppText>
          </Pressable>
        </View>

        <View style={styles.art}>
          <View style={[styles.halo, { backgroundColor: palette.bg }]} />
          <Animated.View key={`orb-${page}`} entering={ZoomIn.springify().damping(14)}>
            <View style={[styles.orb, { backgroundColor: palette.solid }, elevation(2, colors)]}>
              <Icon size={68} color={colors.onPrimary} strokeWidth={1.8} />
            </View>
          </Animated.View>
          <View style={[styles.mini, styles.miniA, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
            <Camera size={20} color={colors.orange} />
            <AppText variant="caption" color="ink" weight="bold">
              Your item
            </AppText>
          </View>
          <View style={[styles.mini, styles.miniB, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
            <Bike size={20} color={colors.blue} />
            <AppText variant="caption" color="ink" weight="bold">
              Their item
            </AppText>
          </View>
        </View>

        <Animated.View key={`copy-${page}`} entering={FadeInDown.duration(450)} style={styles.copy}>
          <AppText variant="eyebrow">A better way to exchange</AppText>
          <AppText variant="display">{current.title}</AppText>
          <AppText variant="body" color="muted">
            {current.text}
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.bottom}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View key={index} style={[styles.dot, { backgroundColor: index === page ? colors.orange : colors.line }, index === page && styles.dotActive]} />
            ))}
          </View>
          <Button label={last ? 'Start swapping' : 'Next'} iconRight={ArrowRight} onPress={() => (last ? onFinish() : setPage(page + 1))} />
        </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  skip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  orb: { width: 150, height: 150, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  mini: { position: 'absolute', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  miniA: { top: '18%', left: 0, transform: [{ rotate: '-6deg' }] },
  miniB: { bottom: '16%', right: 0, transform: [{ rotate: '6deg' }] },
  copy: { gap: 10, paddingBottom: 28 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
});
