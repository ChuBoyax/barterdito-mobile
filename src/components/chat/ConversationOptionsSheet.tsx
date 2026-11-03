import { Archive, ArchiveRestore, Mail, MailOpen, Pin, PinOff, ShieldBan, ShieldCheck } from 'lucide-react-native';

import { ActionSheet, type ActionSheetOption } from '@/components/ui';
import { queryClient, useToast } from '@/providers';
import { directMessageService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import type { DirectConversation } from '@/types/directMessages';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';

type ConversationOptionsSheetProps = {
  visible: boolean;
  conversation: DirectConversation;
  onClose: () => void;
  onChanged?: (conversation: DirectConversation) => void;
  /** Reading an open chat clears a reminder straight away, so it is only offered from the Inbox. */
  showUnread?: boolean;
};

/** Private organizing and safety actions for one conversation; none of them notify the other trader. */
export function ConversationOptionsSheet({ visible, conversation, onClose, onChanged, showUnread }: ConversationOptionsSheetProps) {
  const showToast = useToast();
  const { id, other, isPinned, isArchived, blockedByMe, unreadReminderId, lastMessage } = conversation;

  async function run(action: () => Promise<DirectConversation>, done: string) {
    try {
      onChanged?.(await action());
      showToast(done);
      void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationCounts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.blockedPeople });
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not update this conversation. Try again.'));
    }
  }

  async function block() {
    const confirmed = await confirmAction({
      title: `Block ${other.fullName}?`,
      message:
        'Neither of you can send new private messages while this block is active. Your conversation history stays available.\n\nYou can unblock this user from conversation options or Settings. Trade offers and trade conversations remain separate.',
      confirmLabel: 'Block user',
      destructive: true,
    });
    if (confirmed) await run(() => directMessageService.setBlocked(id, true), `${other.fullName} blocked`);
  }

  const options: ActionSheetOption[] = [
    {
      label: isPinned ? 'Unpin conversation' : 'Pin conversation',
      icon: isPinned ? PinOff : Pin,
      onPress: () => void run(() => directMessageService.setPinned(id, !isPinned), isPinned ? 'Conversation unpinned' : 'Conversation pinned'),
    },
    {
      label: isArchived ? 'Move to inbox' : 'Archive conversation',
      icon: isArchived ? ArchiveRestore : Archive,
      description: isArchived ? undefined : 'A new message moves it back to your inbox.',
      onPress: () => void run(() => directMessageService.setArchived(id, !isArchived), isArchived ? 'Moved to inbox' : 'Conversation archived'),
    },
  ];
  if (showUnread && lastMessage) {
    options.push({
      label: unreadReminderId ? 'Clear unread reminder' : 'Mark as unread',
      icon: unreadReminderId ? MailOpen : Mail,
      description: 'Only for you. The other trader’s read receipt does not change.',
      onPress: () => void run(() => directMessageService.setMarkedUnread(id, unreadReminderId === null), unreadReminderId ? 'Reminder cleared' : 'Marked as unread'),
    });
  }
  options.push(
    blockedByMe
      ? { label: 'Unblock user', icon: ShieldCheck, onPress: () => void run(() => directMessageService.setBlocked(id, false), `${other.fullName} unblocked`) }
      : { label: 'Block user', icon: ShieldBan, destructive: true, onPress: () => void block() },
  );

  return <ActionSheet visible={visible} onClose={onClose} title={other.fullName} subtitle="Conversation options" options={options} />;
}
