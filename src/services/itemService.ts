import { categories, conditions, mockItems } from '@/mocks/items';
import type { Item, ItemDraft, ItemFilters } from '@/types/models';
import { clone, delay, ServiceError } from './client';

// In-memory store so hearts/new listings persist during a session.
let items: Item[] = clone(mockItems);
let savedIds: string[] = [];
let heartedIds: string[] = [];

export const itemService = {
  getCategories(): string[] {
    return categories;
  },

  getConditions(): string[] {
    return conditions;
  },

  /** Backend: `trade_posts` where status in (active, in_negotiation), joined with `user_profiles`. */
  async getItems(): Promise<Item[]> {
    return delay(clone(items.filter((item) => item.status !== 'Traded')));
  },

  /** Backend: single `trade_posts` row by id. */
  async getItem(id: string): Promise<Item> {
    const item = items.find((entry) => entry.id === id);
    if (!item) throw new ServiceError('Item not found');
    return delay(clone(item));
  },

  /** Backend: `trade_posts` where user_id = current user. */
  async getMyItems(): Promise<Item[]> {
    return delay(clone(items.filter((item) => item.mine)));
  },

  /** Backend: `trade_posts` where user_id = traderId. */
  async getItemsByTrader(traderId: string): Promise<Item[]> {
    return delay(clone(items.filter((item) => item.userId === traderId)));
  },

  /** Pure client-side filtering; the backend version can push this into the query. */
  filterItems(source: Item[], filters: ItemFilters): Item[] {
    const query = filters.search.trim().toLowerCase();
    return source
      .filter((item) => item.status !== 'Traded')
      .filter((item) => filters.category === 'All' || item.category === filters.category)
      .filter(
        (item) =>
          !query ||
          `${item.title} ${item.category} ${item.location} ${item.description}`
            .toLowerCase()
            .includes(query),
      )
      .filter((item) => filters.condition === 'Any condition' || item.condition === filters.condition)
      .filter((item) => filters.location === 'Any location' || item.location === filters.location)
      .sort((a, b) => {
        if (filters.sort === 'Most hearts') return b.hearts - a.hearts;
        if (filters.sort === 'Most viewed') return b.views - a.views;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
  },

  /** Backend: `saved_items` + `post_hearts` for the current user. */
  async getInteractions(): Promise<{ savedIds: string[]; heartedIds: string[] }> {
    return delay({ savedIds: [...savedIds], heartedIds: [...heartedIds] }, 100);
  },

  /** Backend: insert/delete on `saved_items`. */
  async setSaved(itemId: string, saved: boolean): Promise<void> {
    savedIds = saved ? [...new Set([...savedIds, itemId])] : savedIds.filter((id) => id !== itemId);
    await delay(undefined, 150);
  },

  /** Backend: insert/delete on `post_hearts` (heart_count is updated by a DB trigger). */
  async setHeart(itemId: string, hearted: boolean): Promise<void> {
    heartedIds = hearted ? [...new Set([...heartedIds, itemId])] : heartedIds.filter((id) => id !== itemId);
    items = items.map((item) =>
      item.id === itemId ? { ...item, hearts: Math.max(0, item.hearts + (hearted ? 1 : -1)) } : item,
    );
    await delay(undefined, 150);
  },

  /** Backend: upload photos to storage, then insert into `trade_posts`. */
  async createItem(draft: ItemDraft): Promise<Item> {
    const item: Item = {
      id: String(Date.now()),
      userId: 'john-ramirez',
      title: draft.title,
      category: draft.category,
      condition: draft.condition,
      location: draft.location,
      hearts: 0,
      views: 0,
      age: 'Just now',
      image:
        draft.photos[0] ??
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
      imageUrls: draft.photos,
      owner: 'John Ramirez',
      ownerAvatar: 'JR',
      rating: 4.9,
      trades: 27,
      wanted: draft.lookingFor,
      description: draft.description,
      status: 'Active',
      mine: true,
    };
    items = [item, ...items];
    return delay(clone(item), 600);
  },

  /** Backend: soft-delete / archive a `trade_posts` row. */
  async archiveItem(id: string): Promise<void> {
    items = items.filter((item) => item.id !== id);
    await delay(undefined);
  },

  /** Backend: insert into `reports`. */
  async reportItem(itemId: string, reason: string, details: string): Promise<void> {
    void itemId;
    void reason;
    void details;
    await delay(undefined);
  },
};
