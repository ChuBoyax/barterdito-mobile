import { Camera, MapPin, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BottomSheet, Button, TextField } from '@/components/ui';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useAuth, useToast } from '@/providers';
import { useTheme } from '@/providers/ThemeProvider';
import { errorMessage, initialsOf } from '@/utils/format';
import { photoDataUrl } from '@/utils/photos';

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** `undefined` keeps the saved photo, `null` removes it, a URI replaces it. */
type AvatarChange = string | null | undefined;

export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const showToast = useToast();
  const pickImages = useImagePicker();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState<AvatarChange>(undefined);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string>();

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.fullName);
    setBio(user.bio ?? '');
    setLocation(user.location ?? '');
    setAvatar(undefined);
    setNameError(undefined);
  }, [visible, user]);

  const changed =
    Boolean(user) &&
    (fullName !== user!.fullName || bio !== (user!.bio ?? '') || location !== (user!.location ?? '') || avatar !== undefined);
  const preview = avatar === undefined ? user?.avatarUrl : avatar;

  async function choosePhoto() {
    const [uri] = await pickImages(1, { square: true });
    if (uri) setAvatar(uri);
  }

  async function save() {
    const name = fullName.trim();
    if (name.length < 2) return setNameError('Your name needs at least 2 characters');
    setSaving(true);
    try {
      // Same as the website: a square JPEG up to 512px.
      const photo = avatar ? await photoDataUrl(avatar, { maxSide: 512, quality: 0.85, square: true }) : avatar;
      await updateProfile({ fullName: name, bio, location, ...(photo === undefined ? {} : { avatar: photo }) });
      showToast('Profile updated');
      onClose();
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Account" title="Edit profile">
      <View style={styles.photoRow}>
        <Avatar initials={initialsOf(fullName) || user?.initials || 'BD'} imageUrl={preview} size="large" />
        <View style={styles.photoActions}>
          <Pressable accessibilityRole="button" onPress={() => void choosePhoto()} hitSlop={6} style={styles.photoAction}>
            <Camera size={15} color={colors.orange} />
            <AppText variant="small" color="orange" weight="bold">
              {preview ? 'Change photo' : 'Add photo'}
            </AppText>
          </Pressable>
          {preview ? (
            <Pressable accessibilityRole="button" onPress={() => setAvatar(null)} hitSlop={6} style={styles.photoAction}>
              <Trash2 size={15} color={colors.red} />
              <AppText variant="small" color="red" weight="bold">
                Remove photo
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
      <TextField
        label="Full name"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          setNameError(undefined);
        }}
        autoCapitalize="words"
        maxLength={120}
        error={nameError}
      />
      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={500}
        showCount
        placeholder="What do you like to trade? What are you looking for?"
      />
      <TextField
        label="City / barangay"
        icon={MapPin}
        value={location}
        onChangeText={setLocation}
        maxLength={160}
        placeholder="e.g. Quezon City"
        hint="Shown on your public profile."
      />
      <Button label="Save changes" loading={saving} disabled={!changed} onPress={() => void save()} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoActions: { gap: 10 },
  photoAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
