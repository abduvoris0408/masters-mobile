export enum EProfileType {
  INDIVIDUAL = "individual",
  ORGANIZATION = "organization",
}

export interface IMasterProfileAddressRef {
  id: number;
  guid: string;
  name?: string;
  name_uz?: string;
  name_ru?: string;
}

export interface IMasterProfileCategoryRef {
  id: number;
  guid: string;
  name: string;
}

export interface IMasterProfileUserRef {
  id: number;
  guid: string;
  phone: string;
  name: string | null;
  surname: string | null;
  middle_name: string | null;
  photo?: string | null;
}

export interface IMasterProfile {
  id: number;
  guid: string;
  type: EProfileType;
  description: string;
  created_at: string;
  user: IMasterProfileUserRef;
  experience_level: IMasterProfileAddressRef | null;
  categories: IMasterProfileCategoryRef[];
  country: IMasterProfileAddressRef | null;
  region: IMasterProfileAddressRef | null;
  district: IMasterProfileAddressRef | null;
  master_profile: true;
  // Absent for masters who haven't earned a tier yet.
  level?: IMasterLevelProgress | null;
  completed_orders_count: number;
}

export interface IMeProfileStatus {
  id: number;
  guid: string;
  phone: string;
  name: string | null;
  surname: string | null;
  middle_name: string | null;
  photo?: string | null;
  master_profile: false;
}

export type IMeProfileResponse = IMasterProfile | IMeProfileStatus;

export interface IMasterProfileCreateRequest {
  type: EProfileType;
  description?: string;
  categories: number[];
  main_category?: number | string | null;
  experience_level?: number | string | null;
  country?: number | string | null;
  region?: number | string | null;
  district?: number | string | null;
}

export interface IAddressItem {
  id: number;
  guid: string;
  name: string;
}

export interface ICategoryItem {
  id: number;
  guid: string;
  name: string;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IJobsBaseCategory {
  id: number;
  guid: string;
  name: string;
  icon?: string | null;
}

export interface IJobsCategory {
  id: number;
  guid: string;
  name: string;
  icon?: string | null;
}

// GET /jobs/base-category-additional-work/list/?category=<category guid> —
// optional extra work items a client can pick for their category during
// listing creation. No price is returned by the API, so it's shown as a
// plain checklist, not the priced list a design reference might suggest.
export interface IJobsCategoryAdditionalWork {
  id: number;
  guid: string;
  name: string;
  description?: string | null;
}

export interface IExperienceLevelItem {
  id: number;
  guid: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface IDjangoPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface IUserServiceCategoryRef {
  id: number;
  guid: string;
  name: string;
  // Marks the one category a master designates as their primary
  // specialization — highlighted separately from the rest on their public
  // detail page.
  is_main: boolean;
}

export interface IUserServicePricingUnit {
  id: number;
  guid: string;
  name: string;
}

export interface IUserService {
  id: number;
  guid: string;
  service_name: string | null;
  price: string;
  is_published: boolean;
  category: IUserServiceCategoryRef;
  pricing_units: IUserServicePricingUnit[];
}

export interface IUserServiceUpdateRequest {
  price: string;
  is_published: boolean;
  pricing_unit?: string;
}

export interface IUserServiceCatalogServiceSummary {
  id: number;
  guid: string;
  service_name: string | null;
  price: string;
}

export interface IMasterCatalogListFilters {
  category?: number[];
  region?: number | null;
  district?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  min_rating?: number | null;
  q?: string;
  // Filters the catalog down to one organization's specialists.
  organization?: string | null;
  // Backend accepts `?sort=top_rated` to rank masters by rating descending
  // instead of the default order.
  sort?: "top_rated";
}

export interface IUserServiceCatalogSummary {
  id: number;
  guid: string;
  name: string;
  surname: string;
  photo: string | null;
  rating: number | null;
  services: IUserServiceCatalogServiceSummary[];
}

export interface IUserServiceCatalogServiceDetail extends IUserServiceCatalogServiceSummary {
  category: IUserServiceCategoryRef;
  allowed_units: IUserServicePricingUnit[];
}

// The org this master belongs to, as returned nested on the catalog detail
// endpoint — null for independent (non-org) masters.
export interface IUserServiceCatalogOrganizationRef {
  id: number;
  guid: string;
  name: string;
  logo: string | null;
  is_verified: boolean;
}

// Reliability/seniority tier a master has earned from their completed-order
// count (distinct from `experience_level`, which is self-declared at
// onboarding). `icon` is a served image URL.
export interface IMasterLevelTierRef {
  id: number;
  guid: string;
  name: string;
  icon: string | null;
  min_orders: number;
}

export interface IMasterLevelProgress {
  current: IMasterLevelTierRef;
  // Null once the master has reached the highest tier — there's nothing left
  // to progress toward.
  next: IMasterLevelTierRef | null;
}

export interface IProfileStatistics {
  completed_orders_count: number;
  is_10_orders_completed: boolean;
  is_50_orders_completed: boolean;
  is_100_orders_completed: boolean;
  is_fully_verified: boolean;
  is_early_master: boolean;
}

export interface IUserServiceCatalogDetail {
  id: number;
  guid: string;
  // The real user pk to target for chat/order actions — distinct from `id`,
  // which is the catalog/profile row's own id. Schema mistypes this as
  // "string" (SerializerMethodField) but it's actually numeric at runtime.
  user_id: number | string;
  name: string;
  surname: string;
  middle_name: string | null;
  phone: string;
  photo: string | null;
  rating: number | null;
  type: EProfileType;
  description: string | null;
  experience_level: string | null;
  // Absent for masters who haven't earned a tier yet.
  level: IMasterLevelProgress | null;
  completed_orders_count: number;
  country: IMasterProfileAddressRef | null;
  region: IMasterProfileAddressRef | null;
  district: IMasterProfileAddressRef | null;
  last_login: string | null;
  services: IUserServiceCatalogServiceDetail[];
  organization: IUserServiceCatalogOrganizationRef | null;
  // Embedded directly as raw served URLs here — unlike the owner-management
  // list endpoint, which returns full IIntroVideo objects (guid/id needed
  // for delete/replace).
  intro_videos: string[];
}
