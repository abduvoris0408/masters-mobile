export interface IBase {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface IWithId<TId = number> {
  id: TId;
}

export type TLocalizedName = {
  uz: string;
  ru: string;
  en: string;
};

export type Nullable<T> = { [K in keyof T]: T[K] | null };
export type Null<T> = T | null;

export interface IFilter {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export interface IPaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  success: boolean;
  message: string;
}

export interface ITokens {
  access_token: string;
  refresh_token: string;
}

export interface IGeoLocation {
  lat: number;
  lng: number;
  address?: string;
  regionId?: number;
}
