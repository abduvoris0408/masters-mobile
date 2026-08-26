import type { ETheme } from "../enums";

export interface IAppStore {
  theme: ETheme;
  language: string;
  setTheme: (theme: ETheme) => void;
  setLanguage: (lang: string) => void;
}
