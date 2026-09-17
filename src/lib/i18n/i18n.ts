import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "@/locales/en/auth.json";
import enCommon from "@/locales/en/common.json";
import ruAuth from "@/locales/ru/auth.json";
import ruCommon from "@/locales/ru/common.json";
import uzAuth from "@/locales/uz/auth.json";
import uzCommon from "@/locales/uz/common.json";
import { useLanguageStore } from "@/stores/language.store";

// Web loads namespaces over HTTP (i18next-http-backend, see the web project's
// lib/i18n/i18n.ts) — RN bundles them statically instead so translations work
// offline and on first paint. Add a namespace here (and to `ns` below) as each
// feature milestone ports its screens; only common+auth exist so far.
const resources = {
  uz: { common: uzCommon, auth: uzAuth },
  ru: { common: ruCommon, auth: ruAuth },
  en: { common: enCommon, auth: enAuth },
};

// Every screen in this app is designed uz-first — deliberately NOT keyed off
// the device's system locale (an English-language phone would otherwise flip
// the whole UI to the en/*.json fallback strings on first launch). Falls back
// to "uz" until zustand/persist finishes hydrating language-storage from
// AsyncStorage, then Settings' language switcher can override at runtime.
const persistedLanguage = useLanguageStore.getState().language;

i18n.use(initReactI18next).init({
  resources,
  lng: persistedLanguage,
  fallbackLng: "uz",
  supportedLngs: ["uz", "ru", "en"],
  ns: ["common", "auth"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

useLanguageStore.subscribe((state) => {
  if (i18n.language !== state.language) i18n.changeLanguage(state.language);
});

export default i18n;
