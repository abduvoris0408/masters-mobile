import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  IOrganization,
  IOrganizationMemberRegisterRequest,
  IOrganizationMemberServiceUpdateRequest,
  IOrganizationRequest,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ORGANIZATION_KEYS } from "./organization.query";

// RN has no File/Blob-backed <input type=file> — a picked logo comes back
// from expo-image-picker as a local `{ uri, mimeType, name }` triple, same
// shape used across the app's other file uploads.
export interface IPickedLogoFile {
  uri: string;
  mimeType?: string | null;
  name: string;
}

const FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

function buildFormData(data: IOrganizationRequest, logo?: IPickedLogoFile | null): FormData {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("legal_form", data.legal_form);
  if (data.description) formData.append("description", data.description);
  // Omitted when unchanged (editing without picking a new file) — the
  // backend keeps the existing logo if the field isn't present at all.
  if (logo) {
    formData.append("logo", {
      uri: logo.uri,
      type: logo.mimeType || "image/jpeg",
      name: logo.name,
    } as unknown as Blob);
  }
  formData.append("stir", data.stir);
  formData.append("registered_at", data.registered_at);
  formData.append("legal_address", data.legal_address);
  formData.append("director_full_name", data.director_full_name);
  formData.append("director_phone", data.director_phone);
  formData.append("country", String(data.country));
  formData.append("operates_regions", String(data.operates_regions));
  data.regions.forEach((id) => formData.append("regions", String(id)));
  formData.append("operates_districts", String(data.operates_districts));
  data.districts.forEach((id) => formData.append("districts", String(id)));
  data.categories.forEach((id) => formData.append("categories", String(id)));
  return formData;
}

export const useCreateOrganizationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: IOrganizationRequest; logo?: IPickedLogoFile | null }): Promise<IOrganization> =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION.CREATE, buildFormData(data, logo), FORM_DATA_CONFIG).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.me }),
  });
};

export const useUpdateOrganizationMutation = (guid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, logo }: { data: IOrganizationRequest; logo?: IPickedLogoFile | null }): Promise<IOrganization> =>
      axiosInstance.put(ENDPOINTS.ORGANIZATION.UPDATE(guid), buildFormData(data, logo), FORM_DATA_CONFIG).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.detail(guid) });
      qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.me });
    },
  });
};

// Org owner enrolls a not-yet-registered master directly — the new account
// then shows up in the master catalog filtered by `?organization=<guid>`.
export const useRegisterOrganizationMemberMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IOrganizationMemberRegisterRequest) =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION.MEMBER_REGISTER, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master", "catalog"] }),
  });
};

// Org owner kicks a member out (also usable by the member themself to leave).
// Takes the member's own profile guid.
export const useRemoveOrganizationMemberMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileGuid: string) =>
      axiosInstance.post(ENDPOINTS.ORGANIZATION.MEMBER_LEAVE(profileGuid)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.members });
      qc.invalidateQueries({ queryKey: ["master", "catalog"] });
    },
  });
};

// Org owner edits one member's service price/publish flag. `serviceGuid` is
// the service's own guid (from IOrganizationMemberDetail.services), not the
// member's guid — the member's guid is only used to invalidate its detail
// query afterwards.
export const useUpdateOrganizationMemberServiceMutation = (memberGuid: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceGuid, data }: { serviceGuid: string; data: IOrganizationMemberServiceUpdateRequest }) =>
      axiosInstance.put(ENDPOINTS.ORGANIZATION.MEMBER_SERVICE_UPDATE(serviceGuid), data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.memberDetail(memberGuid) });
      qc.invalidateQueries({ queryKey: ORGANIZATION_KEYS.members });
    },
  });
};
