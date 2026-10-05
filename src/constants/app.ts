export const APP_NAME = 'Barterdito';
export const APP_URL = 'https://barterdito.ph';

/** Public, shareable web links. Keep every URL the app hands out in one place. */
export const links = {
  item: (id: string) => `${APP_URL}/items/${id}`,
  trader: (id: string) => `${APP_URL}/traders/${id}`,
};
