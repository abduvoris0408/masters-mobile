// Backend list endpoints occasionally repeat a row across two pages (an item
// shifted position between requests, or React re-ran an effect) — appending
// pages naively then produces two FlatList children with the same `guid` key,
// which React (and RN's Fabric renderer) both warn about and silently mis-render.
export function appendUniquePage<T>(base: T[], nextPage: T[], getKey: (item: T) => string): T[] {
  const seen = new Set(base.map(getKey));
  const merged = [...base];
  for (const item of nextPage) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
