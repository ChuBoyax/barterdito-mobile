import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

import { confirmAction } from '@/utils/confirm';

/**
 * Asks "Discard changes?" when the user leaves the screen while `dirty` is true
 * (back arrow, Android back button, or swipe).
 *
 * Call the returned `allowLeave()` right before navigating away after a successful save.
 */
export function useUnsavedChangesGuard(dirty: boolean, message = 'Your changes have not been saved.') {
  const navigation = useNavigation();
  const allowed = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    return navigation.addListener('beforeRemove', (event) => {
      if (allowed.current) return;
      event.preventDefault();
      void confirmAction({ title: 'Discard changes?', message, confirmLabel: 'Discard', cancelLabel: 'Keep editing', destructive: true }).then(
        (discard) => {
          if (discard) navigation.dispatch(event.data.action);
        },
      );
    });
  }, [navigation, dirty, message]);

  return () => {
    allowed.current = true;
  };
}
