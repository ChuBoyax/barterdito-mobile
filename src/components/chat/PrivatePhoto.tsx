import { Image } from 'expo-image';
import { ImageOff, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { loadPrivatePhoto } from '@/services/privatePhotos';
import type { MessagePhoto } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

const WIDTH = 220;

/** A photo only the conversation's participants can open, loaded with the signed-in session. */
export function PrivatePhoto({ path, photo, label = 'Photo message' }: { path: string; photo: MessagePhoto; label?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const height = Math.round(Math.min(280, Math.max(120, (WIDTH * photo.height) / Math.max(1, photo.width))));

  useEffect(() => {
    let active = true;
    setError('');
    loadPrivatePhoto(path)
      .then((next) => active && setUri(next))
      .catch((caught) => active && setError(errorMessage(caught, 'Could not load this photo.')));
    return () => {
      active = false;
    };
  }, [path, attempt]);

  if (!uri) {
    return (
      <View style={[styles.frame, styles.placeholder, { height, backgroundColor: colors.surface2 }]}>
        {error ? (
          <>
            <ImageOff size={22} color={colors.muted} />
            <AppText variant="caption" align="center">
              {error}
            </AppText>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setAttempt((value) => value + 1)}>
              <AppText variant="caption" color="orange" weight="bold">
                Retry photo
              </AppText>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.orange} />
        )}
      </View>
    );
  }

  return (
    <>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Open ${label.toLowerCase()}`} onPress={() => setOpen(true)} style={[styles.frame, { height }]}>
        <Image source={uri} style={styles.fill} contentFit="cover" />
      </Pressable>
      <Modal visible={open} animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View style={styles.viewer}>
          <Image source={uri} style={styles.fill} contentFit="contain" />
          <View style={[styles.close, { top: insets.top + 8 }]}>
            <IconButton icon={X} label="Close photo" tone="glass" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: { width: WIDTH, maxWidth: '100%', borderRadius: 14, overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  fill: { width: '100%', height: '100%' },
  viewer: { flex: 1, backgroundColor: '#000' },
  close: { position: 'absolute', right: 14 },
});
