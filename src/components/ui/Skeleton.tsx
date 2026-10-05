import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';

function usePulse() {
  const [opacity] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return opacity;
}

// One shared animation for every block on screen instead of one loop per block.
const PulseContext = createContext<Animated.Value | null>(null);

function SkeletonGroup({ children }: { children: ReactNode }) {
  const pulse = usePulse();
  return <PulseContext.Provider value={pulse}>{children}</PulseContext.Provider>;
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const shared = useContext(PulseContext);
  return shared ? <Block opacity={shared} style={style} /> : <StandaloneSkeleton style={style} />;
}

function StandaloneSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const pulse = usePulse();
  return <Block opacity={pulse} style={style} />;
}

function Block({ opacity, style }: { opacity: Animated.Value; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <Animated.View style={[{ backgroundColor: colors.surface2, borderRadius: 10, opacity }, style]} />;
}

const line = (width: DimensionValue, height = 12) => <Skeleton style={{ width, height, borderRadius: 6 }} />;

function Surface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.hairline }, style]}>{children}</View>;
}

function ListRows({ count = 6 }: { count?: number }) {
  return (
    <Surface style={styles.listCard}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton style={styles.avatar} />
          <View style={styles.lines}>
            {line('55%', 14)}
            {line('85%')}
          </View>
        </View>
      ))}
    </Surface>
  );
}

function Cards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Surface key={index} style={styles.card}>
          <View style={styles.row}>
            <Skeleton style={styles.avatarSmall} />
            <View style={styles.lines}>
              {line('45%', 14)}
              {line('30%')}
            </View>
            <Skeleton style={styles.pill} />
          </View>
          <View style={styles.pair}>
            <Skeleton style={styles.media} />
            <Skeleton style={styles.media} />
          </View>
          <Skeleton style={styles.button} />
        </Surface>
      ))}
    </>
  );
}

function Grid({ columns }: { columns: number }) {
  return (
    <View style={styles.gridWrap}>
      {Array.from({ length: columns * 2 }, (_, index) => (
        <View key={index} style={{ width: `${100 / columns - 4}%` as DimensionValue, gap: 8 }}>
          <Skeleton style={styles.gridMedia} />
          {line('80%', 14)}
          {line('55%')}
        </View>
      ))}
    </View>
  );
}

function Detail() {
  const { height, gutter } = useResponsive();
  return (
    <>
      <Skeleton style={{ height: Math.round(height * 0.45), borderRadius: 0, marginHorizontal: -gutter, marginTop: -16 }} />
      <View style={styles.badges}>
        <Skeleton style={styles.pill} />
        <Skeleton style={styles.pill} />
      </View>
      {line('70%', 28)}
      {line('40%')}
      <Skeleton style={styles.banner} />
      <View style={styles.pair}>
        <Skeleton style={styles.fact} />
        <Skeleton style={styles.fact} />
        <Skeleton style={styles.fact} />
      </View>
      {line('100%')}
      {line('90%')}
      {line('60%')}
    </>
  );
}

function Profile() {
  return (
    <>
      <Surface style={styles.profile}>
        <Skeleton style={styles.avatarHero} />
        {line('50%', 22)}
        {line('35%')}
        <Skeleton style={styles.stats} />
        <View style={styles.pair}>
          <Skeleton style={styles.button} />
          <Skeleton style={styles.button} />
        </View>
      </Surface>
      <Grid columns={2} />
    </>
  );
}

function Stats() {
  return (
    <>
      <View style={styles.pair}>
        <Skeleton style={styles.tile} />
        <Skeleton style={styles.tile} />
        <Skeleton style={styles.tile} />
      </View>
      <Skeleton style={styles.chart} />
      <ListRows count={4} />
    </>
  );
}

function Messages() {
  const bubbles: [DimensionValue, boolean][] = [
    ['62%', false],
    ['48%', true],
    ['70%', false],
    ['40%', true],
    ['55%', false],
  ];
  return (
    <View style={styles.messages}>
      {bubbles.map(([width, mine], index) => (
        <Skeleton key={index} style={[styles.bubble, { width, alignSelf: mine ? 'flex-end' : 'flex-start' }]} />
      ))}
    </View>
  );
}

function Chat() {
  return (
    <>
      <View style={styles.row}>
        <Skeleton style={styles.avatarSmall} />
        <View style={styles.lines}>
          {line('40%', 14)}
          {line('25%')}
        </View>
      </View>
      <Skeleton style={styles.banner} />
      <Messages />
    </>
  );
}

export type SkeletonVariant = 'list' | 'cards' | 'grid' | 'detail' | 'profile' | 'stats' | 'chat' | 'messages';

const layouts: Record<SkeletonVariant, () => ReactNode> = {
  list: () => <ListRows />,
  cards: () => <Cards />,
  grid: () => <Grid columns={2} />,
  detail: () => <Detail />,
  profile: () => <Profile />,
  stats: () => <Stats />,
  chat: () => <Chat />,
  messages: () => <Messages />,
};

type SkeletonScreenProps = {
  variant?: SkeletonVariant;
  /** Inside an already-padded screen: no own padding, background, or full height. */
  inline?: boolean;
  label?: string;
};

/** A placeholder shaped like the content that is loading. */
export function SkeletonScreen({ variant = 'list', inline, label = 'Loading' }: SkeletonScreenProps) {
  const { colors } = useTheme();
  const { gutter } = useResponsive();
  return (
    <SkeletonGroup>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        style={[styles.content, !inline && [styles.screen, { backgroundColor: colors.background, paddingHorizontal: gutter }]]}>
        {layouts[variant]()}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  screen: { flex: 1, paddingVertical: 16, overflow: 'hidden' },
  surface: { borderWidth: 1, borderRadius: 22 },
  listCard: { paddingHorizontal: 14, paddingVertical: 6 },
  card: { padding: 14, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  lines: { flex: 1, gap: 8 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarSmall: { width: 38, height: 38, borderRadius: 19 },
  avatarHero: { width: 96, height: 96, borderRadius: 48 },
  pill: { width: 76, height: 24, borderRadius: 12 },
  pair: { flexDirection: 'row', gap: 10 },
  media: { flex: 1, aspectRatio: 1.1, borderRadius: 16 },
  button: { flex: 1, height: 40, borderRadius: 14 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 },
  gridMedia: { width: '100%', aspectRatio: 0.85, borderRadius: 18 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  banner: { height: 72, borderRadius: 18 },
  fact: { flex: 1, height: 60, borderRadius: 16 },
  profile: { alignItems: 'center', gap: 12, padding: 18 },
  stats: { alignSelf: 'stretch', height: 64, borderRadius: 16 },
  tile: { flex: 1, height: 96, borderRadius: 18 },
  chart: { height: 180, borderRadius: 22 },
  messages: { gap: 12, paddingTop: 8 },
  bubble: { height: 44, borderRadius: 18 },
});
