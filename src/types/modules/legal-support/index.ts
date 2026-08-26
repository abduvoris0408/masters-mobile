import type { IDjangoPaginated } from "../master";

// GET /legal-support/category/list/ — complaint category picker options.
export interface ILegalSupportCategory {
  id: number;
  guid: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export type ILegalSupportCategoriesResponse = IDjangoPaginated<ILegalSupportCategory>;

export interface ICreateLegalSupportRequestDto {
  order: number;
  category: number;
  description: string;
  against_person: string;
}

// POST /legal-support/request/create/ response.
export interface ILegalSupportRequest extends ICreateLegalSupportRequestDto {
  id: number;
  guid: string;
  status: string;
}

// POST /legal-support/request/create-by-order-number/ — same as above, but
// for callers (like the Legal Help page) that only have the human-readable
// order number on hand, not the order's numeric pk.
export interface ICreateLegalSupportRequestByOrderNumberDto {
  order_number: string;
  category: number;
  description: string;
  against_person: string;
}

export interface ILegalSupportRequestByOrderNumber {
  id: number;
  guid: string;
  category: number;
  description: string;
  against_person: string;
  status: string;
}

// GET /legal-support/request/my-list/ — a display-oriented projection: unlike
// the create payloads, `order`/`category` here are nested objects (not pks),
// each carrying the human-readable field callers actually want to render.
export interface ILegalSupportRequestListItem {
  id: number;
  guid: string;
  order: { id: number; guid: string; order_number: string };
  category: { id: number; guid: string; name: string };
  description: string;
  against_person: string;
  is_priority: boolean;
  status: string;
  created_at: string;
}

export type ILegalSupportRequestListResponse = IDjangoPaginated<ILegalSupportRequestListItem>;
