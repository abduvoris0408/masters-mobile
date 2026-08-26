import type { IBase } from "@/types/general";
import type { IAuthUser } from "../auth";
import type { IDjangoPaginated } from "../master";

export interface IReview extends IBase {
  booking_id: number;
  client_id: number;
  worker_id: number;
  rating: number;
  comment?: string;
  images?: string[];
  client?: IAuthUser;
}

export interface IReviewCreateDto {
  booking_id: number;
  rating: number;
  comment?: string;
  images?: string[];
}

export interface ICreateReviewRequest {
  order: number;
  quality_rating: number;
  timeliness_rating: number;
  communication_rating: number;
  price_transparency_rating: number;
  comment: string;
}

export interface IProfileReviewCustomer {
  id: number;
  guid: string;
  name: string;
}

export interface IProfileReview {
  id: number;
  guid: string;
  customer: IProfileReviewCustomer;
  rating: number;
  comment: string;
  created_at: string;
}

// Swagger's documented schema only lists count/next/previous/results, but the
// endpoint description promises an average rating too — keep it optional so
// the UI degrades gracefully (falls back to the catalog's own rating field)
// if the backend doesn't actually send it.
export interface IProfileReviewsResponse extends IDjangoPaginated<IProfileReview> {
  average_rating?: number | null;
}
