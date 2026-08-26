// Minimal ambient typing for the Yandex Maps JS API v2.1, loaded at runtime via
// a <script> tag (see src/lib/yandexMaps.ts) — there is no official/complete
// TS package for it, and the full SDK surface is far bigger than what this
// app uses, so `window.ymaps` stays `any` and our own wrapper functions carry
// the real, narrow types the rest of the app interacts with.
export interface YandexMapsNamespace {
  ready(callback: () => void): void;
  [key: string]: any;
}

declare global {
  interface Window {
    ymaps?: YandexMapsNamespace;
  }
}

export {};
