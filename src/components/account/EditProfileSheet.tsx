import { Camera, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BottomSheet, Button, PressableScale, TextField } from '@/components/ui';
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
    <BottomSheet visible={visible} onClose={onClose} title="Edit profile">
      <View style={styles.photo}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={preview ? 'Change photo' : 'Add photo'}
          onPress={() => void choosePhoto()}
          scaleTo={0.95}>
          <Avatar initials={initialsOf(fullName) || user?.initials || 'BD'} imageUrl={preview} size="hero" />
          <View style={[styles.camera, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
            <Camera size={15} color={colors.onPrimary} strokeWidth={2.4} />
          </View>
        </PressableScale>
        {preview ? (
          <Pressable accessibilityRole="button" onPress={() => setAvatar(null)} hitSlop={8}>
            <AppText variant="caption" weight="semibold">
              Remove photo
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <TextField
        label="Name"
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
        placeholder="What do you like to trade?"
      />
      <TextField
        label="City"
        icon={MapPin}
        value={location}
        onChangeText={setLocation}
        maxLength={160}
        placeholder="e.g. Quezon City"
      />
      <Button label="Save changes" loading={saving} disabled={!changed} onPress={() => void save()} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
