import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { directMessageService } from '@/services';

const POLL_MS = 1500;
/** Refresh the server's six-second typing lease at most this often while typing. */
const PULSE_MS = 2000;
/** Stop "typing" after this long without a keystroke. */
const IDLE_MS = 1800;

/**
 * Typing indicator and read receipts for a private chat, like the website: polls the other
 * trader's state, and publishes our own typing on/off (never the draft itself).
 */
export function useDirectPresence(conversationId: string, enabled: boolean, canType: boolean) {
  const [typing, setTyping] = useState(false);
  const [peerRead, setPeerRead] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let running = false;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      if (running || AppState.currentState !== 'active') return;
      running = true;
      try {
        const presence = await directMessageService.getPresence(conversationId);
        if (!active) return;
        clearTimeout(expiry);
        setPeerRead((current) => Math.max(current, presence.otherLastReadMessageId));
        setTyping(presence.otherIsTyping);
        setFailed(false);
        // The lease can lapse between polls; hide the dots when it does.
        if (presence.otherIsTyping) expiry = setTimeout(() => active && setTyping(false), presence.typingMs);
      } catch {
        if (active) {
          setTyping(false);
          setFailed(true);
        }
      } finally {
        running = false;
      }
    }
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
      clearTimeout(expiry);
    };
  }, [conversationId, enabled]);

  // Our own typing state: one request in flight, the last wanted state always wins.
  const controls = useRef<{ activity: (hasText: boolean) => void; stop: () => void }>({ activity: () => {}, stop: () => {} });
  useEffect(() => {
    if (!enabled || !canType) return;
    let typingNow = false;
    let lastPulse = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let wanted = false;
    let sending = false;
    async function pump() {
      if (sending) return;
      sending = true;
      try {
        let sent: boolean | null = null;
        while (sent !== wanted) {
          sent = wanted;
          // An offline failure is fine: the server lease simply expires.
          await directMessageService.setTyping(conversationId, sent).catch(() => undefined);
        }
      } finally {
        sending = false;
      }
    }
    const publish = (value: boolean) => {
      wanted = value;
      void pump();
    };
    const stop = () => {
      clearTimeout(idle);
      if (typingNow) {
        typingNow = false;
        publish(false);
      }
    };
    const activity = (hasText: boolean) => {
      if (!hasText || AppState.currentState !== 'active') return stop();
      const now = Date.now();
      if (!typingNow || now - lastPulse >= PULSE_MS) {
        typingNow = true;
        lastPulse = now;
        publish(true);
      }
      clearTimeout(idle);
      idle = setTimeout(stop, IDLE_MS);
    };
    controls.current = { activity, stop };
    const subscription = AppState.addEventListener('change', (status) => status !== 'active' && stop());
    return () => {
      stop();
      subscription.remove();
      controls.current = { activity: () => {}, stop: () => {} };
    };
  }, [conversationId, enabled, canType]);

  return {
    typing: enabled && typing,
    peerRead,
    failed,
    activity: (hasText: boolean) => controls.current.activity(hasText),
    stop: () => controls.current.stop(),
  };
}
