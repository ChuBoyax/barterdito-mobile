import { Badge } from '@/components/ui';
import { itemStatusTone } from '@/constants/status';
import type { ItemStatus } from '@/types/models';

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return <Badge label={status} tone={itemStatusTone[status]} dot />;
}
