import { router } from 'expo-router';
import { RotateCcw, ShieldBan } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Avatar, Button, Card, EmptyState, LoadingView, Screen } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { queryClient, useToast } from '@/providers';
import { directMessageService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import type { BlockedPerson } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

export default function BlockedUsersScreen() {
  return (
    <RequireAuth>
      <BlockedUsers />
    </RequireAuth>
  );
}

const selectUsers = (page: { users: BlockedPerson[]; total: number }) => page.users;

function BlockedUsers() {
  const showToast = useToast();
  const blocked = usePagedQuery(queryKeys.blockedPeople, (offset) => directMessageService.getBlocked(offset), selectUsers, { persist: false });
  const [busy, setBusy] = useState<string | null>(null);

  async function unblock(entry: BlockedPerson) {
    if (busy) return;
    setBusy(entry.conversationId);
    try {
      await directMessageService.setBlocked(entry.conversationId, false);
      await blocked.refetch();
      void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations() });
      showToast(`${entry.user.fullName} unblocked`);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not unblock this user. Try again.'));
    } finally {
      setBusy(null);
    }
  }

  if (blocked.isPending) return <LoadingView variant="list" />;

  return (
    <Screen refreshing={blocked.isRefetching && !blocked.isFetchingNextPage} onRefresh={() => void blocked.refetch()}>
      <AppText variant="small">These users cannot exchange private messages with you. Unblocking does not remove a block they may have set.</AppText>
      {blocked.isError && !blocked.rows.length ? (
        <EmptyState icon={ShieldBan} title="Could not load blocked users" text={errorMessage(blocked.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void blocked.refetch()} />
      ) : !blocked.rows.length ? (
        <EmptyState icon={ShieldBan} title="No blocked users" text="People you block from a private conversation appear here." />
      ) : (
        <>
          {blocked.rows.map((entry) => (
            <Card key={entry.conversationId} style={styles.row} onPress={() => router.push(`/direct-messages/${entry.conversationId}`)} accessibilityLabel={`Open conversation with ${entry.user.fullName}`}>
              <Avatar initials={entry.user.initials} imageUrl={entry.user.avatarUrl} size="medium" />
              <View style={styles.flex}>
                <AppText variant="h3" numberOfLines={1}>
                  {entry.user.fullName}
                </AppText>
                <AppText variant="caption">Blocked {new Date(entry.blockedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</AppText>
              </View>
              <Button label="Unblock" variant="secondary" compact loading={busy === entry.conversationId} disabled={busy !== null} onPress={() => void unblock(entry)} />
            </Card>
          ))}
          {blocked.hasNextPage ? <Button label="Load more" variant="secondary" loading={blocked.isFetchingNextPage} onPress={() => void blocked.fetchNextPage()} /> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
