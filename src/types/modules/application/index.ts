import type { IJobsCategoryAdditionalWork } from "../master";

export interface IApplicationCategoryRef {
  id: number;
  guid: string;
  name: string;
  icon?: string | null;
}

// GET /application/application-title/list/?q= — pre-defined listing titles
// (with their category already attached) that a client can search while
// typing, so they don't have to hunt through the base-category → category
// cascade manually.
export interface IApplicationTitleSuggestion {
  id: number;
  guid: string;
  title: string;
  category: IApplicationCategoryRef;
}

export interface IApplication {
  id: number;
  guid: string;
  /** User id of the client who posted the listing — used to start a direct
   *  chat with them (the `user` key) when a master sends an offer. */
  customer: number;
  title: string;
  description: string;
  address: string;
  // Exact pin dropped on the map when the listing was created/edited — null
  // for listings posted before location picking existed, or if the client
  // skipped it.
  latitude: string | null;
  longitude: string | null;
  budget_from: string;
  budget_to: string;
  status: string;
  created_at: string;
  category: IApplicationCategoryRef;
  // The window the work itself needs to happen in (not the listing's post
  // date) — both null when the client hasn't set a deadline.
  date_from: string | null;
  date_to: string | null;
  // Client marked the job as needing to be done as soon as possible.
  is_urgent: boolean;
  // How the winning offer gets paid — set once at listing-creation time.
  // "escrow" gates the accept flow behind a payments/escrow/create/ call.
  payment_type?: TPaymentType;
  // How many offers this listing has received so far — shown on the
  // catalog card/table so a worker can gauge competition at a glance.
  offers_count: number;
  // Extra work items picked for the listing's category (see
  // GET /jobs/base-category-additional-work/list/), returned as full
  // objects the same way `category` is embedded rather than bare ids.
  additional_works?: IJobsCategoryAdditionalWork[];
}

// GET /application/map-list/ — a lightweight, unpaginated projection of open
// listings for plotting pins on the catalog map (guid + coords only).
export interface IApplicationMapListItem {
  guid: string;
  latitude: string;
  longitude: string;
}

export interface IApplicationsListFilters {
  category?: number[];
  region?: number | null;
  district?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  q?: string;
  guid?: string;
  // Backend accepts `?sort=most_offers` to rank listings by offers_count
  // descending instead of the default newest-first order.
  sort?: "most_offers";
}

export type TPaymentType = "escrow" | "direct";

export interface ICreateApplicationRequest {
  title: string;
  category: number;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  region?: number;
  district?: number;
  budget_from: number;
  budget_to: number;
  date_from?: string;
  date_to?: string;
  is_urgent?: boolean;
  payment_type?: TPaymentType;
  // Ids of the extra work items picked in the wizard's additional-works step
  // (GET /jobs/base-category-additional-work/list/?category=<guid>), scoped
  // to whichever category was selected.
  additional_works?: number[];
}

// Editing a listing sends only the changed fields (PATCH). `status` is used on
// its own to cancel a listing (`{ status: "cancelled" }`) since listings can't
// be deleted — they're moved to the cancelled state instead.
export interface IUpdateApplicationRequest {
  title?: string;
  category?: number;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  region?: number;
  district?: number;
  budget_from?: number;
  budget_to?: number;
  date_from?: string;
  date_to?: string;
  is_urgent?: boolean;
  payment_type?: TPaymentType;
  status?: string;
  additional_works?: number[];
}

export interface IApplicationOfferMaster {
  id: number;
  guid: string;
  name: string;
  phone: string;
  photo?: string | null;
}

export interface IApplicationOffer {
  id: number;
  guid: string;
  master: IApplicationOfferMaster;
  price: string;
  comment: string;
  status: string;
  created_at: string;
}

// POST /application/offer/accept/{guid}/ returns the newly created order
// itself (not the offer) — its id/guid is what payments/escrow/create/ needs.
export interface IOfferAcceptResponse {
  id: number;
  guid: string;
  customer: { id: number; guid: string; name: string; phone: string };
  master: { id: number; guid: string; name: string };
  application: number;
  offer: number;
  price: string;
  address: string;
  comment: string;
  status: string;
  created_at: string;
}

