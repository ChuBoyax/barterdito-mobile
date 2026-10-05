import { router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth, useToast } from '@/providers';
import { confirmAction } from '@/utils/confirm';


export function useSignOut() {
  const { signOut } = useAuth();
  const showToast = useToast();

  return useCallback(async () => {
    const ok = await confirmAction({
      title: 'Sign out?',
      message: 'You can sign back in anytime with your account.',
      confirmLabel: 'Sign out',
      destructive: true,
    });
    if (!ok) return;
    await signOut();
    showToast('You’re signed out');
    router.navigate('/');
  }, [signOut, showToast]);
}
