import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowRight, Camera, Check, ImagePlus, MapPin, ShieldCheck, Sparkles, WandSparkles, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Badge, Button, Card, InfoNote, Screen, SelectField, TextField } from '@/components/ui';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useMarketplace, useTheme, useToast } from '@/providers';
import { aiService, itemService } from '@/services';
import type { ItemDraft } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';

const MAX_PHOTOS = 5;
const newCopy = {
  steps: ['Photos & basics', 'Trade details', 'Review & publish'],
  headings: ['Tell us about your item', 'What makes a good trade?', 'Ready to meet its next owner?'],
};
const editCopy = {
  steps: ['Photos & basics', 'Trade details', 'Review & save'],
  headings: ['Update the basics', 'Update trade details', 'Review your changes'],
};

type DraftErrors = Partial<Record<'photos' | 'title' | 'category' | 'description' | 'lookingFor' | 'location', string>>;

function draftErrors(draft: ItemDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.photos.length) errors.photos = 'Add at least one photo. Listings with photos get far more offers.';
  if (!draft.title.trim()) errors.title = 'Give your item a title';
  if (!draft.category) errors.category = 'Choose a category';
  if (draft.description.trim().length < 20) errors.description = 'Describe your item in at least 20 characters';
  if (!draft.lookingFor.trim()) errors.lookingFor = 'Tell traders what you would swap for';
  if (!draft.location.trim()) errors.location = 'Add your city so nearby traders can find you';
  return errors;
}

const stepFields: (keyof DraftErrors)[][] = [['photos', 'title', 'category', 'description'], ['lookingFor', 'location'], []];

const emptyDraft: ItemDraft = {
  title: '',
  description: '',
  category: '',
  condition: 'Like New',
  lookingFor: '',
  location: '',
  tags: '',
  photos: [],
};

export default function PostItemScreen() {
  return (
    <RequireAuth>
      <PostItemForm />
    </RequireAuth>
  );
}

