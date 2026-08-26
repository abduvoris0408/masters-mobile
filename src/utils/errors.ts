import { isAxiosError } from "axios";

type FieldErrors = Record<string, string[] | string | undefined>;

// Pulls the first human-readable message out of a DRF-style validation
// response ({ field: ["message"] }) so it can be surfaced to the user;
// returns `fallback` for network errors or any non-field-shaped payload.
export const extractFirstFieldError = (error: unknown, fallback: string): string => {
  if (isAxiosError<FieldErrors>(error) && error.response?.data) {
    const first = Object.values(error.response.data).flat()[0];
    if (typeof first === "string" && first) return first;
  }
  return fallback;
};
