import { MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import { BottomSheet, Button, TextField } from '@/components/ui';
import { useAuth, useToast } from '@/providers';

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const { user, updateProfile } = useAuth();
  const showToast = useToast();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string>();

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.fullName);
    setBio(user.bio ?? '');
    setLocation(user.location ?? '');
    setNameError(undefined);
  }, [visible, user]);

  const changed = Boolean(user) && (fullName !== user!.fullName || bio !== (user!.bio ?? '') || location !== (user!.location ?? ''));

  async function save() {
    if (!fullName.trim()) return setNameError('Your name is required');
    setSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), bio: bio.trim(), location: location.trim() });
      showToast('Profile updated');
      onClose();
    } catch {
      showToast('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Account" title="Edit profile">
      <TextField
        label="Full name"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          setNameError(undefined);
        }}
        autoCapitalize="words"
        maxLength={60}
        error={nameError}
      />
      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={160}
        showCount
        placeholder="What do you like to trade? What are you looking for?"
      />
      <TextField label="City" icon={MapPin} value={location} onChangeText={setLocation} placeholder="e.g. Quezon City" hint="Only your city is shown publicly." />
      <Button label="Save changes" loading={saving} disabled={!changed} onPress={() => void save()} />
    </BottomSheet>
  );
}