function PostItemForm() {
  const { colors } = useTheme();
  const showToast = useToast();
  const pickImages = useImagePicker();
  const { upsertItem } = useMarketplace();
  // `?edit=<itemId>` reuses this form to edit an existing listing.
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const navigation = useNavigation();
  const original = useRef<string | null>(null);
  const leaving = useRef(false);

  const copy = edit ? editCopy : newCopy;
  const errors = showErrors ? draftErrors(draft) : {};
  const tile = gridWidth ? Math.floor((gridWidth - 16) / 3) : 0;

  useEffect(() => {
    if (edit) {
      void itemService
        .getItem(edit)
        .then((item) => {
          const loaded: ItemDraft = {
            ...emptyDraft,
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition,
            lookingFor: item.wanted,
            location: item.location,
            photos: item.imageUrls?.length ? item.imageUrls : [item.image],
          };
          original.current = JSON.stringify(loaded);
          setDraft(loaded);
        })
        .catch(() => showToast('Could not load this listing'));
      return;
    }
    void readJson<ItemDraft>(storageKeys.postDraft).then((saved) => {
      if (saved) setDraft({ ...emptyDraft, ...saved });
      setHydrated(true);
    });
  }, [edit, showToast]);

  // Only new listings are autosaved as a draft; edits are saved explicitly.
  useEffect(() => {
    if (hydrated && !edit) void writeJson(storageKeys.postDraft, draft);
  }, [draft, hydrated, edit]);

  // Editing: warn before leaving with unsaved changes (new listings are autosaved as a draft).
  useEffect(() => {
    if (!edit) return;
    return navigation.addListener('beforeRemove', (event) => {
      if (leaving.current || original.current === null || original.current === JSON.stringify(draft)) return;
      event.preventDefault();
      Alert.alert('Discard changes?', 'Your edits to this listing have not been saved.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
      ]);
    });
  }, [navigation, edit, draft]);

  const update = <K extends keyof ItemDraft>(field: K, value: ItemDraft[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));

  async function addPhotos() {
    const remaining = MAX_PHOTOS - draft.photos.length;
    if (remaining <= 0) return showToast(`Up to ${MAX_PHOTOS} photos`);
    const uris = await pickImages(remaining);
    if (uris.length) update('photos', [...draft.photos, ...uris].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    update('photos', draft.photos.filter((_, photoIndex) => photoIndex !== index));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const photos = [...draft.photos];
    const [picked] = photos.splice(index, 1);
    update('photos', [picked, ...photos]);
    showToast('Cover photo updated');
  }

  async function generateDescription() {
    setGenerating(true);
    try {
      const description = await aiService.generateDescription({
        title: draft.title,
        category: draft.category,
        condition: draft.condition,
        notes: draft.description,
      });
      update('description', description);
      showToast('AI description added — review it before publishing');
    } catch (error) {
      showToast(errorMessage(error, 'Could not generate a description'));
    } finally {
      setGenerating(false);
    }
  }

  async function fillLocationFromGps() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return showToast('Location permission was not granted');
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(coords).catch(() => []);
      const city = place?.city ?? place?.subregion ?? place?.region;
      update('location', city ?? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      showToast(city ? `Location set to ${city}` : 'Location added — replace coordinates with your city if preferred');
    } catch {
      showToast('Could not get your location');
    } finally {
      setLocating(false);
    }
  }

  // Checks every step before `target`; on failure, jumps to the first step with a problem and highlights it.
  function validate(target: number) {
    const all = draftErrors(draft);
    const failing = stepFields.findIndex((fields, index) => index < target && fields.some((field) => all[field]));
    if (failing === -1) return true;
    setShowErrors(true);
    setStep(failing);
    showToast('Please complete the highlighted fields');
    return false;
  }

  function goTo(target: number) {
    // Editing an existing listing: every step is already filled in, so allow jumping freely.
    if (!edit && target > step && !validate(target)) return;
    setStep(target);
  }

  async function publish() {
    if (!validate(3)) return;
    setPublishing(true);
    if (edit) {
      try {
        upsertItem(await itemService.updateItem(edit, draft));
        leaving.current = true;
        showToast('Changes saved');
        if (router.canGoBack()) router.back();
        else router.replace('/my-items');
      } catch (error) {
        showToast(errorMessage(error, 'Could not save your changes'));
      } finally {
        setPublishing(false);
      }
      return;
    }
    try {
      const item = await itemService.createItem(draft);
      upsertItem(item);
      await removeKey(storageKeys.postDraft);
      showToast('Listing published!');
      router.replace('/my-items');
    } catch (error) {
      showToast(errorMessage(error, 'Could not publish your listing'));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Screen>
      {edit ? <Stack.Screen options={{ title: 'Edit listing' }} /> : null}
      <View style={styles.steps}>
        {copy.steps.map((label, index) => {
          const active = step >= index;
          return (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: step === index }}
              accessibilityLabel={`Step ${index + 1}: ${label}`}
              onPress={() => goTo(index)}
              style={styles.step}>
              <View style={[styles.stepDot, { backgroundColor: active ? colors.orange : colors.surface2 }]}>
                {step > index ? (
                  <Check size={14} color={colors.onPrimary} />
                ) : (
                  <AppText variant="caption" weight="extrabold" style={{ color: active ? colors.onPrimary : colors.muted }}>
                    {index + 1}
                  </AppText>
                )}
              </View>
              <AppText variant="caption" color={active ? 'ink' : 'muted'} weight="bold" align="center">
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.form}>
        <View style={styles.heading}>
          <View style={styles.flex}>
            <AppText variant="eyebrow">Step {step + 1} of 3</AppText>
            <AppText variant="h2">{copy.headings[step]}</AppText>
          </View>
          {!edit ? <Badge label="Draft saved" tone="green" /> : null}
        </View>

        {step === 0 ? (
          <>
            <View style={styles.photosBlock}>
              <View style={styles.labelRow}>
                <AppText variant="small" color="ink" weight="bold">
                  Photos
                </AppText>
                <AppText variant="caption">
                  {draft.photos.length}/{MAX_PHOTOS}
                </AppText>
              </View>
              <View onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)} style={styles.photos}>
                {tile
                  ? draft.photos.map((uri, index) => (
                      <Pressable
                        key={uri + index}
                        accessibilityRole="button"
                        accessibilityLabel={index === 0 ? 'Cover photo' : `Photo ${index + 1}, tap to set as cover`}
                        onPress={() => makeCover(index)}
                        style={[styles.photoSlot, { width: tile, height: tile, backgroundColor: colors.surface2 }]}>
                        <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                        {index === 0 ? (
                          <View style={[styles.coverTag, { backgroundColor: colors.orange }]}>
                            <AppText variant="caption" weight="bold" style={{ color: colors.onPrimary }}>
                              Cover
                            </AppText>
                          </View>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove photo ${index + 1}`}
                          hitSlop={8}
                          onPress={() => removePhoto(index)}
                          style={[styles.remove, { backgroundColor: colors.scrim }]}>
                          <X size={13} color={colors.onPhoto} strokeWidth={2.6} />
                        </Pressable>
                      </Pressable>
                    ))
                  : null}
                {tile && draft.photos.length < MAX_PHOTOS ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add photos"
                    onPress={() => void addPhotos()}
                    style={[
                      styles.photoSlot,
                      styles.photoAdd,
                      { width: tile, height: tile, borderColor: errors.photos ? colors.red : colors.orange, backgroundColor: colors.orangePale },
                    ]}>
                    <ImagePlus size={22} color={colors.orange} />
                    <AppText variant="caption" color="orange" weight="bold">
                      Add photo
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
              <AppText variant="caption" color={errors.photos ? 'red' : 'muted'}>
                {errors.photos ?? (draft.photos.length > 1 ? 'Tap a photo to make it the cover.' : 'Clear, well-lit photos get more offers. The first one is your cover.')}
              </AppText>
            </View>
            <TextField
              label="Item title"
              value={draft.title}
              onChangeText={(value) => update('title', value)}
              placeholder="e.g. Fujifilm X-T20 with lens"
              maxLength={80}
              showCount
              error={errors.title}
            />
            <View style={styles.pair}>
              <View style={styles.flex}>
                <SelectField
                  label="Category"
                  value={draft.category}
                  options={itemService.getCategories().slice(1)}
                  onChange={(value) => update('category', value)}
                  placeholder="Choose"
                  error={errors.category}
                />
              </View>
              <View style={styles.flex}>
                <SelectField label="Condition" value={draft.condition} options={itemService.getConditions()} onChange={(value) => update('condition', value)} />
              </View>
            </View>
            <TextField
              label="Description"
              multiline
              value={draft.description}
              onChangeText={(value) => update('description', value)}
              placeholder="Share the story, condition, and anything a trader should know…"
              maxLength={1000}
              showCount
              error={errors.description}
              labelAction={
                <Pressable disabled={generating} onPress={() => void generateDescription()} style={styles.ai} hitSlop={6}>
                  <WandSparkles size={14} color={colors.orange} />
                  <AppText variant="caption" color="orange" weight="bold">
                    {generating ? 'Writing…' : 'Write with AI'}
                  </AppText>
                </Pressable>
              }
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <TextField
              label="What are you looking for?"
              multiline
              value={draft.lookingFor}
              onChangeText={(value) => update('lookingFor', value)}
              placeholder="Tell traders what you’d consider in exchange…"
              error={errors.lookingFor}
            />
            <TextField
              label="Location"
              icon={MapPin}
              value={draft.location}
              onChangeText={(value) => update('location', value)}
              placeholder="Barangay or city"
              error={errors.location}
              right={
                <Pressable disabled={locating} onPress={() => void fillLocationFromGps()} hitSlop={6}>
                  <AppText variant="caption" color="orange" weight="bold">
                    {locating ? 'Locating…' : 'Use GPS'}
                  </AppText>
                </Pressable>
              }
            />
            <TextField label="Tags" value={draft.tags} onChangeText={(value) => update('tags', value)} placeholder="camera, photography, mirrorless" autoCapitalize="none" />
            <InfoNote icon={ShieldCheck} title="Your exact address stays private" text="Only your city is shown publicly. Choose the meetup location later in chat." />
          </>
        ) : null}

        {step === 2 ? (
          <View style={styles.review}>
            <View style={[styles.cover, { backgroundColor: colors.surface2 }]}>
              {draft.photos[0] ? (
                <Image source={draft.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <>
                  <Camera size={32} color={colors.muted} />
                  <AppText variant="caption">Cover preview</AppText>
                </>
              )}
            </View>
            <Badge label={draft.category || 'Category'} tone="orange" />
            <AppText variant="h2">{draft.title || 'Your item title'}</AppText>
            <AppText variant="small">{draft.description || 'Your item description will appear here.'}</AppText>
            <View style={styles.row}>
              <MapPin size={14} color={colors.muted} />
              <AppText variant="caption">{draft.location || 'Your city'}</AppText>
            </View>
          </View>
        ) : null}

        {edit ? (
          // Editing: saving is always one tap away; steps are just sections.
          <View style={styles.actions}>
            {step < 2 ? (
              <Button label="Next" iconRight={ArrowRight} variant="secondary" style={styles.flex} onPress={() => goTo(step + 1)} />
            ) : (
              <Button label="Back" variant="secondary" style={styles.flex} onPress={() => setStep(step - 1)} />
            )}
            <Button label="Save changes" icon={Check} loading={publishing} style={styles.flex} onPress={() => void publish()} />
          </View>
        ) : (
          <View style={styles.actions}>
            {step > 0 ? <Button label="Back" variant="secondary" style={styles.flex} onPress={() => setStep(step - 1)} /> : null}
            {step < 2 ? (
              <Button label="Continue" iconRight={ArrowRight} style={styles.flex} onPress={() => goTo(step + 1)} />
            ) : (
              <Button label="Publish listing" icon={Sparkles} loading={publishing} style={styles.flex} onPress={() => void publish()} />
            )}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  steps: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  photosBlock: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoSlot: { borderRadius: 14, overflow: 'hidden' },
  photoAdd: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  coverTag: { position: 'absolute', left: 6, bottom: 6, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 10 },
  ai: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  review: { gap: 8 },
  cover: { height: 200, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
