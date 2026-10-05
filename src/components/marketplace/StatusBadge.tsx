import { Badge } from '@/components/ui';
import { itemStatusTone, offerStatusTone } from '@/constants/status';
import type { ItemStatus, OfferStatus } from '@/types/models';

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge label={status} tone={offerStatusTone[status]} dot />;
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return <Badge label={status} tone={itemStatusTone[status]} dot />;
}
