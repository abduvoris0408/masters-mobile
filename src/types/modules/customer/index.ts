import type { IDjangoPaginated } from "../master";

// GET /profile/customer-profile/{guid}/ — a plain customer's public info,
// shown to masters (e.g. from an application's offer-detail page). Unlike a
// master/organization profile, a customer never fills out a Profile record,
// so this is read straight off the User model — hence no address/type/level
// fields. applications_count/rating are documented as strings in the
// backend's schema (like several other numeric-looking fields across this
// API), so they're parsed with Number(...) wherever displayed.
export interface ICustomerProfile {
  id: number;
  guid: string;
  name: string;
  surname: string;
  middle_name?: string;
  applications_count: number | string;
  rating: number | string | null;
  photo: string | null;
}

// GET /customer-review/list/{user_guid}/ — reviews left *for* this customer
// (by masters they've worked with). `reviewed_by` is the master who left the
// review, nested — not a flat display name.
export interface ICustomerReviewAuthor {
  id: number;
  guid: string;
  name: string;
  surname: string;
}

export interface ICustomerReview {
  id: number;
  guid: string;
  reviewed_by: ICustomerReviewAuthor;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ICustomerReviewsResponse extends IDjangoPaginated<ICustomerReview> {
  average_rating?: number | null;
}

// POST /customer-review/create/ — a master rates the customer once the
// order is finished, mirroring ICreateReviewRequest's customer-rates-master
// counterpart but with a single overall rating instead of four sub-ratings.
export interface ICreateCustomerReviewRequest {
  order: number;
  rating: number;
  comment?: string;
}
