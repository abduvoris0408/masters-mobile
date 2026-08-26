import type { IBookingCreateDto } from "../modules/booking";

export interface IBookingStore {
  draft: Partial<IBookingCreateDto>;
  setDraft: (data: Partial<IBookingCreateDto>) => void;
  clearDraft: () => void;
}

type Null<T> = T | null;
