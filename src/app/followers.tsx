import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { RequireAuth } from '@/components/layout';
import { TraderRow } from '@/components/marketplace';
import { Button, Card, LoadingView, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { userService } from '@/services';

type Tab = 'followers' | 'following';

export default function FollowersScreen() {
  return (
    <RequireAuth>
      <FollowersContent />
    </RequireAuth>
  );
}

function FollowersContent() {
  const showToast = useToast();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'following' ? 'following' : 'followers');
  const { data: followers = [], loading } = useAsync(() => userService.getFollowers(), []);
  const { data: following = [] } = useAsync(() => userService.getFollowing(), []);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isFollowing = (id: string) => overrides[id] ?? following.some((trader) => trader.id === id);
  const list = tab === 'followers' ? followers : followers.filter((trader) => isFollowing(trader.id));

  function toggle(id: string, name: string) {
    const next = !isFollowing(id);
    setOverrides((current) => ({ ...current, [id]: next }));
    void userService.setFollowing(id, next);
    showToast(next ? `Followed ${name}` : `Unfollowed ${name}`);
  }

  return (
    <Screen>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'followers', label: 'Followers', count: 128 },
          { value: 'following', label: 'Following', count: 74 },
        ]}
      />
      {loading ? (
        <LoadingView />
      ) : (
        <Card>
          {list.map((trader) => {
            const followed = isFollowing(trader.id);
            return (
              <TraderRow
                key={trader.id}
                trader={trader}
                onPress={() => router.push(`/traders/${trader.id}`)}
                right={
                  <Button
                    label={followed ? 'Following' : 'Follow'}
                    variant={followed ? 'secondary' : 'primary'}
                    compact
                    onPress={() => toggle(trader.id, trader.name)}
                  />
                }
              />
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
