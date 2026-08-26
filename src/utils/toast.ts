import { useToastStore } from "@/stores/toast.store";

// RN stand-in for the web's antd-message-based utils/messages.ts — same call
// sites (`showError`/`showSuccess`/`showWarning`), backed by our own
// toast store + <Toast/> component instead of antd's App context.
export const showError = (message: string) => useToastStore.getState().push("error", message);
export const showSuccess = (message: string) => useToastStore.getState().push("success", message);
export const showWarning = (message: string) => useToastStore.getState().push("warning", message);
