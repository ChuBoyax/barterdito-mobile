import { RequireAuth } from '@/components/layout';
import { NotificationList } from '@/components/notifications';

export default function NotificationsScreen() {
  return (
    <RequireAuth>
      <NotificationList />
    </RequireAuth>
  );
}
