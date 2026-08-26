export type EAuthModalMode = "login" | "register";

export interface IAuthModalStore {
  isOpen: boolean;
  mode: EAuthModalMode;
  open: (mode?: EAuthModalMode) => void;
  close: () => void;
}
