import { Camera, LocateFixed, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BottomSheet, Button, PressableScale, TextField } from '@/components/ui';
import { useCurrentArea } from '@/hooks/useCurrentArea';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useLocationOptions } from '@/hooks/useLocationOptions';
import { useAuth, useToast } from '@/providers';
import { useTheme } from '@/providers/ThemeProvider';
import { locationPaths } from '@/services/locationService';
import type { ProfileArea, User } from '@/types/models';
import { errorMessage, initialsOf } from '@/utils/format';
import { addressIssue, addressLabel } from '@/utils/location';
import { photoDataUrl } from '@/utils/photos';
import { AddressFields } from './AddressFields';

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** `undefined` keeps the saved photo, `null` removes it, a URI replaces it. */
type AvatarChange = string | null | undefined;

function savedArea(user: User): ProfileArea {
  return {
    location: user.location ?? '',
    locationLatitude: user.locationLatitude ?? null,
    locationLongitude: user.locationLongitude ?? null,
    locationAddress: user.locationAddress ?? null,
    gpsLatitude: user.gpsLatitude ?? null,
    gpsLongitude: user.gpsLongitude ?? null,
  };
}

export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const showToast = useToast();
  const pickImages = useImagePicker();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [area, setArea] = useState<ProfileArea | null>(null);
  // Location fields are sent only once edited, so an untouched form never resets them.
  const [areaEdited, setAreaEdited] = useState(false);
  // Remounts the address pickers after "Use my location" replaces the whole address.
  const [addressRevision, setAddressRevision] = useState(0);
  const [avatar, setAvatar] = useState<AvatarChange>(undefined);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string>();
  const [areaError, setAreaError] = useState<string>();
  const countries = useLocationOptions(visible ? locationPaths.countries : null);

  const currentArea = useCurrentArea((found) => {
    setArea({
      location: found.address ? addressLabel(found.address) : found.label,
      locationAddress: found.address,
      locationLatitude: found.latitude,
      locationLongitude: found.longitude,
      gpsLatitude: found.gpsLatitude,
      gpsLongitude: found.gpsLongitude,
    });
    setAreaEdited(true);
    setAreaError(undefined);
    setAddressRevision((current) => current + 1);
  });
  const { cancel: cancelLocate } = currentArea;

  useEffect(() => {
    if (!visible || !user) return;
    setFullName(user.fullName);
    setBio(user.bio ?? '');
    setArea(savedArea(user));
    setAreaEdited(false);
    setAvatar(undefined);
    setNameError(undefined);
    setAreaError(undefined);
    cancelLocate();
    // Reset only when the sheet opens; `cancelLocate` is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, user]);

  const draft = area ?? (user ? savedArea(user) : null);
  const changed =
    Boolean(user) && (fullName !== user!.fullName || bio !== (user!.bio ?? '') || areaEdited || avatar !== undefined);
  const preview = avatar === undefined ? user?.avatarUrl : avatar;
  const hasGps = draft?.gpsLatitude != null && draft?.gpsLongitude != null;

  async function choosePhoto() {
    const [uri] = await pickImages(1, { square: true });
    if (uri) setAvatar(uri);
  }

  async function save() {
    if (!user || !draft) return;
    const name = fullName.trim();
    if (name.length < 2) return setNameError('Your name needs at least 2 characters');
    if (areaEdited && draft.locationAddress) {
      const issue = addressIssue(draft.locationAddress, countries.options.find((row) => row.code === draft.locationAddress!.countryCode));
      if (issue) return setAreaError(issue);
    }
    setSaving(true);
    try {
      // Same as the website: a square JPEG up to 512px.
      const photo = avatar ? await photoDataUrl(avatar, { maxSide: 512, quality: 0.85, square: true }) : avatar;
      const { location, ...coordinates } = draft;
      await updateProfile({
        fullName: name,
        bio,
        location: areaEdited ? location : user.location ?? '',
        ...(areaEdited ? { area: coordinates } : {}),
        ...(photo === undefined ? {} : { avatar: photo }),
      });
      showToast('Profile updated');
      onClose();
    } catch (caught) {
      const message = errorMessage(caught, 'Could not save your profile. Please try again.');
      if (areaEdited) setAreaError(message);
      showToast(message);
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

      <View style={[styles.area, { backgroundColor: colors.surface }]}>
        <View style={styles.areaHead}>
          <MapPin size={17} color={colors.orange} />
          <View style={styles.flex}>
            <AppText variant="h3">Your location</AppText>
            <AppText variant="caption">Shown on your profile and listings, and used to find nearby trades.</AppText>
          </View>
        </View>
        <Button
          label={currentArea.locating ? 'Finding your location…' : 'Use my location'}
          icon={LocateFixed}
          variant="secondary"
          loading={currentArea.locating}
          onPress={() => void currentArea.locate()}
        />
        {currentArea.status ? <AppText variant="caption" color="green" weight="semibold">{currentArea.status}</AppText> : null}
        {currentArea.error ? (
          <View style={styles.row}>
            <AppText variant="caption" color="red" style={styles.flex}>
              {currentArea.error}
            </AppText>
            {currentArea.blocked ? (
              <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} hitSlop={8}>
                <AppText variant="caption" color="orange" weight="bold">
                  Open Settings
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <AddressFields
          key={addressRevision}
          value={draft?.locationAddress ?? null}
          legacyLocation={draft?.location}
          onChange={(address, keepCoordinates) => {
            currentArea.cancel();
            setAreaError(undefined);
            setAreaEdited(true);
            setArea((current) => {
              const base = current ?? (user ? savedArea(user) : null);
              if (!base) return current;
              // A new place clears the old centre and GPS; the backend sets the new centre.
              const moved = keepCoordinates ? {} : { locationLatitude: null, locationLongitude: null, gpsLatitude: null, gpsLongitude: null };
              return { ...base, ...moved, locationAddress: address, location: address ? addressLabel(address) : '' };
            });
          }}
        />
        {hasGps ? (
          <AppText variant="caption">
            Coordinates captured: {draft!.gpsLatitude!.toFixed(5)}, {draft!.gpsLongitude!.toFixed(5)}. Saved with your profile and visible only to you.
          </AppText>
        ) : null}
        {areaError ? (
          <AppText variant="small" color="red" weight="semibold">
            {areaError}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption">Your name, photo, bio, and area are public. Keep your home address and contact details private.</AppText>
      <Button label="Save changes" loading={saving} disabled={!changed || currentArea.locating} onPress={() => void save()} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photo: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  area: { gap: 12, borderRadius: 18, padding: 14 },
  areaHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
