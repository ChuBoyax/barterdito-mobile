/** Splits a list into rows of `size`, for grids inside a scrolling screen. */
export function chunk<T>(list: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, index * size + size));
}

/**
 * Adds or updates entries by id, oldest first. Returns `current` itself when nothing changed,
 * so a poll that finds no news does not re-render the chat.
 */
export function mergeById<T extends { id: number }>(current: T[], incoming: T[]): T[] {
  const known = new Map(current.map((entry) => [entry.id, entry]));
  let changed = false;
  for (const entry of incoming) {
    const existing = known.get(entry.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(entry)) continue;
    known.set(entry.id, entry);
    changed = true;
  }
  return changed ? [...known.values()].sort((a, b) => a.id - b.id) : current;
}

/** Keeps the previous object when a poll returned the same content, so nothing re-renders. */
export function keepIfSame<T>(previous: T, next: T): T {
  return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
}
