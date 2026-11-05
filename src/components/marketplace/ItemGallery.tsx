import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Maximize2, X, type LucideIcon } from 'lucide-react-native';
import { memo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';

/** The dark glass over photos; the same in both themes so it reads on any picture. */
export const PHOTO_GLASS = 'rgba(30, 27, 24, 0.84)';

type ItemGalleryProps = {
  images: string[];
  title: string;
  /** Badges and actions drawn over the photo. */
  children?: ReactNode;
};

/**
 * Swipeable photos with arrows, thumbnails and a full-screen viewer. It keeps the current
 * photo to itself, so swiping does not re-render the rest of the item screen.
 */
export const ItemGallery = memo(function ItemGallery({ images, title, children }: ItemGalleryProps) {
  const { colors } = useTheme();
  const { height, innerWidth } = useResponsive();
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const track = useRef<ScrollView>(null);
  const photoHeight = Math.round(Math.min(innerWidth, height * 0.7));

  function show(index: number) {
    setActive(index);
    track.current?.scrollTo({ x: index * innerWidth, animated: true });
  }

  return (
    <View>
      <View style={[styles.frame, { height: photoHeight, backgroundColor: colors.surface2 }, neu(colors, 2)]}>
        <View style={styles.clip}>
          <ScrollView
            ref={track}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setActive(Math.round(event.nativeEvent.contentOffset.x / innerWidth))}>
            {images.map((uri, index) => (
              <Pressable key={uri + index} accessibilityRole="imagebutton" accessibilityLabel={`${title} photo ${index + 1}, view full size`} onPress={() => setViewerOpen(true)}>
                <Image source={uri} cachePolicy="memory-disk" priority={index === 0 ? 'high' : 'normal'} style={{ width: innerWidth, height: photoHeight }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {children}
        <Pressable accessibilityRole="button" accessibilityLabel="View photo" hitSlop={6} onPress={() => setViewerOpen(true)} style={styles.zoom}>
          <Maximize2 size={16} color={colors.onPhoto} strokeWidth={2.25} />
        </Pressable>
        {active > 0 ? <Arrow icon={ChevronLeft} label="Previous photo" side="left" onPress={() => show(active - 1)} /> : null}
        {active < images.length - 1 ? <Arrow icon={ChevronRight} label="Next photo" side="right" onPress={() => show(active + 1)} /> : null}
      </View>

      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.map((uri, index) => (
            <Pressable
              key={uri + index}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${index + 1}`}
              accessibilityState={{ selected: active === index }}
              onPress={() => show(index)}
              style={[styles.thumb, { backgroundColor: colors.surface2 }, active === index ? { borderColor: colors.orange } : styles.thumbIdle]}>
              <Image source={uri} cachePolicy="memory-disk" style={styles.fill} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {viewerOpen ? <PhotoViewer images={images} title={title} initial={active} onClose={() => setViewerOpen(false)} onSelect={show} /> : null}
    </View>
  );
});

function Arrow({ icon: Icon, label, side, onPress }: { icon: LucideIcon; label: string; side: 'left' | 'right'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.arrow, side === 'left' ? styles.arrowLeft : styles.arrowRight]}>
      <Icon size={20} color={colors.onPhoto} strokeWidth={2.25} />
    </Pressable>
  );
}

type PhotoViewerProps = { images: string[]; title: string; initial: number; onClose: () => void; onSelect: (index: number) => void };

/** Full-screen photos; the gallery behind follows whichever one is showing. */
function PhotoViewer({ images, title, initial, onClose, onSelect }: PhotoViewerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.viewer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initial * width, y: 0 }}
          onMomentumScrollEnd={(event) => onSelect(Math.round(event.nativeEvent.contentOffset.x / width))}>
          {images.map((uri, index) => (
            <Image key={uri + index} source={uri} cachePolicy="memory-disk" style={{ width }} contentFit="contain" accessibilityLabel={`${title} photo ${index + 1}`} />
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} style={[styles.viewerClose, { top: insets.top + 8 }]}>
          <X size={20} color={colors.onPhoto} />
        </Pressable>
      </View>
    </Modal>
  );
}

const ARROW = 44;

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  frame: { width: '100%', borderRadius: 20 },
  clip: { ...StyleSheet.absoluteFillObject, borderRadius: 20, overflow: 'hidden' },
  zoom: { position: 'absolute', top: 12, right: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: PHOTO_GLASS },
  arrow: { position: 'absolute', top: '50%', marginTop: -ARROW / 2, width: ARROW, height: ARROW, borderRadius: ARROW / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: PHOTO_GLASS },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  thumbs: { gap: 8, paddingHorizontal: 4, paddingTop: 12, paddingBottom: 4 },
  thumb: { width: 88, height: 88, borderRadius: 14, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbIdle: { opacity: 0.8 },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', right: 14, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: PHOTO_GLASS },
});
