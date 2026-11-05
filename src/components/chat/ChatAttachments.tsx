import { Image } from 'expo-image';
import { ImagePlus, PackagePlus, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ActionSheet, AppText, BottomSheet, Button } from '@/components/ui';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { clientId } from '@/services/tradeService';
import { errorMessage } from '@/utils/format';
import { photoFile } from '@/utils/photos';
import { ListingShareSheet } from './ListingShareSheet';

type ChatAttachmentsProps = {
  visible: boolean;
  onClose: () => void;
  shareListing: (listingId: string, requestId: string) => Promise<void>;
  sendPhoto: (fileUri: string, requestId: string) => Promise<void>;
};

/** The composer's "+" menu, shared by private and trade chats. */
export function ChatAttachments({ visible, onClose, shareListing, sendPhoto }: ChatAttachmentsProps) {
  const pickImages = useImagePicker();
  const [sharing, setSharing] = useState(false);
  const sharingMounted = useMountOnOpen(sharing);
  const [picked, setPicked] = useState<string | null>(null);

  async function choosePhoto() {
    const [uri] = await pickImages(1);
    if (uri) setPicked(uri);
  }

  return (
    <>
      <ActionSheet
        visible={visible}
        onClose={onClose}
        title="Add to message"
        options={[
          { label: 'Send a photo', icon: ImagePlus, onPress: () => void choosePhoto() },
          { label: 'Share a listing', icon: PackagePlus, onPress: () => setSharing(true) },
        ]}
      />
      {sharingMounted ? <ListingShareSheet visible={sharing} onClose={() => setSharing(false)} onShare={shareListing} /> : null}
      {picked ? <PhotoSendSheet key={picked} uri={picked} onClose={() => setPicked(null)} onSend={sendPhoto} /> : null}
    </>
  );
}

function PhotoSendSheet({ uri, onClose, onSend }: { uri: string; onClose: () => void; onSend: (fileUri: string, requestId: string) => Promise<void> }) {
  const [file, setFile] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Keeps the same id and file across retries, so a lost response cannot send the photo twice.
  const request = useRef(clientId());

  useEffect(() => {
    let active = true;
    photoFile(uri)
      .then((prepared) => active && setFile(prepared))
      .catch(() => active && setError('This photo could not be opened. Choose another photo.'));
    return () => {
      active = false;
    };
  }, [uri]);

  async function send() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      await onSend(file, request.current);
      onClose();
    } catch (caught) {
      setError(`${errorMessage(caught, 'Could not send this photo.')} Your photo is kept here so you can retry.`);
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible onClose={() => !busy && onClose()} eyebrow="Private" title="Send a photo">
      <Image source={uri} style={styles.preview} contentFit="contain" />
      <AppText variant="caption">Only the people in this conversation can open it. Location and other photo details are removed.</AppText>
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <Button label="Send photo" icon={Send} loading={busy} disabled={!file} onPress={() => void send()} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 260, borderRadius: 16 },
});
