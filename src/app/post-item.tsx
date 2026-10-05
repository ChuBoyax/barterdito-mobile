import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ArrowRight, Camera, Check, ImagePlus, MapPin, Plus, ShieldCheck, Sparkles, WandSparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Badge, Button, Card, InfoNote, Screen, SelectField, TextField } from '@/components/ui';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useMarketplace, useTheme, useToast } from '@/providers';
import { aiService, itemService } from '@/services';
import type { ItemDraft } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';

const MAX_PHOTOS = 5;
const steps = ['Photos & basics', 'Trade details', 'Review & publish'];
const headings = ['Tell us about your item', 'What makes a good trade?', 'Ready to meet its next owner?'];

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
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void readJson<ItemDraft>(storageKeys.postDraft).then((saved) => {
      if (saved) setDraft({ ...emptyDraft, ...saved });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void writeJson(storageKeys.postDraft, draft);
  }, [draft, hydrated]);

  const update = <K extends keyof ItemDraft>(field: K, value: ItemDraft[K]) =>
    setDraft((current) => ({ ...current, [field]: value }));

  async function addPhotos() {
    const remaining = MAX_PHOTOS - draft.photos.length;
    if (remaining <= 0) return showToast(`Up to ${MAX_PHOTOS} photos`);
    const uris = await pickImages(remaining);
    if (uris.length) update('photos', [...draft.photos, ...uris].slice(0, MAX_PHOTOS));
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

  function validate(target: number) {
    if (target >= 1 && (!draft.title.trim() || !draft.category || !draft.description.trim())) {
      showToast('Add a title, category, and description first');
      return false;
    }
    if (target >= 2 && (!draft.lookingFor.trim() || !draft.location.trim())) {
      showToast('Tell traders what you want and where you are');
      return false;
    }
    return true;
  }

  function goTo(target: number) {
    if (target > step && !validate(target)) return;
    setStep(target);
  }

  async function publish() {
    if (!validate(2)) return;
    setPublishing(true);
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
      <View style={styles.steps}>
        {steps.map((label, index) => {
          const active = step >= index;
          return (
            <Pressable key={label} onPress={() => goTo(index)} style={styles.step}>
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
            <AppText variant="h2">{headings[step]}</AppText>
          </View>
          <Badge label="Draft saved" tone="green" />
        </View>

        {step === 0 ? (
          <>
            <View style={styles.photos}>
              <Pressable onPress={() => void addPhotos()} style={[styles.photoAdd, { borderColor: colors.orange, backgroundColor: colors.orangePale }]}>
                <ImagePlus size={24} color={colors.orange} />
                <AppText variant="caption" color="orange" weight="bold">
                  Add photos
                </AppText>
              </Pressable>
              {draft.photos.map((uri, index) => (
                <Pressable
                  key={uri + index}
                  accessibilityLabel="Remove photo"
                  onPress={() => update('photos', draft.photos.filter((_, photoIndex) => photoIndex !== index))}
                  style={styles.photoSlot}>
                  <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <View style={[styles.remove, { backgroundColor: colors.scrim }]}>
                    <X size={12} color={colors.onPhoto} />
                  </View>
                </Pressable>
              ))}
              {Array.from({ length: Math.max(0, MAX_PHOTOS - 1 - draft.photos.length) }, (_, index) => (
                <View key={`empty-${index}`} style={[styles.photoSlot, styles.photoEmpty, { borderColor: colors.line }]}>
                  <Plus size={18} color={colors.muted2} />
                </View>
              ))}
            </View>
            <AppText variant="caption">Up to {MAX_PHOTOS} photos. The first photo is your cover.</AppText>
            <TextField
              label="Item title"
              value={draft.title}
              onChangeText={(value) => update('title', value)}
              placeholder="e.g. Fujifilm X-T20 with lens"
              maxLength={80}
              showCount
            />
            <SelectField
              label="Category"
              value={draft.category}
              options={itemService.getCategories().slice(1)}
              onChange={(value) => update('category', value)}
              placeholder="Choose a category"
            />
            <SelectField label="Condition" value={draft.condition} options={itemService.getConditions()} onChange={(value) => update('condition', value)} />
            <TextField
              label="Description"
              multiline
              value={draft.description}
              onChangeText={(value) => update('description', value)}
              placeholder="Share the story, condition, and anything a trader should know…"
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
            />
            <TextField
              label="Location"
              icon={MapPin}
              value={draft.location}
              onChangeText={(value) => update('location', value)}
              placeholder="Barangay or city"
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

        <View style={styles.actions}>
          {step > 0 ? <Button label="Back" variant="secondary" style={styles.flex} onPress={() => setStep(step - 1)} /> : null}
          {step < 2 ? (
            <Button label="Continue" iconRight={ArrowRight} style={styles.flex} onPress={() => goTo(step + 1)} />
          ) : (
            <Button label="Publish listing" icon={Sparkles} loading={publishing} style={styles.flex} onPress={() => void publish()} />
          )}
        </View>
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
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoAdd: { width: 96, height: 96, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoSlot: { width: 70, height: 70, borderRadius: 12, overflow: 'hidden' },
  photoEmpty: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ai: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  review: { gap: 8 },
  cover: { height: 200, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
