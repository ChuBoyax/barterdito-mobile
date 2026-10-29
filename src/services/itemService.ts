import { categories, conditions } from '@/constants/listing';
import type { Item, ItemDraft, ItemFilters, ItemStatus } from '@/types/models';
import { initialsOf } from '@/utils/format';
import { isLocalPhoto, photoDataUrl } from '@/utils/photos';
import { readJson, storageKeys, writeJson } from '@/utils/storage';
import { apiRequest, authenticatedRequest, mediaUrl, storedMediaPath } from './api';
import { delay } from './client';

type ApiStatus = 'active' | 'in_negotiation' | 'traded';

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  looking_for: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  tags?: string[];
  status: ApiStatus;
  view_count: number;
  heart_count: number;
  created_at: string;
  image_urls: string[];
};

type OwnerRow = { id: string; full_name: string; display_name: string; avatar_url: string | null; completed_trades_count: number };
type PageResponse = { configured?: boolean; posts: PostRow[]; profiles: OwnerRow[]; total: number; total_views: number; total_hearts: number };
type ItemResponse = { post: PostRow; profile: OwnerRow };

export type ItemsPage = { items: Item[]; total: number; totalViews: number; totalHearts: number };
export type Place = { id: string; label: string; latitude: number; longitude: number };

export const PAGE_SIZE = 50;

const toApiStatus: Record<ItemStatus, ApiStatus> = { Active: 'active', 'In Negotiation': 'in_negotiation', Traded: 'traded' };
const fromApiStatus: Record<ApiStatus, ItemStatus> = { active: 'Active', in_negotiation: 'In Negotiation', traded: 'Traded' };

/** Signed-in account id, used to flag the viewer's own listings. Set by AuthProvider. */
let viewerId: string | null = null;

export function setViewer(id: string | null) {
  viewerId = id;
}

function timeAgo(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function toItem(post: PostRow, owner: OwnerRow | undefined): Item {
  const name = owner?.display_name || owner?.full_name || 'Barterdito trader';
  const images = (post.image_urls ?? []).map((path) => mediaUrl(path)).filter((url): url is string => Boolean(url));
  return {
    id: post.id,
    userId: post.user_id,
    title: post.title,
    category: post.category,
    condition: post.condition,
    location: post.location,
    latitude: post.latitude ?? null,
    longitude: post.longitude ?? null,
    tags: post.tags ?? [],
    hearts: post.heart_count,
    views: post.view_count,
    age: timeAgo(post.created_at),
    image: images[0] ?? '',
    imageUrls: images,
    owner: name,
    ownerAvatar: initialsOf(name) || 'BD',
    ownerAvatarUrl: mediaUrl(owner?.avatar_url),
    rating: 0,
    trades: owner?.completed_trades_count ?? 0,
    wanted: post.looking_for,
    description: post.description,
    status: fromApiStatus[post.status] ?? 'Active',
    hot: post.heart_count >= 5,
    mine: viewerId === post.user_id,
    createdAt: post.created_at,
  };
}

function toPage(result: PageResponse): ItemsPage {
  if (result.configured === false || !Array.isArray(result.posts) || !Array.isArray(result.profiles)) {
    throw new Error('The marketplace is not available yet. Please try again later.');
  }
  const owners = new Map(result.profiles.map((owner) => [owner.id, owner]));
  return {
    items: result.posts.map((post) => toItem(post, owners.get(post.user_id))),
    total: result.total,
    totalViews: result.total_views,
    totalHearts: result.total_hearts,
  };
}

function pageQuery(offset: number, limit = PAGE_SIZE) {
  return `limit=${limit}&offset=${offset}`;
}

/** Owner listing pages are small; read them all (the API returns at most 100 per request). */
async function allPages(load: (offset: number) => Promise<ItemsPage>): Promise<Item[]> {
  const items: Item[] = [];
  for (let page = 0; page < 20; page++) {
    const result = await load(items.length);
    items.push(...result.items);
    if (!result.items.length || items.length >= result.total) break;
  }
  return items;
}

function splitTags(tags: string): string[] {
  return [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 10);
}

async function toListingWrite(draft: ItemDraft) {
  const images = await Promise.all(draft.photos.map((uri) => (isLocalPhoto(uri) ? photoDataUrl(uri) : Promise.resolve(storedMediaPath(uri)))));
  const pinned = draft.latitude !== null && draft.longitude !== null;
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    condition: draft.condition,
    looking_for: draft.lookingFor.trim(),
    location: draft.location.trim(),
    latitude: pinned ? draft.latitude : null,
    longitude: pinned ? draft.longitude : null,
    tags: splitTags(draft.tags),
    status: toApiStatus[draft.status] ?? 'active',
    images,
  };
}

