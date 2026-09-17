import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import type {
  IApplication,
  IApplicationImage,
  IApplicationOffer,
  ICreateApplicationRequest,
  ICreateOfferRequest,
  ICreateOrderRequest,
  IMyOffer,
  IOfferAcceptResponse,
  IOrderDirectCreateResponse,
  IUpdateApplicationRequest,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// RN has no File/Blob-backed <input type=file> — a picked image comes back
// from expo-image-picker as a local `{ uri, type, name }` triple instead,
// which is what FormData expects on this platform (unlike web's raw File).
export interface IPickedImageAsset {
  uri: string;
  type?: string | null;
  name?: string | null;
}

// No cache to invalidate — the image isn't attached to a listing yet, it's
// just sitting on the server waiting for create/update to reference its id.
const IMAGE_FORM_DATA_CONFIG = { headers: { "Content-Type": "multipart/form-data" } };

export const useUploadApplicationImageMutation = () => {
  return useMutation({
    mutationFn: (asset: IPickedImageAsset): Promise<IApplicationImage> => {
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.name || "photo.jpg",
      } as unknown as Blob);
      return axiosInstance.post(ENDPOINTS.APPLICATION.IMAGE_CREATE, formData, IMAGE_FORM_DATA_CONFIG).then((r) => r.data);
    },
  });
};

export const useCreateApplicationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateApplicationRequest): Promise<IApplication> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.CREATE, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "list"] });
      qc.invalidateQueries({ queryKey: ["application", "my-list"] });
    },
  });
};

// Edit a listing (PATCH — only changed fields) or cancel it by patching
// `{ status: "cancelled" }`. Same endpoint serves both.
export const useUpdateApplicationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: IUpdateApplicationRequest }): Promise<IApplication> =>
      axiosInstance.patch(ENDPOINTS.APPLICATION.UPDATE(guid), data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "list"] });
      qc.invalidateQueries({ queryKey: ["application", "my-list"] });
      qc.invalidateQueries({ queryKey: ["application", "detail"], exact: false });
      qc.invalidateQueries({ queryKey: ["application", "detail-public"], exact: false });
    },
  });
};

export const useCreateOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateOfferRequest): Promise<IApplicationOffer> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.OFFER_CREATE, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "list"] });
      qc.invalidateQueries({ queryKey: ["application", "detail"], exact: false });
      qc.invalidateQueries({ queryKey: ["application", "offer", "my-list"] });
    },
  });
};

// Master edits the price of an offer they've already sent (only makes sense
// while it's still `pending`).
export const useUpdateOfferPriceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guid, price }: { guid: string; price: number }): Promise<IMyOffer> =>
      axiosInstance.patch(ENDPOINTS.APPLICATION.OFFER_PRICE_UPDATE(guid), { price }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "offer", "my-list"] });
      qc.invalidateQueries({ queryKey: ["application", "detail"], exact: false });
    },
  });
};

export const useAcceptOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerGuid: string): Promise<IOfferAcceptResponse> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.OFFER_ACCEPT(offerGuid)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "detail"], exact: false });
      qc.invalidateQueries({ queryKey: ["application", "my-list"] });
    },
  });
};

// Customer orders a master's priced service directly (no listing/offer
// involved) — the "Buyurtma berish" flow on the master detail screen. The
// order (and its own contract, auto-accepted on the customer's side) is
// created immediately; the master still has to accept it via
// useMasterAcceptContractMutation.
export const useCreateOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateOrderRequest): Promise<IOrderDirectCreateResponse> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.ORDER_CREATE, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "order", "my-master-list"] });
    },
  });
};

// Customer reviews and accepts the finished work — moves the order to its
// final `completed` state.
export const useCustomerCompleteOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.ORDER_CUSTOMER_COMPLETE(guid)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "order", "my-list"] });
      qc.invalidateQueries({ queryKey: ["application", "order", "my-master-list"] });
    },
  });
};

// Master marks the order's work as finished — moves it to the
// customer-confirmation stage (`awaiting_confirmation`).
export const useMasterFinishOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guid: string): Promise<void> =>
      axiosInstance.post(ENDPOINTS.APPLICATION.ORDER_MASTER_FINISH(guid)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", "order", "my-list"] });
      qc.invalidateQueries({ queryKey: ["application", "order", "my-master-list"] });
    },
  });
};
