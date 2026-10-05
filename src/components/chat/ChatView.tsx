import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Avatar, LoadingView } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useTheme } from '@/providers/ThemeProvider';
import { messageService } from '@/services';
import type { ChatKind } from '@/services/messageService';
import type { ChatMessage } from '@/types/models';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

type ChatViewProps = {
  kind: ChatKind;
  threadId: string;
  name: string;
  initials: string;
  header?: ReactNode;
  typingName?: string;
};

export function ChatView({ kind, threadId, name, initials, header, typingName }: ChatViewProps) {
  const { colors } = useTheme();
  const pickImages = useImagePicker();
  const scrollRef = useRef<ScrollView>(null);
  const { data: messages = [], loading, setData } = useAsync(() => messageService.getMessages(kind, threadId), [kind, threadId]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (editingId) {
      const updated = await messageService.editMessage(kind, threadId, editingId, text);
      setData((current = []) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setEditingId(null);
      return;
    }
    const sent = await messageService.sendMessage(kind, threadId, text);
    setData((current = []) => [...current, sent]);
  }

  async function attach() {
    const [uri] = await pickImages(1);
    if (!uri) return;
    const sent = await messageService.sendMessage(kind, threadId, 'Image attachment', uri);
    setData((current = []) => [...current, sent]);
  }

  async function remove(message: ChatMessage) {
    await messageService.deleteMessage(kind, threadId, message.id);
    setData((current = []) => current.filter((entry) => entry.id !== message.id));
  }

  function openActions(message: ChatMessage) {
    const edit = () => {
      setEditingId(message.id);
      setDraft(message.text);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Edit', 'Delete', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) edit();
          if (index === 1) void remove(message);
        },
      );
      return;
    }
    Alert.alert('Message', undefined, [
      { text: 'Edit', onPress: edit },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(message) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <View style={[styles.chatHeader, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
        <Avatar initials={initials} size="small" online />
        <View style={styles.flex}>
          <AppText variant="h3">{name}</AppText>
          <View style={styles.online}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
            <AppText variant="caption">Online now</AppText>
          </View>
        </View>
      </View>
      {header}
      {loading ? (
        <LoadingView label="Loading messages…" />
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <AppText variant="caption" align="center">
            Today
          </AppText>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onLongPress={message.mine ? () => openActions(message) : undefined}
            />
          ))}
          {typingName ? (
            <AppText variant="caption" style={styles.typing}>
              {typingName} is typing…
            </AppText>
          ) : null}
        </ScrollView>
      )}
      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={() => void send()}
        onAttach={() => void attach()}
        editing={Boolean(editingId)}
        onCancelEdit={() => {
          setEditingId(null);
          setDraft('');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  list: { padding: 16, gap: 12 },
  typing: { fontStyle: 'italic' },
});
