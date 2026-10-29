import type { Item, ItemDraft } from '@/types/models';

export const MAX_PHOTOS = 5;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export const emptyDraft: ItemDraft = {
  title: '',
  description: '',
  category: '',
  condition: 'Like New',
  lookingFor: '',
  location: '',
  latitude: null,
  longitude: null,
  tags: '',
  status: 'Active',
  photos: [],
};

export type DraftField = 'photos' | 'title' | 'category' | 'description' | 'lookingFor' | 'location' | 'tags';
export type DraftErrors = Partial<Record<DraftField, string>>;

export const stepFields: DraftField[][] = [['photos', 'title', 'category', 'description'], ['lookingFor', 'location', 'tags'], []];

/** Mirrors the backend's ListingWrite rules so problems show before publishing. */
export function validateDraft(draft: ItemDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  const description = draft.description.trim();
  const lookingFor = draft.lookingFor.trim();
  const location = draft.location.trim();
  const tags = draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  if (!draft.photos.length) errors.photos = 'Add at least one photo. Listings with photos get far more offers.';
  if (title.length < 2) errors.title = 'Give your item a title (at least 2 characters)';
  if (!draft.category) errors.category = 'Choose a category';
  if (description.length < MIN_DESCRIPTION_LENGTH) errors.description = `Describe your item in at least ${MIN_DESCRIPTION_LENGTH} characters`;
  if (lookingFor.length < 2) errors.lookingFor = 'Tell traders what you would swap for';
  if (location.length < 2) errors.location = 'Add your city or barangay so nearby traders can find you';
  if (new Set(tags).size > MAX_TAGS) errors.tags = `Use up to ${MAX_TAGS} tags`;
  else if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) errors.tags = `Each tag can be up to ${MAX_TAG_LENGTH} characters`;
  return errors;
}

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
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    tags: (item.tags ?? []).join(', '),
    status: item.status,
    photos: item.imageUrls?.length ? item.imageUrls : item.image ? [item.image] : [],
  };
}

export function withCover(photos: string[], index: number): string[] {
  if (index <= 0 || index >= photos.length) return photos;
  const next = [...photos];
  const [picked] = next.splice(index, 1);
  return [picked!, ...next];
}

export function mapLink(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}
