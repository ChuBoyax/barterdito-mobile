import { mockDirectMessages, mockThreads, mockTradeMessages } from '@/mocks/trades';
import type { ChatMessage, Thread } from '@/types/models';
import { clone, delay } from './client';

export type ChatKind = 'trade' | 'direct';

const store: Record<ChatKind, Record<string, ChatMessage[]>> = {
  trade: clone(mockTradeMessages),
  direct: clone(mockDirectMessages),
};

function bucket(kind: ChatKind, threadId: string) {
  store[kind][threadId] ??= [];
  return store[kind][threadId];
}


export const messageService = {
  async getThreads(): Promise<Thread[]> {
    return delay(clone(mockThreads));
  },

  async getThread(id: string): Promise<Thread | undefined> {
    return delay(clone(mockThreads.find((thread) => thread.id === id)));
  },

  async getMessages(kind: ChatKind, threadId: string): Promise<ChatMessage[]> {
    return delay(clone(bucket(kind, threadId)), 200);
  },

  async sendMessage(kind: ChatKind, threadId: string, text: string, image?: string): Promise<ChatMessage> {
    const message: ChatMessage = { id: String(Date.now()), mine: true, text, time: 'Now', image };
    bucket(kind, threadId).push(message);
    return delay(clone(message), 150);
  },

  async editMessage(kind: ChatKind, threadId: string, messageId: string, text: string): Promise<ChatMessage> {
    const list = bucket(kind, threadId);
    const index = list.findIndex((message) => message.id === messageId);
    list[index] = { ...list[index], text, time: 'Edited now' };
    return delay(clone(list[index]), 150);
  },

  async deleteMessage(kind: ChatKind, threadId: string, messageId: string): Promise<void> {
    store[kind][threadId] = bucket(kind, threadId).filter((message) => message.id !== messageId);
    await delay(undefined, 150);
  },

  async archiveThread(threadId: string): Promise<void> {
    void threadId;
    await delay(undefined, 150);
  },
};
