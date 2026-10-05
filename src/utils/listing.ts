import type { Item, ItemDraft } from '@/types/models';

export const MAX_PHOTOS = 5;
export const MIN_DESCRIPTION_LENGTH = 20;

export const emptyDraft: ItemDraft = {
  title: '',
  description: '',
  category: '',
  condition: 'Like New',
  lookingFor: '',
  location: '',
  tags: '',
  photos: [],
};

export type DraftField = 'photos' | 'title' | 'category' | 'description' | 'lookingFor' | 'location';
export type DraftErrors = Partial<Record<DraftField, string>>;

/** Fields validated on each step of the listing form, in order. The last step (review) has none. */
export const stepFields: DraftField[][] = [['photos', 'title', 'category', 'description'], ['lookingFor', 'location'], []];

export function validateDraft(draft: ItemDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.photos.length) errors.photos = 'Add at least one photo. Listings with photos get far more offers.';
  if (!draft.title.trim()) errors.title = 'Give your item a title';
  if (!draft.category) errors.category = 'Choose a category';
  if (draft.description.trim().length < MIN_DESCRIPTION_LENGTH) errors.description = `Describe your item in at least ${MIN_DESCRIPTION_LENGTH} characters`;
  if (!draft.lookingFor.trim()) errors.lookingFor = 'Tell traders what you would swap for';
  if (!draft.location.trim()) errors.location = 'Add your city so nearby traders can find you';
  return errors;
}

/** Index of the first step before `target` that has an invalid field, or -1 if all are valid. */
export function firstInvalidStep(errors: DraftErrors, target: number): number {
  return stepFields.findIndex((fields, index) => index < target && fields.some((field) => errors[field]));
}

export function itemToDraft(item: Item): ItemDraft {
  return {
    ...emptyDraft,
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    lookingFor: item.wanted,
    location: item.location,
    photos: item.imageUrls?.length ? item.imageUrls : [item.image],
  };
}

/** Moves the photo at `index` to the front so it becomes the cover. */
export function withCover(photos: string[], index: number): string[] {
  if (index <= 0 || index >= photos.length) return photos;
  const next = [...photos];
  const [picked] = next.splice(index, 1);
  return [picked!, ...next];
}
