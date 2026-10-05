import { ArrowRight, Bike, Camera, ShieldCheck, ShoppingBag, Users, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Logo } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

const pages: { icon: LucideIcon; title: string; text: string; color: string }[] = [
  { icon: ShoppingBag, title: 'From markets to gadgets', text: 'Discover useful finds from trusted traders in your community.', color: '#ff7a1a' },
  { icon: ArrowRight, title: 'Trade goods for electronics', text: 'Turn what you no longer use into something you really need.', color: '#174ea6' },
  { icon: Users, title: 'Connect with local traders', text: 'Chat, make an offer, and schedule safe public meetups nearby.', color: '#3fa879' },
  { icon: ShieldCheck, title: 'Safe & trusted swaps', text: 'Profiles, ratings, reports, and trade records help everyone barter confidently.', color: '#8c5de7' },
];

export function Onboarding({ visible, onFinish }: { visible: boolean; onFinish: () => void }) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const current = pages[page];
  const Icon = current.icon;
  const last = page === pages.length - 1;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onFinish}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.top}>
          <Logo />
          <Pressable accessibilityRole="button" onPress={onFinish} hitSlop={10}>
            <AppText variant="small" weight="bold">
              Skip
            </AppText>
          </Pressable>
        </View>
        <View style={styles.art}>
          <View style={[styles.orb, { backgroundColor: `${current.color}22` }]} />
          <View style={[styles.iconCircle, { backgroundColor: current.color }]}>
            <Icon size={64} color="#fff" />
          </View>
          <View style={[styles.mini, styles.miniA, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Camera size={22} color={colors.orange} />
            <AppText variant="caption">Your item</AppText>
          </View>
          <View style={[styles.mini, styles.miniB, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Bike size={22} color={colors.blue} />
            <AppText variant="caption">Their item</AppText>
          </View>
        </View>
        <View style={styles.copy}>
          <AppText variant="eyebrow" align="center">
            A better way to exchange
          </AppText>
          <AppText variant="hero" align="center">
            {current.title}
          </AppText>
          <AppText variant="body" color="muted" align="center">
            {current.text}
          </AppText>
        </View>
        <View style={styles.bottom}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, { backgroundColor: index === page ? colors.orange : colors.line }, index === page && styles.dotActive]}
              />
            ))}
          </View>
          <Button
            label={last ? 'Start browsing' : 'Next'}
            iconRight={ArrowRight}
            onPress={() => (last ? onFinish() : setPage(page + 1))}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  art: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  iconCircle: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  mini: { position: 'absolute', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  miniA: { top: '22%', left: 4 },
  miniB: { bottom: '20%', right: 4 },
  copy: { gap: 10, paddingBottom: 24 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
});
