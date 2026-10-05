import { Sparkles } from 'lucide-react-native';

import { RequireAuth } from '@/components/layout';
import { HeroBanner, ItemGrid } from '@/components/marketplace';
import { Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useMarketplace } from '@/providers';
import { aiService } from '@/services';

export default function RecommendationsScreen() {
  return (
    <RequireAuth>
      <RecommendationsContent />
    </RequireAuth>
  );
}

function RecommendationsContent() {
  const { items, savedIds } = useMarketplace();
  const { data: recommended = [], loading } = useAsync(['aiService.getRecommendations', items.length, savedIds.join(',')], () => aiService.getRecommendations(items, savedIds));

  return (
    <Screen>
      <HeroBanner
        badge="AI-assisted matching"
        icon={Sparkles}
        title="Trade ideas based on your interests"
        text="We rank listings using your wishlist and item categories. If AI is unavailable, popular relevant listings remain visible."
      />
      <ItemGrid items={recommended} loading={loading} />
    </Screen>
  );
}
