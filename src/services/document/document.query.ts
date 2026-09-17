import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type { IDjangoPaginated, IDocument, TDocumentOwnerKind } from "@/types";
import { useQuery } from "@tanstack/react-query";

export const DOCUMENT_KEYS = {
  list: (kind: TDocumentOwnerKind, ownerGuid: string | null) => ["document", "list", kind, ownerGuid],
};

// Read-only for now — same follow-up note as portfolio.query.ts: create/
// update/delete needs a file-picker + multipart form, left for later.
export const useDocumentListQuery = (kind: TDocumentOwnerKind, ownerGuid: string | null) =>
  useQuery({
    queryKey: DOCUMENT_KEYS.list(kind, ownerGuid),
    queryFn: (): Promise<IDocument[]> => {
      const url =
        kind === "profile"
          ? ENDPOINTS.PROFILE_DOCUMENT.LIST(ownerGuid as string)
          : ENDPOINTS.ORGANIZATION_DOCUMENT.LIST(ownerGuid as string);
      return axiosInstance
        .get<IDjangoPaginated<IDocument> | IDocument[]>(url, { params: { page_size: 100 } })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data.results));
    },
    enabled: !!ownerGuid,
  });
