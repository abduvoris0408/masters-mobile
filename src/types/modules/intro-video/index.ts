// Distinguishes which of the two parallel intro-video APIs a call targets —
// /profile-intro-video/* for individual masters, /organization-intro-video/*
// for organizations. Same shape on both sides, only the base path and the
// owner FK field name differ.
export type TIntroVideoOwnerKind = "profile" | "organization";

// A single intro video attached to a profile or organization. `video` is the
// served URL on read.
export interface IIntroVideo {
  id: number;
  guid: string;
  video: string;
  created_at?: string;
}

// Create sends multipart form-data (carries a raw file). Unlike documents,
// this API requires the owner's numeric id explicitly in the body rather
// than inferring it from the authenticated user.
export interface IIntroVideoCreateRequest {
  ownerId: number;
  video: File;
}

// Update (PATCH) only ever replaces the file — the owner FK doesn't change.
export interface IIntroVideoUpdateRequest {
  video: File;
}
