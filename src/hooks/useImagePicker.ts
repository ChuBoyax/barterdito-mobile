import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

import { useToast } from '@/providers';

export function useImagePicker() {
  const showToast = useToast();

  return useCallback(
    async (limit = 1): Promise<string[]> => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('Photo access was not granted');
        return [];
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: limit > 1,
        selectionLimit: limit,
        quality: 0.8,
      });
      if (result.canceled) return [];
      return result.assets.slice(0, limit).map((asset) => asset.uri);
    },
    [showToast],
  );
}
