import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useToast } from '@/providers';
import { confirmAction } from '@/utils/confirm';
import { readJson, storageKeys, writeJson } from '@/utils/storage';

// Android 13+ has no OS dialog for the system photo picker, so the app asks before opening it.
const hasNoSystemPrompt = Platform.OS === 'android' && Platform.Version >= 33;

async function confirmPhotoAccess(): Promise<boolean> {
  if (await readJson<boolean>(storageKeys.photoAccess)) return true;
  const allowed = await confirmAction({
    title: 'Allow access to your photos?',
    message: 'Barterdito will open your gallery so you can choose photos. Only the photos you select are shared with the app.',
    confirmLabel: 'Allow',
    cancelLabel: "Don't allow",
  });
  if (allowed) await writeJson(storageKeys.photoAccess, true);
  return allowed;
}

export function useImagePicker() {
  const showToast = useToast();

  return useCallback(
    async (limit = 1, { square = false } = {}): Promise<string[]> => {
      try {
        const granted = hasNoSystemPrompt
          ? await confirmPhotoAccess()
          : (await ImagePicker.requestMediaLibraryPermissionsAsync()).granted;
        if (!granted) {
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
      } catch {
        showToast('Could not open your photos. Please try again.');
        return [];
      }
    },
    [showToast],
  );
}
