import type { IBase, IWithId } from "@/types/general";
import type { EUserType } from "@/types/enums";

export interface IAuthUser extends IBase {
  guid?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone: string;
  avatar?: string;
  email?: string;
  user_type: EUserType;
  is_verified: boolean;
}

export interface ILoginRequest {
  phone: string;
  password: string;
}

export interface IRegisterRequest {
  phone: string;
  password: string;
  password2: string;
  name: string;
  surname: string;
  middle_name?: string;
  role: number[];
}

export interface IRoleUpdateRequest {
  role: number[];
}

export interface ITokenPair {
  access: string;
  refresh: string;
}

// phone-auth skips both SMS OTP and a user-chosen password — the backend
// generates the password itself, so it isn't sent in the request.
export interface IPhoneAuthRequest {
  phone: string;
  name: string;
  surname: string;
  middle_name?: string;
  role: number[];
}

// Same token pair as login/register-simple, plus the one-time generated
// password so it can be shown to the user once (they were never asked to
// choose one themselves).
export interface IPhoneAuthResponse extends ITokenPair {
  password?: string;
}

// Register no longer logs the user in directly — the backend sends a 6-digit
// OTP to the phone and returns a human-readable message we surface as a toast.
export interface IRegisterResponse {
  message?: string;
}

// Backend field is `code` (not `otp`); verify-otp is what actually returns the
// token pair and completes the signup.
export interface IOtpVerifyRequest {
  phone: string;
  code: string;
}

export interface IResendOtpRequest {
  phone: string;
}

export interface IForgotPasswordRequest {
  phone: string;
}

// reset-password takes the SMS `code` plus the new password twice (backend
// confirms they match), and finalizes the reset — no separate verify step.
export interface IResetPasswordRequest {
  phone: string;
  code: string;
  new_password: string;
  new_password2: string;
}

// `token` is opaque — it's only ever echoed back to TELEGRAM_LOGIN_STATUS,
// never parsed. `deep_link` already has the token baked in as ?start=.
export interface ITelegramLoginResponse {
  token: string;
  deep_link: string;
}

export type TTelegramLoginStatus = "pending" | "confirmed";

// Polled with the token from ITelegramLoginResponse. Only "confirmed" carries
// the token pair — while "pending", access/refresh/phone are absent.
export interface ITelegramLoginStatusResponse extends Partial<ITokenPair> {
  status: TTelegramLoginStatus;
  phone?: string;
}

// RN has no File/Blob-backed <input type=file> — a picked image comes back
// from expo-image-picker as a local `{ uri, type, name }` triple instead
// (see IPickedImageAsset in application.mutation.ts), unlike web's raw File.
export interface IUserPhotoUpdateRequest {
  photo?: { uri: string; type?: string | null; name?: string | null } | null;
  remove_photo?: boolean;
}

// PATCH /user/user-profile-update/ — a plain (non-master) user's own
// name/surname/middle_name, shown on the client profile edit screen.
export interface IUserProfileUpdateRequest {
  name: string;
  surname: string;
  middle_name?: string;
}
