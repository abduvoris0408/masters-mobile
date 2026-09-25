import type { TPaymentType } from "@/types";

export const STEP_KEYS = [
  "category",
  "description",
  "additional_works",
  "location",
  "timing",
  "budget",
  "images",
  "review",
] as const;
export type TStepKey = (typeof STEP_KEYS)[number];

export interface WizardState {
  title: string;
  base_category: string | null;
  category: number | null;
  description: string;
  region: string | null;
  district: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  budget_from: string;
  budget_to: string;
  is_urgent: boolean | null;
  date_from: string | null;
  date_to: string | null;
  payment_type: TPaymentType;
  additional_works: number[];
}

export const INITIAL_WIZARD_STATE: WizardState = {
  title: "",
  base_category: null,
  category: null,
  description: "",
  region: null,
  district: null,
  address: "",
  latitude: null,
  longitude: null,
  budget_from: "",
  budget_to: "",
  is_urgent: null,
  date_from: null,
  date_to: null,
  payment_type: "escrow",
  additional_works: [],
};

export type SetWizardValue = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
