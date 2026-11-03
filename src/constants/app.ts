import { SITE_URL } from '@/services/api';

export const APP_NAME = 'Barterdito';

/** Public website links, the same URLs the web app shares. */
export const links = {
  item: (id: string) => `${SITE_URL}/items/${encodeURIComponent(id)}`,
  trader: (id: string) => `${SITE_URL}/traders/${encodeURIComponent(id)}`,
  signup: () => `${SITE_URL}/signup`,
};

