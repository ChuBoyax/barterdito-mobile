import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

import { useToast } from '@/providers';

export function useImagePicker() {
  const showToast = useToast();

  return useCallback(
    async (limit = 1, { square = false } = {}): Promise<string[]> => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo access was not granted');
        return [];
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: limit > 1,
        selectionLimit: limit,
        // Square crop for profile photos; uploads are resized and re-encoded before sending.
        allowsEditing: square && limit === 1,
        aspect: square ? [1, 1] : undefined,
        quality: 0.9,
      });
      if (result.canceled) return [];
      return result.assets.slice(0, limit).map((asset) => asset.uri);
    },
    [showToast],
  );
}
