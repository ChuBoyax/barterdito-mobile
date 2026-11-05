import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** A resized JPEG on disk. Keep the result for retries: the backend matches a retry by its exact bytes. */
export async function photoFile(uri: string, { maxSide = 1600, quality = 0.82 } = {}): Promise<string> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const scale = Math.min(1, maxSide / Math.max(original.width, original.height));
  const context = ImageManipulator.manipulate(uri);
  if (scale < 1) context.resize({ width: Math.round(original.width * scale), height: Math.round(original.height * scale) });
  const rendered = await context.renderAsync();
  return (await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality })).uri;
}

/** Remote photos are already stored by the backend; local picks still need uploading. */
export function isLocalPhoto(uri: string): boolean {
  return !/^https?:\/\//.test(uri) && !uri.startsWith('data:');
}

/**
 * Matches the website: fit within `maxSide` pixels and encode as JPEG, so uploads stay
 * well under the backend's 2 MB per-photo limit. `square` center-crops (profile photos).
 */
export async function photoDataUrl(uri: string, { maxSide = 1600, quality = 0.82, square = false } = {}): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = original;
  const context = ImageManipulator.manipulate(uri);
  let w = width;
  let h = height;
  if (square && width !== height) {
    const side = Math.min(width, height);
    context.crop({ originX: (width - side) / 2, originY: (height - side) / 2, width: side, height: side });
    w = h = side;
  }
  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale < 1) context.resize({ width: Math.round(w * scale), height: Math.round(h * scale) });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  if (!result.base64) throw new Error('Could not prepare this photo. Please choose another one.');
  return `data:image/jpeg;base64,${result.base64}`;
}
