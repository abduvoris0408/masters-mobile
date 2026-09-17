import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDocument, TDocumentOwnerKind } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DOCUMENT_KEYS } from "./document.query";

const ENDPOINTS_BY_KIND = {
  profile: ENDPOINTS.PROFILE_DOCUMENT,
  organization: ENDPOINTS.ORGANIZATION_DOCUMENT,
} satisfies Record<TDocumentOwnerKind, unknown>;

// RN's expo-document-picker asset comes back as a local `{ uri, mimeType,
// name }` triple, same FormData-friendly shape used across the app's other
// file uploads (no File/Blob-backed <input type=file> on this platform).
export interface IPickedDocumentFile {
  uri: string;
  mimeType?: string | null;
  name: string;
}

const FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

export const useCreateDocumentMutation = (kind: TDocumentOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      file: IPickedDocumentFile;
      issued_by: string;
      issued_at: string;
    }): Promise<IDocument> => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("issued_by", data.issued_by);
      formData.append("issued_at", data.issued_at);
      formData.append("file", {
        uri: data.file.uri,
        type: data.file.mimeType || "application/octet-stream",
        name: data.file.name,
      } as unknown as Blob);
      return axiosInstance.post(ENDPOINTS_BY_KIND[kind].CREATE, formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCUMENT_KEYS.list(kind, ownerGuid) }),
  });
};

export const useUpdateDocumentMutation = (kind: TDocumentOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      guid,
      title,
      issuedBy,
      issuedAt,
      file,
    }: {
      guid: string;
      title?: string;
      issuedBy?: string;
      issuedAt?: string;
      file?: IPickedDocumentFile;
    }): Promise<IDocument> => {
      const formData = new FormData();
      if (title !== undefined) formData.append("title", title);
      if (issuedBy !== undefined) formData.append("issued_by", issuedBy);
      if (issuedAt !== undefined) formData.append("issued_at", issuedAt);
      // Omitted entirely when unchanged — the backend keeps the existing file.
      if (file) {
        formData.append("file", {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        } as unknown as Blob);
      }
      return axiosInstance.patch(ENDPOINTS_BY_KIND[kind].UPDATE(guid), formData, FORM_DATA_CONFIG).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCUMENT_KEYS.list(kind, ownerGuid) }),
  });
};

export const useDeleteDocumentMutation = (kind: TDocumentOwnerKind, ownerGuid: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> =>
      axiosInstance.delete(ENDPOINTS_BY_KIND[kind].DELETE(guid)).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCUMENT_KEYS.list(kind, ownerGuid) }),
  });
};
