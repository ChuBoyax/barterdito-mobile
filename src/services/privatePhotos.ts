import { apiDataUrl, authenticatedRequest } from './api';

const MAX_CACHED = 30;
/** Memory only: private photos are never written to the device, and sign-out empties this. */
const cache = new Map<string, string>();

export async function loadPrivatePhoto(path: string): Promise<string> {
  const cached = cache.get(path);
  if (cached) return cached;
  const url = await authenticatedRequest(() => apiDataUrl(path));
  cache.set(path, url);
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
  return url;
}

export function clearPrivatePhotos() {
  cache.clear();
}
