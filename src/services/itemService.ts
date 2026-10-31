import { categories, conditions } from '@/constants/listing';
import type { Item, ItemDraft, ItemFilters, ItemStatus, Place, Trader } from '@/types/models';
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
  /** The owner's profile area (listings no longer have their own). */
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  tags?: string[];
  status: ApiStatus;
  view_count: number;
  heart_count: number;
  created_at: string;
  image_urls: string[];
};

type OwnerRow = {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  completed_trades_count: number;
  review_count?: number;
  average_rating?: number | null;
};
type PageResponse = {
  configured?: boolean;
  posts: PostRow[];
  profiles: OwnerRow[];
  /** Backend-ranked top traders for the browsing area; empty on owner pages. */
  featured_traders?: OwnerRow[];
  total: number;
  total_views: number;
  total_hearts: number;
};
type ItemResponse = { post: PostRow; profile: OwnerRow };

export type ItemsPage = { items: Item[]; featuredTraders: Trader[]; total: number; totalViews: number; totalHearts: number };

/** Nearby Map page: other traders' listings around the viewer's saved location (centre stays private). */
export type NearbyMapPage = ItemsPage & { center: { latitude: number; longitude: number }; location: string; radiusKm: number };

/** Distances offered on the Nearby Map (the backend accepts 1–100 km). */
export const MAP_RADII = [5, 10, 25, 50, 100] as const;

/**
 * Which listings the browse feed loads: around a place (within NEARBY_RADIUS_KM), around the
 * signed-in trader's saved GPS (`nearMe`, so precise coordinates never go in a URL), or everywhere.
 */
export type FeedScope = { area: Place | null; nearMe: boolean };

export const PAGE_SIZE = 50;
/** Same radius as the website's nearby browsing. */
export const NEARBY_RADIUS_KM = 50;

const toApiStatus: Record<ItemStatus, ApiStatus> = { Active: 'active', 'In Negotiation': 'in_negotiation', Traded: 'traded' };
const fromApiStatus: Record<ApiStatus, ItemStatus> = { active: 'Active', in_negotiation: 'In Negotiation', traded: 'Traded' };

/** Signed-in account id, used to flag the viewer's own listings. Set by AuthProvider. */
let viewerId: string | null = null;

export function setViewer(id: string | null) {
  viewerId = id;
}

export function timeAgo(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function ownerName(owner: OwnerRow | undefined) {
  return owner?.display_name || owner?.full_name || 'Barterdito trader';
}

function toTrader(owner: OwnerRow): Trader {
  const name = ownerName(owner);
  return {
    id: owner.id,
    name,
    initials: initialsOf(name) || 'BD',
    avatarUrl: mediaUrl(owner.avatar_url),
    rating: owner.average_rating ?? null,
    reviewCount: owner.review_count ?? 0,
    trades: owner.completed_trades_count,
  };
}

function toItem(post: PostRow, owner: OwnerRow | undefined): Item {
  const name = ownerName(owner);
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
    distanceKm: post.distance_km ?? null,
    tags: post.tags ?? [],
    hearts: post.heart_count,
    views: post.view_count,
    age: timeAgo(post.created_at),
    image: images[0] ?? '',
    imageUrls: images,
    owner: name,
    ownerAvatar: initialsOf(name) || 'BD',
    ownerAvatarUrl: mediaUrl(owner?.avatar_url),
    rating: owner?.average_rating ?? null,
    reviewCount: owner?.review_count ?? 0,
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
    featuredTraders: (result.featured_traders ?? []).slice(0, 5).map(toTrader),
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

/** No location fields: the backend gives every listing its owner's profile area. */
async function toListingWrite(draft: ItemDraft) {
  const images = await Promise.all(draft.photos.map((uri) => (isLocalPhoto(uri) ? photoDataUrl(uri) : Promise.resolve(storedMediaPath(uri)))));
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    condition: draft.condition,
    looking_for: draft.lookingFor.trim(),
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

  /** Browse feed; nearby pages come back nearest first, with `distanceKm` on each item. */
  async getItems(offset = 0, { area, nearMe }: FeedScope = { area: null, nearMe: false }): Promise<ItemsPage> {
    if (nearMe) {
      return toPage(await authenticatedRequest(() => apiRequest<PageResponse>(`/marketplace/nearby?${pageQuery(offset)}`)));
    }
    const near = area ? `&latitude=${area.latitude}&longitude=${area.longitude}&radius_km=${NEARBY_RADIUS_KM}` : '';
    return toPage(await apiRequest<PageResponse>(`/marketplace/items?${pageQuery(offset)}${near}`));
  },

  /**
   * Nearby Map (sign-in and a saved profile location required; 422 otherwise). Excludes your own
   * listings and traded items; `query` matches title, category, wanted items or the owner's area.
   */
  async getNearbyMap(radiusKm: number, query: string, offset = 0): Promise<NearbyMapPage> {
    const result = await authenticatedRequest(() =>
      apiRequest<PageResponse & { center: { latitude: number; longitude: number }; location: string; radius_km: number }>(
        `/marketplace/nearby-map?radius_km=${radiusKm}&q=${encodeURIComponent(query.trim())}&${pageQuery(offset)}`,
      ),
    );
    return { ...toPage(result), center: result.center, location: result.location, radiusKm: result.radius_km };
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
      .sort((a, b) => {
        // Distances exist only in a nearby feed; otherwise "Nearest first" falls back to newest.
        if (filters.sort === 'Nearest first' && a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
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

  /** Place suggestions for browsing another area (Photon via the backend; no sign-in needed). */
  searchPlaces(query: string): Promise<Place[]> {
    return apiRequest<Place[]>(`/marketplace/places?q=${encodeURIComponent(query.trim())}`, { timeout: 15_000 });
  },

  /** Reports are a preview on the website as well; nothing is stored yet. */
  async reportItem(itemId: string, reason: string, details: string): Promise<void> {
    void itemId;
    void reason;
    void details;
    await delay(undefined);
  },
};
