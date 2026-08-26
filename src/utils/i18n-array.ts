import type { TFunction } from "i18next";

// i18next falls back to the key path (a string) while the namespace for the
// active language is still loading or the key is missing — guard against
// that here so callers can safely .map() the result.
export function tArray<T>(t: TFunction, key: string): T[] {
  const value = t(key, { returnObjects: true });
  return Array.isArray(value) ? (value as T[]) : [];
}
