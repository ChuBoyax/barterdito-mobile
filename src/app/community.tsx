import { router } from 'expo-router';
import { Crown, HandHeart, MessageSquare, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, LoadingView, ProgressBar, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { communityService } from '@/services';
import { formatPeso } from '@/utils/format';

export default function CommunityScreen() {
  const { colors } = useTheme();
  const { requireAuth } = useAuth();
  const showToast = useToast();
  const { data: threads = [], loading } = useAsync(() => communityService.getForumThreads(), []);
  const { data: campaign } = useAsync(() => communityService.getActiveCampaign(), []);

  return (
    <Screen>
      <Card style={styles.gap}>
        <SectionHeading eyebrow="Discussions" title="Community forum" />
        <Button label="New thread" icon={Plus} compact onPress={() => requireAuth(() => showToast('New discussion composer opened'))} />
        {loading ? (
          <LoadingView />
        ) : (
          threads.map((thread) => (
            <Pressable
              key={thread.id}
              onPress={() => showToast('Thread view coming soon')}
              style={[styles.thread, { borderTopColor: colors.line }]}>
              <View style={[styles.icon, { backgroundColor: thread.pinned ? colors.orangeSoft : colors.blueSoft }]}>
                {thread.pinned ? <Crown size={18} color={colors.orange} /> : <MessageSquare size={18} color={colors.blue} />}
              </View>
              <View style={styles.flex}>
                <AppText variant="h3">{thread.title}</AppText>
                <AppText variant="caption">
                  {thread.author} · {thread.time}
                </AppText>
              </View>
              <View style={styles.replies}>
                <AppText variant="h3" color="orange">
                  {thread.replies}
                </AppText>
                <AppText variant="caption">replies</AppText>
              </View>
            </Pressable>
          ))
        )}
      </Card>

      {campaign ? (
        <Card style={[styles.gap, { backgroundColor: colors.greenSoft, borderColor: colors.greenSoft }]}>
          <Badge label="Community campaign" tone="green" />
          <HandHeart size={36} color={colors.green} />
          <AppText variant="h2">{campaign.title}</AppText>
          <AppText variant="small">{campaign.description}</AppText>
          <ProgressBar value={campaign.raised} max={campaign.goal} />
          <View style={styles.row}>
            <AppText variant="h3">{formatPeso(campaign.raised)}</AppText>
            <AppText variant="caption">of {formatPeso(campaign.goal)}</AppText>
          </View>
          <Button label="Support campaign" onPress={() => router.push('/donate')} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  flex: { flex: 1 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingTop: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  replies: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
