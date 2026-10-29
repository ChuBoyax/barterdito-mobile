import { SITE_URL } from '@/services/api';

export const APP_NAME = 'Barterdito';

/** Public website links, the same URLs the web app shares. */
export const links = {
  item: (id: string) => `${SITE_URL}/items/${encodeURIComponent(id)}`,
  trader: (id: string) => `${SITE_URL}/traders/${encodeURIComponent(id)}`,
  signup: () => `${SITE_URL}/signup`,
};

/** Same UI preview switch as the website's NEXT_PUBLIC_SENTINEL_PREVIEW. Not authorization. */
export const SENTINEL_PREVIEW = process.env.EXPO_PUBLIC_SENTINEL_PREVIEW === 'true';
