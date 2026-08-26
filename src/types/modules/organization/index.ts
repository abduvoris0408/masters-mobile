import type { IMasterProfileUserRef, IUserServiceCatalogServiceSummary, IUserServiceCategoryRef } from "../master";

export enum ELegalForm {
  MCHJ = "mchj",
  YATT = "yatt",
  XK = "xk",
  AJ = "aj",
  OTHER = "other",
}

export interface IOrganizationRequest {
  name: string;
  legal_form: ELegalForm;
  description?: string;
  // The raw picked file — sent as multipart, not a pre-uploaded URL. Omitted
  // entirely (undefined) when editing without changing the logo, so the
  // backend keeps the existing one.
  logo?: File;
  stir: string;
  registered_at: string;
  legal_address: string;
  director_full_name: string;
  director_phone: string;
  country: number;
  operates_regions: boolean;
  regions: number[];
  operates_districts: boolean;
  districts: number[];
  // Service categories the org offers — sent as plain numeric ids (like the
  // individual master's `categories`); list/detail return them as the richer
  // IOrganizationCategoryRef objects below.
  categories: number[];
}

// A base category (activity direction) as returned nested inside an org's
// categories. Both list/detail and the base-category catalog share this shape.
export interface IOrganizationBaseCategoryRef {
  id: number;
  guid: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// One service category attached to an organization, carrying its parent
// base_category so the edit form can recover which direction it belongs to.
export interface IOrganizationCategoryRef extends IOrganizationBaseCategoryRef {
  base_category: IOrganizationBaseCategoryRef | null;
}

// The docs describe country/regions/districts as plain display strings, but
// /organization/detail/{guid}/ actually sends id-bearing refs (an object for
// country, an array of objects for regions/districts) — typed as a union so
// callers stay honest about both shapes actually seen at runtime.
export interface IOrganizationAddressRef {
  id: number;
  guid?: string;
  name: string;
}

export interface IOrganization {
  id: number;
  guid: string;
  name: string;
  legal_form: ELegalForm;
  description: string;
  logo: string | null;
  stir: string;
  registered_at: string;
  legal_address: string;
  tax_verified: boolean;
  director_full_name: string;
  director_phone: string;
  status: string;
  is_verified: boolean;
  country: string | IOrganizationAddressRef;
  operates_regions: boolean;
  regions: string | IOrganizationAddressRef[];
  operates_districts: boolean;
  districts: string | IOrganizationAddressRef[];
  categories: IOrganizationCategoryRef[];
  owner: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Registers a not-yet-signed-up master straight into the organization —
// "organization" is the numeric IOrganization.id (not the guid), the rest
// mirrors the individual-master onboarding fields.
export interface IOrganizationMemberRegisterRequest {
  organization: number;
  phone: string;
  password: string;
  password2: string;
  name: string;
  surname: string;
  middle_name?: string;
  description?: string;
  categories: number[];
  experience_level?: number;
  country?: number;
  region?: number;
  district?: number;
}

// Public catalog — a lighter, read-only shape ("Mijozlar uchun") distinct from
// IOrganization (which is the owner-facing /organization/me-organization/ +
// /organization/detail/ shape). country/regions/districts come back as plain
// display strings here, not id-bearing refs.
export interface IOrganizationCatalogSummary {
  id: number;
  guid: string;
  name: string;
  legal_form: ELegalForm;
  logo: string | null;
  categories: IOrganizationCategoryRef[];
}

export interface IOrganizationCatalogDetail {
  id: number;
  guid: string;
  name: string;
  legal_form: ELegalForm;
  description: string;
  logo: string | null;
  is_verified: boolean;
  status: string;
  country: string;
  operates_regions: boolean;
  regions: string;
  operates_districts: boolean;
  districts: string;
  created_at: string;
  director_phone?: string;
  categories: IOrganizationCategoryRef[];
  // Embedded directly as raw served URLs here — unlike the owner-management
  // list endpoint, which returns full IIntroVideo objects (guid/id needed
  // for delete/replace).
  intro_videos: string[];
}

// Org owner's team roster — every member (published or not), unlike the
// public masters catalog. The docs render "rating"/"services" as bare
// "string" placeholders (undocumented nested serializer), so the shape below
// mirrors the sibling public catalog summary (IUserServiceCatalogSummary)
// plus the member's phone, which the roster additionally exposes.
export interface IOrganizationMemberSummary {
  id: number;
  guid: string;
  name: string;
  surname: string;
  phone: string;
  photo: string | null;
  rating: number | null;
  services: IUserServiceCatalogServiceSummary[];
}

// A single service as the org owner edits it — price + publish state,
// mirroring IUserService (the self-service edit shape) since the update
// endpoint takes the same two fields.
export interface IOrganizationMemberService {
  id: number;
  guid: string;
  service_name: string | null;
  price: string;
  is_published: boolean;
  category: IUserServiceCategoryRef;
}

// Full member record + every service regardless of publish state — backs the
// org owner's specialist detail/edit view opened from the roster.
export interface IOrganizationMemberDetail {
  id: number;
  guid: string;
  user_id: string;
  name: string;
  surname: string;
  middle_name: string | null;
  phone: string;
  photo: string | null;
  type: string;
  description: string | null;
  experience_level: string | null;
  country: string | null;
  region: string | null;
  district: string | null;
  last_login: string | null;
  services: IOrganizationMemberService[];
}

// guid targeted by this request is the service's own guid (from
// IOrganizationMemberDetail.services), not the member's.
export interface IOrganizationMemberServiceUpdateRequest {
  price: string;
  is_published: boolean;
}

export type TJoinRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type TJoinRequestInitiator = "organization" | "master";

// Usta-initiated: asks to join an organization.
export interface IJoinRequestCreateRequest {
  organization: number;
  message?: string;
}

// Organization-initiated: invites an existing master to join.
export interface IJoinRequestInviteRequest {
  organization: number;
  profile: number;
  message?: string;
}

// The docs render this as a bare "string" placeholder, but the endpoint
// actually sends an id-bearing ref — same discrepancy already seen on
// IOrganizationAddressRef above.
export interface IJoinRequestOrgRef {
  id: number;
  guid: string;
  name: string;
  logo: string | null;
}

// Likewise documented as "string" but actually an id-bearing ref wrapping the
// same user shape as IMasterProfileUserRef.
export interface IJoinRequestProfileRef {
  id: number;
  guid: string;
  user: IMasterProfileUserRef;
}

// Backing both /my-list/ (usta's own requests + invites received) and
// /org-list/ (an org's incoming requests + invites it sent) — `initiated_by`
// is what tells the two directions apart on either list.
export interface IJoinRequest {
  id: number;
  guid: string;
  organization: string | IJoinRequestOrgRef;
  profile: string | IJoinRequestProfileRef;
  initiated_by: TJoinRequestInitiator;
  message: string;
  status: TJoinRequestStatus;
  created_at: string;
}
