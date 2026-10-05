import { router } from 'expo-router';
import { Bookmark, Compass } from 'lucide-react-native';

import { RequireAuth } from '@/components/layout';
import { ItemGrid } from '@/components/marketplace';
import { EmptyState, Screen } from '@/components/ui';
import { useMarketplace } from '@/providers';

export default function WishlistScreen() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}

function WishlistContent() {
  const { items, savedIds } = useMarketplace();
  const saved = items.filter((item) => savedIds.includes(item.id));
  return (
    <Screen>
      {saved.length ? (
        <ItemGrid items={saved} />
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Your wishlist is ready"
          text="Save interesting items while you browse and compare them here."
          action="Browse items"
          actionIcon={Compass}
          onAction={() => router.navigate('/')}
        />
      )}
    </Screen>
  );
}
