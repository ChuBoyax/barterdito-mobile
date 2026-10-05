import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui';
import { fonts } from '@/theme';
import type { Item } from '@/types/models';

export function FeaturedCard({ item, onPress }: { item: Item; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} style={styles.card}>
      <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} />
      <View style={styles.body}>
        <Badge label={item.category} tone="orange" />
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.row}>
          <MapPin size={12} color="#fff" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 220, height: 270, borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end' },
  body: { padding: 14, gap: 6 },
  title: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { color: 'rgba(255,255,255,0.88)', fontFamily: fonts.medium, fontSize: 12 },
});
