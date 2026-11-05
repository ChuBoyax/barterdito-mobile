import { useCallback, useEffect, useRef, useState } from 'react';

import { clientId } from '@/services/tradeService';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';

const SAVE_DELAY_MS = 300;

type Saved = { text: string; request: { body: string; client: string } | null };

/**
 * Unsent text for one conversation, kept on this device per account. It also keeps the send's
 * request id, so a retry after a lost response or an app restart cannot post the message twice.
 */
export function useMessageDraft(scope: string) {
  const key = storageKeys.messageDrafts + scope;
  const [text, setTextState] = useState('');
  const latest = useRef<Saved>({ text: '', request: null });
  const dirty = useRef(false);

  const flush = useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const { text: current, request } = latest.current;
    void (current || request ? writeJson(key, latest.current) : removeKey(key));
  }, [key]);

  useEffect(() => {
    let active = true;
    void readJson<Saved>(key).then((saved) => {
      // Whatever was typed while this loaded wins over the saved copy.
      if (!active || dirty.current || !saved) return;
      latest.current = saved;
      setTextState(saved.text);
    });
    return () => {
      active = false;
      flush();
    };
  }, [key, flush]);

  const setText = useCallback((value: string) => {
    latest.current = { ...latest.current, text: value };
    dirty.current = true;
    setTextState(value);
  }, []);

  useEffect(() => {
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, flush]);

  /** The id to send `body` with: the same one when retrying the same text. */
  const requestFor = useCallback(
    (body: string) => {
      const current = latest.current.request;
      if (current?.body === body) return current.client;
      const client = clientId();
      latest.current = { ...latest.current, request: { body, client } };
      dirty.current = true;
      flush();
      return client;
    },
    [flush],
  );

  /** Call only after the server confirmed the send. */
  const clear = useCallback(() => {
    latest.current = { text: '', request: null };
    dirty.current = true;
    setTextState('');
    flush();
  }, [flush]);

  return { text, setText, requestFor, clear };
}
