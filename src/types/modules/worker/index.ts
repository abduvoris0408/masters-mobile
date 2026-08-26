import type { IBase, IGeoLocation, TLocalizedName } from "@/types/general";
import type { EWorkerStatus } from "@/types/enums";

export interface IWorker extends IBase {
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  status: EWorkerStatus;
  rating: number;
  review_count: number;
  completed_orders: number;
  experience_years: number;
  hourly_rate?: number;
  is_available: boolean;
  location?: IGeoLocation;
  categories: IWorkerCategory[];
  portfolio?: IPortfolioItem[];
}

export interface IWorkerCategory extends IBase {
  category_id: number;
  category: ICategory;
  price_from?: number;
  price_to?: number;
}

export interface ICategory extends IBase {
  name: TLocalizedName;
  icon?: string;
  slug: string;
  parent_id: number | null;
  children?: ICategory[];
}

export interface IPortfolioItem extends IBase {
  title: string;
  description?: string;
  images: string[];
  worker_id: number;
}

export interface IWorkerFilter extends Record<string, unknown> {
  category_id?: number;
  region_id?: number;
  rating_min?: number;
  price_max?: number;
  is_available?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IWorkerCreateDto {
  bio?: string;
  experience_years: number;
  hourly_rate?: number;
  category_ids: number[];
  location?: IGeoLocation;
}
