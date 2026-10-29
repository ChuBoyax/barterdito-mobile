import { RequireAuth } from '@/components/layout';
import { NotificationList } from '@/components/notifications';

export default function ActivityScreen() {
  return (
    <RequireAuth>
      <NotificationList />
    </RequireAuth>
  );
}
