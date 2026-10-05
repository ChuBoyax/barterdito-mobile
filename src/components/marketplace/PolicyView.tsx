import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, Screen } from '@/components/ui';
import { communityService } from '@/services';

export function PolicyView({ type }: { type: 'privacy' | 'terms' }) {
  const sections = communityService.getPolicy(type);
  return (
    <Screen>
      <Card style={styles.card}>
        <Badge label="Last updated August 2026" tone="blue" />
        <AppText variant="h1">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</AppText>
        <AppText variant="small">
          This plain-language summary explains the core Barterdito rules. Local legal review is required before production launch.
        </AppText>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="h2">{section.title}</AppText>
            <AppText variant="body" color="muted">
              {section.body}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  section: { gap: 4, marginTop: 6 },
});
