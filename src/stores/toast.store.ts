import { create } from "zustand";

export type ToastKind = "error" | "success" | "warning";

interface IToast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface IToastStore {
  toast: IToast | null;
  queue: IToast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

// Toasts used to replace each other outright — if two API calls failed
// within the same tick (common when a screen fires several queries at
// once), the second `push` reset the first one's still-running animation
// mid-flight, which read as the banner flickering/jittering instead of
// showing two distinct messages. Now only one toast is visible at a time;
// anything else queues and is shown in turn once the current one dismisses.
// Consecutive duplicates (same kind+message) are coalesced instead of
// re-queued, since that's almost always the same failure reported by
// multiple parallel requests, not two different things worth separate banners.
export const useToastStore = create<IToastStore>((set, get) => ({
  toast: null,
  queue: [],
  push: (kind, message) => {
    const { toast, queue } = get();
    if (toast && toast.kind === kind && toast.message === message) return;
    if (queue.some((t) => t.kind === kind && t.message === message)) return;

    const next: IToast = { id: ++nextId, kind, message };
    if (!toast) {
      set({ toast: next });
    } else {
      set({ queue: [...queue, next] });
    }
  },
  dismiss: (id) =>
    set((s) => {
      if (s.toast?.id !== id) return s;
      const [next, ...rest] = s.queue;
      return { toast: next ?? null, queue: rest };
    }),
}));
