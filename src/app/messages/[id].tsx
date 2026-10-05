import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ChatView } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { AppText, Button, LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { messageService, tradeService } from '@/services';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: thread, loading } = useAsync(() => messageService.getThread(id), [id]);
  const { data: offer } = useAsync(() => tradeService.getOffer(id).catch(() => undefined), [id]);

  if (loading) return <LoadingView />;
  const name = thread?.name ?? offer?.person ?? 'Trader';
  const initials = thread?.initials ?? offer?.initials ?? 'BD';

  const header = (
    <View style={[styles.context, { backgroundColor: colors.surface, borderBottomColor: colors.line }]}>
      {offer ? (
        <View style={styles.swap}>
          <View style={styles.side}>
            <Image source={offer.theirs.image} style={styles.thumb} />
            <View style={styles.flex}>
              <AppText variant="caption">{name.split(' ')[0]} offers</AppText>
              <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                {offer.theirs.title}
              </AppText>
            </View>
          </View>
          <ArrowRight size={16} color={colors.orange} />
          <View style={styles.side}>
            <Image source={offer.yours.image} style={styles.thumb} />
            <View style={styles.flex}>
              <AppText variant="caption">You offer</AppText>
              <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
                {offer.yours.title}
              </AppText>
            </View>
          </View>
        </View>
      ) : null}
      <Button label="Schedule meetup" icon={CalendarDays} variant="secondary" compact onPress={() => router.push(`/meetups/${id}`)} />
      <View style={[styles.warranty, { backgroundColor: colors.greenSoft }]}>
        <ShieldCheck size={16} color={colors.green} />
        <AppText variant="caption" color="ink" style={styles.flex}>
          7-day trade support: after completion, both traders can access this chat and file a dispute for seven days.
        </AppText>
      </View>
    </View>
  );

  return <ChatView kind="trade" threadId={id} name={name} initials={initials} header={header} typingName={name.split(' ')[0]} />;
}

const styles = StyleSheet.create({
  context: { gap: 10, borderBottomWidth: 1, padding: 12 },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { width: 40, height: 40, borderRadius: 10 },
  flex: { flex: 1 },
  warranty: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10 },
});
