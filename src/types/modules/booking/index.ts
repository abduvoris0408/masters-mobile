import type { IBase, IGeoLocation } from "@/types/general";
import type { EBookingStatus, EPaymentMethod } from "@/types/enums";
import type { IAuthUser } from "../auth";
import type { IWorker } from "../worker";

export interface IBooking extends IBase {
  status: EBookingStatus;
  client_id: number;
  worker_id: number;
  category_id: number;
  description: string;
  address: IGeoLocation;
  scheduled_at: string;
  price?: number;
  payment_method?: EPaymentMethod;
  client?: IAuthUser;
  worker?: IWorker;
  images?: string[];
  cancel_reason?: string;
}

export interface IBookingCreateDto {
  worker_id: number;
  category_id: number;
  description: string;
  address: IGeoLocation;
  scheduled_at: string;
  images?: string[];
  payment_method?: EPaymentMethod;
}

export interface IBookingFilter extends Record<string, unknown> {
  status?: EBookingStatus;
  page?: number;
  limit?: number;
}
