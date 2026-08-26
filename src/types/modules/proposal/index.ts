// A direct proposal ("taklif") a client sends to a master. `user` is the real
// user pk of the master receiving it (catalog's `user_id`, not the profile row).
export interface ICreateProposalRequest {
  user: number;
  description: string;
}

export interface IProposal {
  id: number;
  guid: string;
  user: number;
  description: string;
  status: string;
  created_at: string;
}
