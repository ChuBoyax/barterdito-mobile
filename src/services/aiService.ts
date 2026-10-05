import type { Item } from '@/types/models';
import { delay, ServiceError } from './client';

export type DescriptionInput = {
  title: string;
  category?: string;
  condition?: string;
  notes?: string;
};


export const aiService = {
  async generateDescription({ title, category, condition, notes }: DescriptionInput): Promise<string> {
    if (!title.trim()) throw new ServiceError('Add an item title first');
    const description = [
      `${title} in ${condition?.toLowerCase() || 'good'} condition${category ? `, listed under ${category}` : ''}. ` +
        'Well cared for and ready for its next owner.',
      notes?.trim() ||
        'Happy to answer questions and meet in a safe public place nearby to inspect the item before trading.',
    ].join('\n\n');
    return delay(description, 900);
  },

 
  async getRecommendations(items: Item[], savedIds: string[]): Promise<Item[]> {
    const savedCategories = new Set(items.filter((item) => savedIds.includes(item.id)).map((item) => item.category));
    const score = (item: Item) => item.hearts + item.views / 20 + (savedCategories.has(item.category) ? 50 : 0);
    return delay([...items].filter((item) => !item.mine).sort((a, b) => score(b) - score(a)).slice(0, 12), 500);
  },
};
