import { router } from 'expo-router';
import { AlertTriangle, ChevronDown, ChevronUp, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeroBanner } from '@/components/marketplace';
import { AppText, Card, ListRow, Screen } from '@/components/ui';
import { useTheme, useToast } from '@/providers';
import { communityService } from '@/services';

export default function HelpScreen() {
  const { colors } = useTheme();
  const showToast = useToast();
  const [open, setOpen] = useState(0);
  const faqs = communityService.getFaqs();

  return (
    <Screen>
      <HeroBanner
        badge="Trade with confidence"
        tone="blue"
        icon={ShieldCheck}
        title="We’re here to help."
        text="Quick answers, practical safety guidance, and a clear path when something goes wrong."
      />
      <Card padded={false}>
        {faqs.map((faq, index) => {
          const expanded = open === index;
          return (
            <View key={faq.title} style={[styles.faq, index > 0 && { borderTopColor: colors.line, borderTopWidth: 1 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? -1 : index)}
                style={styles.summary}>
                <AppText variant="h3" style={styles.flex}>
                  {faq.title}
                </AppText>
                {expanded ? <ChevronUp size={19} color={colors.muted} /> : <ChevronDown size={19} color={colors.muted} />}
              </Pressable>
              {expanded ? <AppText variant="small">{faq.body}</AppText> : null}
            </View>
          );
        })}
      </Card>
      <Card>
        <ListRow icon={AlertTriangle} title="File a dispute" subtitle="Attach details and evidence" onPress={() => router.push('/disputes')} />
        <ListRow icon={MessageCircle} title="Contact support" subtitle="We usually reply within one day" onPress={() => showToast('Support chat coming soon')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  faq: { padding: 16, gap: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