async function save(draft: ItemDraft, id?: string): Promise<Item> {
  const body = await toListingWrite(draft);
  const result = await authenticatedRequest(() =>
    apiRequest<ItemResponse>(id ? `/marketplace/items/${encodeURIComponent(id)}` : '/marketplace/items', {
      method: id ? 'PUT' : 'POST',
      body,
      timeout: 60_000,
    }),
  );
  return toItem(result.post, result.profile);
}

/** Saves and hearts are device-local on the website too (no backend endpoint yet). */
type Interactions = { savedIds: string[]; heartedIds: string[] };
const interactionsKey = (userId: string) => `${storageKeys.interactions}:${userId}`;

export const itemService = {
  getCategories(): string[] {
    return categories;
  },

  getConditions(): string[] {
    return conditions;
  },

  async getItems(offset = 0): Promise<ItemsPage> {
    return toPage(await apiRequest<PageResponse>(`/marketplace/items?${pageQuery(offset)}`));
  },

  async getItem(id: string): Promise<Item> {
    const result = await apiRequest<ItemResponse>(`/marketplace/items/${encodeURIComponent(id)}`);
    return toItem(result.post, result.profile);
  },

  async getMyItems(): Promise<Item[]> {
    return allPages(async (offset) =>
      toPage(await authenticatedRequest(() => apiRequest<PageResponse>(`/marketplace/mine?${pageQuery(offset, 100)}`))),
    );
  },

  async getItemsByTrader(traderId: string): Promise<Item[]> {
    return allPages(async (offset) =>
      toPage(await apiRequest<PageResponse>(`/profiles/${encodeURIComponent(traderId)}/listings?${pageQuery(offset, 100)}`)),
    );
  },

  /** Like the website, search/filter/sort operate on the listings already loaded. */
  filterItems(source: Item[], filters: ItemFilters): Item[] {
    const query = filters.search.trim().toLowerCase();
    return source
      .filter((item) => item.status !== 'Traded')
      .filter((item) => filters.category === 'All' || item.category === filters.category)
      .filter(
        (item) =>
          !query ||
          `${item.title} ${item.category} ${item.location} ${item.description} ${item.wanted} ${(item.tags ?? []).join(' ')}`
            .toLowerCase()
            .includes(query),
      )
      .filter((item) => filters.condition === 'Any condition' || item.condition === filters.condition)
      .filter((item) => filters.location === 'Any location' || item.location === filters.location)
      .sort((a, b) => {
        if (filters.sort === 'Most hearts') return b.hearts - a.hearts;
        if (filters.sort === 'Most viewed') return b.views - a.views;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
  },

  async getInteractions(userId: string): Promise<Interactions> {
    const saved = await readJson<Interactions>(interactionsKey(userId));
    return { savedIds: saved?.savedIds ?? [], heartedIds: saved?.heartedIds ?? [] };
  },

  async setInteractions(userId: string, interactions: Interactions): Promise<void> {
    await writeJson(interactionsKey(userId), interactions);
  },

  createItem(draft: ItemDraft): Promise<Item> {
    return save(draft);
  },

  updateItem(id: string, draft: ItemDraft): Promise<Item> {
    return save(draft, id);
  },

  /** The API replaces the whole listing, so a status change resends its current fields. */
  setStatus(item: Item, status: ItemStatus): Promise<Item> {
    return save(
      {
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        lookingFor: item.wanted,
        location: item.location,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        tags: (item.tags ?? []).join(', '),
        status,
        photos: item.imageUrls?.length ? item.imageUrls : [item.image],
      },
      item.id,
    );
  },

  async deleteItem(id: string): Promise<void> {
    await authenticatedRequest(() => apiRequest(`/marketplace/items/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  },

  /** Place suggestions for the pickup location (Photon via the backend, sign-in required). */
  searchPlaces(query: string): Promise<Place[]> {
    return authenticatedRequest(() => apiRequest<Place[]>(`/marketplace/places?q=${encodeURIComponent(query.trim())}`));
  },

  /** Reports are a preview on the website as well; nothing is stored yet. */
  async reportItem(itemId: string, reason: string, details: string): Promise<void> {
    void itemId;
    void reason;
    void details;
    await delay(undefined);
  },
};
