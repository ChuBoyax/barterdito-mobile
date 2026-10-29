import { router, useLocalSearchParams } from 'expo-router';
import { RotateCcw, Users } from 'lucide-react-native';
import { useState } from 'react';

import { RequireAuth } from '@/components/layout';
import { TraderRow } from '@/components/marketplace';
import { Button, Card, EmptyState, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { queryClient, useToast } from '@/providers';
import { userService } from '@/services';
import type { ConnectionKind, ConnectionsPage } from '@/services/userService';
import type { Connection } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

export default function FollowersScreen() {
  return (
    <RequireAuth>
      <FollowersContent />
    </RequireAuth>
  );
}

const selectPeople = (page: ConnectionsPage) => page.people;

function FollowersContent() {
  const showToast = useToast();
  const params = useLocalSearchParams<{ tab?: ConnectionKind }>();
  const [tab, setTab] = useState<ConnectionKind>(params.tab === 'following' ? 'following' : 'followers');
  const { data: profile } = useAsync(queryKeys.myProfile, () => userService.getMyProfile());
  const query = usePagedQuery(queryKeys.connections(tab), (offset) => userService.getConnections(tab, offset), selectPeople);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const people = query.rows;

  async function toggle(person: Connection) {
    if (busy) return;
    const next = !(overrides[person.id] ?? person.isFollowing);
    setBusy(person.id);
    try {
      const updated = await userService.setFollowing(person.id, next);
      setOverrides((current) => ({ ...current, [person.id]: updated.isFollowing }));
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      showToast(next ? `Following ${person.fullName}` : `Unfollowed ${person.fullName}`);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not update follow status'));
    } finally {
      setBusy(null);
    }
  }

  function changeTab(next: ConnectionKind) {
    setTab(next);
    setOverrides({});
    void queryClient.invalidateQueries({ queryKey: queryKeys.connections(next) });
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <SegmentedControl<ConnectionKind>
        value={tab}
        onChange={changeTab}
        segments={[
          { value: 'followers', label: 'Followers', count: profile?.followersCount },
          { value: 'following', label: 'Following', count: profile?.followingCount },
        ]}
      />
      {query.isPending ? (
        <LoadingView variant="list" inline />
      ) : query.isError && !people.length ? (
        <EmptyState
          icon={Users}
          title="Could not load connections"
          text={errorMessage(query.error)}
          action="Try again"
          actionIcon={RotateCcw}
          onAction={() => void query.refetch()}
        />
      ) : !people.length ? (
        <EmptyState
          icon={Users}
          title={tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          text={tab === 'followers' ? 'Traders who follow you will appear here.' : 'Follow traders from their profile to keep up with their listings.'}
          action={tab === 'following' ? 'Browse items' : undefined}
          onAction={tab === 'following' ? () => router.navigate('/') : undefined}
        />
      ) : (
        <>
          <Card>
            {people.map((person) => {
              const followed = overrides[person.id] ?? person.isFollowing;
              return (
                <TraderRow
                  key={person.id}
                  trader={{ id: person.id, name: person.fullName, initials: person.initials, avatarUrl: person.avatarUrl, rating: 0, trades: 0 }}
                  subtitle={person.location}
                  onPress={() => router.push(`/traders/${person.id}`)}
                  right={
                    <Button
                      label={followed ? 'Following' : 'Follow'}
                      variant={followed ? 'secondary' : 'primary'}
                      compact
                      loading={busy === person.id}
                      onPress={() => void toggle(person)}
                    />
                  }
                />
              );
            })}
          </Card>
          {query.hasNextPage ? (
            <Button label="Load more" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          ) : null}
        </>
      )}
    </Screen>
  );
}
