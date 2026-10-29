import { memo } from 'react';

import { StatRow } from '@/components/ui';

type ListingsOverviewProps = { total: number; views: number; hearts: number };

/** Three headline numbers for My Items; per-status counts live on the filter chips. */
export const ListingsOverview = memo(function ListingsOverview({ total, views, hearts }: ListingsOverviewProps) {
  return (
    <StatRow
      stats={[
        { label: 'Listings', value: total },
        { label: 'Views', value: views },
        { label: 'Likes', value: hearts },
      ]}
    />
  );
});
