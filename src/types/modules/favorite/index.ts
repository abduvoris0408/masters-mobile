export type TFavoriteType = "profile" | "organization";

// POST /favorite/create/ — exactly one of `profile` / `organization` (guid),
// matching `type`.
export type ICreateFavoriteRequest =
  | { type: "profile"; profile: string }
  | { type: "organization"; organization: string };

export interface IFavoriteProfile {
  id: number;
  guid: string;
  type: string;
  description: string | null;
  // Swagger documents this as a string, but the live API returns other
  // shapes too (nested user object / bare id) — read it via
  // getFavoriteProfileName instead of directly.
  user: unknown;
  // Not in the documented schema yet — used as the card thumbnail if the
  // backend starts sending it, the Avatar fallback otherwise.
  photo?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IFavoriteOrganization {
  id: number;
  guid: string;
  name: string;
  legal_form: string;
  logo: string | null;
  // Documented as a string; read via getCategoryNames, which also accepts a
  // list.
  categories: unknown;
}

// GET /favorite/list/ item — only the side matching `type` is populated.
export interface IFavorite {
  id: number;
  guid: string;
  type: TFavoriteType;
  profile: IFavoriteProfile | null;
  organization: IFavoriteOrganization | null;
}
