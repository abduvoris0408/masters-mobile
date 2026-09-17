export interface IContractPartyRef {
  id: number;
  guid: string;
  name: string;
  surname?: string;
  phone?: string;
}

export interface IContractCategoryRef {
  id: number;
  guid: string;
  name: string;
}

// GET /contract/detail/{orderGuid}/ — shown to the master before they accept
// a direct order via POST /contract/master-accept/{orderGuid}/. The customer
// side is already accepted (auto-confirmed when the order was placed).
export interface IContractDetail {
  id: number;
  guid: string;
  contract_title: string;
  // JSON-encoded string, same shape as IAgreementContractContent — parse
  // before rendering.
  content_snapshot: string;
  customer: IContractPartyRef;
  master: IContractPartyRef;
  category: IContractCategoryRef;
  address: string;
  price: number;
  comment: string;
  customer_accepted_at: string | null;
  master_accepted_at: string | null;
  is_customer_accepted: boolean;
  is_master_accepted: boolean;
  created_at: string;
}

// GET /contract/user-service-preview/{guid}/ — shown to the customer before
// they place a direct order on a master's service (guid here is the
// service's own guid, not an order/contract guid — no order exists yet).
export interface IUserServicePreview {
  id: number;
  guid: string;
  contract_title: string;
  // JSON-encoded string, same shape as IAgreementContractContent — parse
  // before rendering.
  content: string;
  customer: IContractPartyRef;
  master: IContractPartyRef;
  category: IContractCategoryRef;
  service_name: string;
  price: string;
}
