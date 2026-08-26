export enum ENotificationType {
  NEW_APPLICATION = "new_application",
  ADMIN_BROADCAST = "admin_broadcast",
  ADMIN_DIRECT = "admin_direct",
}

export interface INotificationCategoryRef {
  id: number;
  guid: string;
  name: string;
  icon: string;
}

export interface INotificationRoleRef {
  id: number;
  guid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface INotificationApplicationRef {
  id: number;
  guid: string;
  description: string;
  address: string;
  budget_from: string;
  budget_to: string;
  status: string;
  created_at: string;
}

// Attached to admin_direct notifications about a proposal's status change —
// carries just enough to show what was proposed and where it now stands.
export interface INotificationProposalRef {
  description: string;
  status: string;
}

export interface INotification {
  id: number;
  guid: string;
  type: ENotificationType | string;
  title: string;
  body: string;
  category: INotificationCategoryRef | null;
  application: INotificationApplicationRef | null;
  proposal: INotificationProposalRef | null;
  is_read: boolean;
  created_at: string;
}

// GET /notification/detail/{guid}/ — admin messages carry the targeted roles
// instead of a category/application reference.
export interface INotificationDetail {
  id: number;
  guid: string;
  type: ENotificationType | string;
  title: string;
  body: string;
  role?: INotificationRoleRef[] | null;
  proposal?: INotificationProposalRef | null;
  is_active: boolean;
  created_at: string;
}

export interface IDeviceTokenRegisterRequest {
  token: string;
  platform: "web" | "android" | "ios";
}