// Present on the detail response once an offer has been accepted for this
// listing — `has_escrow` false means the customer accepted but hasn't paid
// into escrow yet, so the detail page can offer a "resume payment" button.
export interface IApplicationOrderRef {
  id: number;
  guid: string;
  price: number;
  has_escrow: boolean;
}

export interface IApplicationDetail extends IApplication {
  offers?: IApplicationOffer[];
  order?: IApplicationOrderRef | null;
}

// GET /application/detail/{guid}/ — unlike IApplication's plain `customer`
// user id (used to start a chat), this nests the customer's public profile
// summary shown on the offer-detail page.
export interface IApplicationPublicDetailCustomer {
  guid: string;
  name: string;
  surname: string;
  applications_count: number;
  rating: number;
  reviews_count: number;
}

export interface IApplicationPublicDetail extends Omit<IApplication, "customer"> {
  customer: IApplicationPublicDetailCustomer;
  views_count?: number;
}

export interface ICreateOfferRequest {
  application: number;
  price: number;
  comment: string;
}

// The `content` field of GET /application/offer/agreement-preview/{guid}/ is a
// JSON-encoded string (not a nested object) — parse it before rendering.
export interface IAgreementContractContent {
  header: string;
  title1: string;
  body1: string;
  title2: string;
  body2: string;
  title3: string;
  body3: string;
  title4: string;
  body4: string;
  title5: string;
  body5: string;
}

export interface IAgreementPartyRef {
  id: number;
  guid: string;
  name: string;
  surname: string;
  phone?: string;
}

export interface IAgreementCategoryRef {
  id: number;
  guid: string;
  name: string;
}

// GET /application/offer/agreement-preview/{offerGuid}/ — auto-generated
// service contract shown to the customer before they accept an offer.
export interface IAgreementPreview {
  id: number;
  guid: string;
  contract_title: string;
  content: string;
  customer: IAgreementPartyRef;
  master: IAgreementPartyRef;
  category: IAgreementCategoryRef;
  address: string;
  price: string;
  comment: string;
  payment_type: TPaymentType;
}

export interface IMyOfferApplicationRef {
  id: number;
  guid: string;
  category: { id: number; name: string };
  description: string;
  status: string;
}

export interface IMyOffer {
  id: number;
  guid: string;
  application: IMyOfferApplicationRef;
  price: string;
  comment: string;
  status: string;
  created_at: string;
}

export type TOrderStatus =
  | "new"
  | "accepted"
  | "contract_signed"
  | "in_progress"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled";

export interface ICreateOrderRequest {
  user_service: number;
  address: string;
  comment: string;
}

export interface IOrderUserRef {
  id: number;
  guid: string;
  name: string;
  phone?: string;
  photo?: string | null;
}

// Nested on the customer-side order list (order/my-list/) so a "Pay now"
// button can be shown without a separate application lookup.
export interface IOrderApplicationRef {
  id: number;
  guid: string;
  title: string;
  payment_type: TPaymentType;
}

export interface IMasterOrder {
  id: number;
  guid: string;
  order_number: string;
  customer: IOrderUserRef;
  master: IOrderUserRef;
  price: string;
  address: string;
  comment: string;
  status: TOrderStatus;
  created_at: string;
  has_review: boolean;
  // Authoritative "already rated" flag from the backend (despite the name,
  // true means the rate button should be hidden, not shown) — drives the
  // button instead of has_review, which didn't cover every case.
  can_rate: boolean;
  // Both optional — only present on the customer's own order list, not the
  // master's. `has_escrow` false + an escrow `payment_type` means the
  // customer accepted the offer but hasn't funded escrow yet.
  application?: IOrderApplicationRef;
  has_escrow?: boolean;
}

// POST /application/order/create/ returns a different shape than the list
// endpoints: `master` here is the raw FK id (not a nested user object).
export interface IOrderDirectCreateResponse {
  id: number;
  guid: string;
  user_service: number | null;
  address: string | null;
  comment: string | null;
  price: string;
  status: TOrderStatus;
  master: number;
}
