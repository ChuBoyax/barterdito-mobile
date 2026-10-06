import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, MapPin, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { ListingPreview, PhotoGrid, StepIndicator } from '@/components/listing';
import { AppText, Badge, Button, Card, InfoNote, Screen, SelectField, TextField } from '@/components/ui';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { queryClient, useAuth, useMarketplace, useTheme, useToast } from '@/providers';
import { aiService, itemService } from '@/services';
import type { ItemDraft } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { emptyDraft, firstInvalidStep, itemToDraft, MAX_PHOTOS, validateDraft, withCover } from '@/utils/listing';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';

const LAST_STEP = 2;
const copy = {
  create: {
    steps: ['Photos & basics', 'Trade details', 'Review & publish'],
    headings: ['Tell us about your item', 'What makes a good trade?', 'Ready to meet its next owner?'],
  },
  edit: {
    steps: ['Photos & basics', 'Trade details', 'Review & save'],
    headings: ['Update the basics', 'Update trade details', 'Review your changes'],
  },
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
  const { user } = useAuth();
  const { upsertItem } = useMarketplace();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const mode = edit ? 'edit' : 'create';

  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const original = useRef<string | null>(null);

  const errors = showErrors ? validateDraft(draft) : {};
  const dirty = edit !== undefined && original.current !== null && original.current !== JSON.stringify(draft);
  const allowLeave = useUnsavedChangesGuard(dirty, 'Your edits to this listing have not been saved.');

 
  useEffect(() => {
    if (edit) {
      void itemService
        .getItem(edit)
        .then((item) => {
          const loaded = itemToDraft(item);
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


  useEffect(() => {
    if (hydrated && !edit) void writeJson(storageKeys.postDraft, draft);
  }, [draft, hydrated, edit]);

  const update = <K extends keyof ItemDraft>(field: K, value: ItemDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));

  async function addPhotos() {
    const remaining = MAX_PHOTOS - draft.photos.length;
    if (remaining <= 0) return showToast(`Up to ${MAX_PHOTOS} photos`);
    const uris = await pickImages(remaining);
    if (uris.length) update('photos', [...draft.photos, ...uris].slice(0, MAX_PHOTOS));
  }

  function makeCover(index: number) {
    if (index === 0) return;
    update('photos', withCover(draft.photos, index));
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


  function validateUpTo(target: number) {
    const failing = firstInvalidStep(validateDraft(draft), target);
    if (failing === -1) return true;
    setShowErrors(true);
    setStep(failing);
    showToast('Please complete the highlighted fields');
    return false;
  }

  function goTo(target: number) {
   
    if (!edit && target > step && !validateUpTo(target)) return;
    setStep(target);
  }

  async function submit() {
    if (!user || !validateUpTo(LAST_STEP + 1)) return;
    setPublishing(true);
    try {
      if (edit) {
        const updated = await itemService.updateItem(edit, draft);
        upsertItem(updated);
        queryClient.setQueryData(['itemService.getItem', edit], updated);
        void queryClient.invalidateQueries({ queryKey: ['itemService.getMyItems'] });
        allowLeave();
        showToast('Changes saved');
        if (router.canGoBack()) router.back();
        else router.replace('/my-items');
      } else {
        upsertItem(await itemService.createItem(draft, user));
        await removeKey(storageKeys.postDraft);
        showToast('Listing published!');
        router.replace('/my-items');
      }
    } catch (error) {
      showToast(errorMessage(error, edit ? 'Could not save your changes' : 'Could not publish your listing'));
    } finally {
      setPublishing(false);
    }
  }

  const text = copy[mode];
  const back = <Button label="Back" variant="secondary" style={styles.flex} onPress={() => setStep(step - 1)} />;

  return (
    <Screen>
      {edit ? <Stack.Screen options={{ title: 'Edit listing' }} /> : null}
      <StepIndicator steps={text.steps} current={step} onSelect={goTo} />

      <Card style={styles.form}>
        <View style={styles.heading}>
          <View style={styles.flex}>
            <AppText variant="eyebrow">
              Step {step + 1} of {LAST_STEP + 1}
            </AppText>
            <AppText variant="h2">{text.headings[step]}</AppText>
          </View>
          {!edit ? <Badge label="Draft saved" tone="green" /> : null}
        </View>

        {step === 0 ? (
          <>
            <PhotoGrid
              photos={draft.photos}
              max={MAX_PHOTOS}
              error={errors.photos}
              onAdd={() => void addPhotos()}
              onRemove={(index) => update('photos', draft.photos.filter((_, i) => i !== index))}
              onMakeCover={makeCover}
            />
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
                <Pressable disabled={generating} onPress={() => void generateDescription()} style={styles.inlineAction} hitSlop={6}>
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

        {step === LAST_STEP ? <ListingPreview draft={draft} /> : null}

        <View style={styles.actions}>
          {edit ? (
           
            <>
              {step < LAST_STEP ? <Button label="Next" iconRight={ArrowRight} variant="secondary" style={styles.flex} onPress={() => goTo(step + 1)} /> : back}
              <Button label="Save changes" icon={Check} loading={publishing} style={styles.flex} onPress={() => void submit()} />
            </>
          ) : (
            <>
              {step > 0 ? back : null}
              {step < LAST_STEP ? (
                <Button label="Continue" iconRight={ArrowRight} style={styles.flex} onPress={() => goTo(step + 1)} />
              ) : (
                <Button label="Publish listing" icon={Sparkles} loading={publishing} style={styles.flex} onPress={() => void submit()} />
              )}
            </>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pair: { flexDirection: 'row', gap: 10 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
