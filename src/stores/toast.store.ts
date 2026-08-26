import { create } from "zustand";

export type ToastKind = "error" | "success" | "warning";

interface IToast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface IToastStore {
  toast: IToast | null;
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<IToastStore>((set) => ({
  toast: null,
  push: (kind, message) => set({ toast: { id: ++nextId, kind, message } }),
  dismiss: (id) => set((s) => (s.toast?.id === id ? { toast: null } : s)),
}));
