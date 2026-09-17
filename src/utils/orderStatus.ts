import type { TOrderStatus } from "@/types";

export const ORDER_STATUS_LABEL: Record<TOrderStatus, string> = {
  new: "Yangi",
  accepted: "Qabul qilindi",
  contract_signed: "Shartnoma imzolandi",
  in_progress: "Jarayonda",
  awaiting_confirmation: "Tasdiqlash kutilmoqda",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
};
