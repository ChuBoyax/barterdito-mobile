import type { Item } from '@/types/models';
import { delay, ServiceError } from './client';

export type DescriptionInput = {
  title: string;
  category?: string;
  condition?: string;
  /** The description being replaced, so the new wording always differs from it. */
  previous?: string;
};

type Condition = { label: string; wear: string[] };

/** What can honestly be said for each condition the seller picked. */
const conditions: Record<string, Condition> = {
  New: { label: 'brand new', wear: ['Never used and ready for its first owner.', 'Still in perfect shape, with no signs of use.'] },
  'Like New': { label: 'like new', wear: ['Barely used and well cared for.', 'Kept in great shape with hardly any signs of use.'] },
  Good: { label: 'good', wear: ['Shows only light, normal signs of use.', 'Looked after and in good shape overall.'] },
  Fair: { label: 'fair', wear: ['Has visible signs of use, which you can check in the photos.', 'Shows some wear, so please look at the photos before offering.'] },
  Poor: { label: 'poor', wear: ['Has noticeable wear, so it suits someone who can fix it up or use it for parts.', 'Heavily used and traded as is, so please check the photos first.'] },
};

const openers = [
  (title: string, label: string, place: string) => `${title} in ${label} condition${place}.`,
  (title: string, label: string, place: string) => `Up for trade: ${title}, in ${label} condition${place}.`,
  (title: string, label: string, place: string) => `Offering my ${title} (${label} condition)${place}.`,
  (title: string, label: string, place: string) => `${title}${place}, in ${label} condition and looking for a swap.`,
];

const closers = [
  'Happy to answer questions and meet in a safe public place nearby so you can inspect it before we trade.',
  'Message me for more photos or details. We can meet in a public place to check it together.',
  "Open to fair swaps. Let's meet somewhere public and well-lit so we can both inspect the items.",
  'Feel free to ask anything about it. I prefer meeting in a busy public place for the exchange.',
  'Send a proposal if you have something interesting to swap, and we can arrange a safe meetup.',
];

const pick = <T>(options: T[]): T => options[Math.floor(Math.random() * options.length)]!;

function compose({ title, category, condition }: DescriptionInput): string {
  const info = conditions[condition ?? ''] ?? conditions.Good!;
  const place = category ? `, listed under ${category}` : '';
  return [`${pick(openers)(title.trim(), info.label, place)} ${pick(info.wear)}`, pick(closers)].join('\n\n');
}

export const aiService = {
  async generateDescription(input: DescriptionInput): Promise<string> {
    if (!input.title.trim()) throw new ServiceError('Add an item title first');
    let description = compose(input);
    // The wording is picked at random, so a repeat is rare; try again until it differs.
    for (let attempt = 0; attempt < 10 && description === input.previous?.trim(); attempt++) description = compose(input);
    return delay(description, 900);
  },

 
  async getRecommendations(items: Item[], savedIds: string[]): Promise<Item[]> {
    const savedCategories = new Set(items.filter((item) => savedIds.includes(item.id)).map((item) => item.category));
    const score = (item: Item) => item.hearts + item.views / 20 + (savedCategories.has(item.category) ? 50 : 0);
    // Your own listings and finished trades are not trade ideas.
    return delay(items.filter((item) => !item.mine && item.status !== 'Traded').sort((a, b) => score(b) - score(a)).slice(0, 12), 500);
  },
};
