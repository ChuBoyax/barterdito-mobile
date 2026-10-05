import { Image } from 'expo-image';
import { ArrowRight, BarChart3, Eye, Heart, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { BarChart, StatGrid } from '@/components/marketplace';
import { AppText, Badge, Card, LoadingView, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { communityService, itemService } from '@/services';
import type { AnalyticsMetric } from '@/types/models';

const metricIcons: Record<AnalyticsMetric['key'], LucideIcon> = {
  views: Eye,
  hearts: Heart,
  offers: ArrowRight,
  conversion: BarChart3,
};

export default function AnalyticsScreen() {
  return (
    <RequireAuth>
      <AnalyticsContent />
    </RequireAuth>
  );
}

function AnalyticsContent() {
  const { data: summary, loading } = useAsync(['communityService.getAnalytics'], () => communityService.getAnalytics());
  const { data: myItems = [] } = useAsync(['itemService.getMyItems'], () => itemService.getMyItems());
  if (loading || !summary) return <LoadingView variant="stats" />;

  return (
    <Screen>
      <StatGrid
        stats={summary.metrics.map((metric) => ({
          label: metric.label,
          value: metric.value,
          change: metric.change,
          icon: metricIcons[metric.key],
        }))}
      />
      <Card style={styles.gap}>
        <View style={styles.head}>
          <View style={styles.flex}>
            <SectionHeading eyebrow="Last 30 days" title="Listing views" />
          </View>
          <Badge label={summary.growth} tone="green" />
        </View>
        <BarChart values={summary.viewsSeries} labels={summary.seriesLabels} />
      </Card>
      <Card style={styles.gap}>
        <SectionHeading eyebrow="Performance" title="Top items" />
        {myItems.map((item) => (
          <View key={item.id} style={styles.row}>
            <Image source={item.image} style={styles.thumb} contentFit="cover" />
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption">
                {item.views} views · {item.hearts} hearts
              </AppText>
            </View>
            <AppText variant="h3" color="green">
              {item.views ? Math.round((item.hearts / item.views) * 100) : 0}%
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 50, height: 50, borderRadius: 12 },
});
