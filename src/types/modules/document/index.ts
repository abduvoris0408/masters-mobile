// Distinguishes which of the two parallel document APIs a call targets —
// /profile-document/* for individual masters, /organization-document/* for
// organizations. Same shape on both sides, only the base path differs.
export type TDocumentOwnerKind = "profile" | "organization";

// A single certificate/license attached to a profile or organization.
// `file` is the served URL on read.
export interface IDocument {
  id: number;
  guid: string;
  title: string;
  file: string;
  issued_by: string;
  issued_at: string;
  created_at?: string;
}

// Create sends multipart form-data (carries a raw file), handled in the
// mutation rather than serialised as JSON.
export interface IDocumentCreateRequest {
  title: string;
  file: File;
  issued_by: string;
  issued_at: string;
}

// Update (PATCH) — `file` is omitted entirely when unchanged, so the backend
// keeps the existing one, same convention as the organization logo update.
export interface IDocumentUpdateRequest {
  title?: string;
  file?: File;
  issued_by?: string;
  issued_at?: string;
}
