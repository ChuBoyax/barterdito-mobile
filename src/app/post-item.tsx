import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { ListingPreview, LocationField, PhotoGrid, StepIndicator } from '@/components/listing';
import { AppText, Badge, Button, Card, InfoNote, Screen, SelectField, TextField } from '@/components/ui';
import { itemStatuses } from '@/constants/status';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { queryClient, useAuth, useMarketplaceActions, useTheme, useToast } from '@/providers';
import { aiService, itemService } from '@/services';
import type { ItemDraft, ItemStatus } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { emptyDraft, firstInvalidStep, itemToDraft, MAX_DESCRIPTION_LENGTH, MAX_PHOTOS, validateDraft, withCover } from '@/utils/listing';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';
import { queryKeys } from '@/services/queryKeys';

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
  const { upsertItem } = useMarketplaceActions();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const mode = edit ? 'edit' : 'create';

  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const original = useRef<string | null>(null);

  const errors = showErrors ? validateDraft(draft) : {};
  const dirty = edit !== undefined && original.current !== null && original.current !== JSON.stringify(draft);
  const allowLeave = useUnsavedChangesGuard(dirty, 'Your edits to this listing have not been saved.');
  // Drafts are scoped to the account, like the website's local drafts.
  const draftKey = `${storageKeys.postDraft}:${user?.id ?? 'guest'}`;

  useEffect(() => {
    if (edit) {
      void itemService
        .getItem(edit)
        .then((item) => {
          if (!item.mine) {
            showToast('Only the owner can edit this listing');
            return router.back();
          }
          const loaded = itemToDraft(item);
          original.current = JSON.stringify(loaded);
          setDraft(loaded);
        })
        .catch((error) => showToast(errorMessage(error, 'Could not load this listing')));
      return;
    }
    void readJson<ItemDraft>(draftKey).then((saved) => {
      if (saved) setDraft({ ...emptyDraft, ...saved, status: 'Active' });
      setHydrated(true);
    });
  }, [edit, draftKey, showToast]);

  useEffect(() => {
    if (hydrated && !edit) void writeJson(draftKey, draft);
  }, [draft, hydrated, edit, draftKey]);

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
    if (!user || publishing || !validateUpTo(LAST_STEP + 1)) return;
    setPublishing(true);
    try {
      const saved = edit ? await itemService.updateItem(edit, draft) : await itemService.createItem(draft);
      // A listing is reported live only after the API confirms it.
      upsertItem(saved);
      queryClient.setQueryData(queryKeys.item(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myItems });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      if (edit) {
        allowLeave();
        showToast('Changes saved');
        if (router.canGoBack()) router.back();
        else router.replace('/my-items');
      } else {
        await removeKey(draftKey);
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
              maxLength={MAX_DESCRIPTION_LENGTH}
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
              maxLength={1000}
              error={errors.lookingFor}
            />
            <LocationField
              value={draft.location}
              pin={draft.latitude !== null && draft.longitude !== null ? { latitude: draft.latitude, longitude: draft.longitude } : null}
              error={errors.location}
              onChange={(location, pin) =>
                setDraft((current) => ({ ...current, location, latitude: pin?.latitude ?? null, longitude: pin?.longitude ?? null }))
              }
            />
            <TextField
              label="Tags"
              value={draft.tags}
              onChangeText={(value) => update('tags', value)}
              placeholder="camera, photography, mirrorless"
              autoCapitalize="none"
              hint="Separate with commas. Up to 10 tags."
              error={errors.tags}
            />
            {edit ? (
              <SelectField label="Listing status" value={draft.status} options={itemStatuses} onChange={(value) => update('status', value as ItemStatus)} />
            ) : null}
            <InfoNote icon={ShieldCheck} title="Only the area is public" text="Your pickup area and optional map pin are public. Pick a public place, not your home address." />
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
