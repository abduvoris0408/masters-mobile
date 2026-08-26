import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores";
import { EUserType } from "@/types";
import type {
  IAuthUser,
  IForgotPasswordRequest,
  ILoginRequest,
  IMeProfileResponse,
  IOtpVerifyRequest,
  IPhoneAuthRequest,
  IPhoneAuthResponse,
  IRegisterRequest,
  IRegisterResponse,
  IResendOtpRequest,
  IResetPasswordRequest,
  ITokenPair,
  ITokens,
} from "@/types";
import { useMutation } from "@tanstack/react-query";

// Ported unchanged from the web project's services/auth/auth.mutation.ts —
// same session-building logic (login/register/OTP all converge on
// buildSessionFromTokens, which fetches /profile/me-profile/ to derive the
// IAuthUser since the token endpoints only return the JWT pair).
function buildAuthUser(profile: IMeProfileResponse): IAuthUser {
  const u = profile.master_profile ? profile.user : profile;
  return {
    id: u.id,
    guid: u.guid,
    first_name: u.name ?? "",
    last_name: u.surname ?? "",
    middle_name: u.middle_name ?? undefined,
    phone: u.phone,
    avatar: u.photo ?? undefined,
    user_type: profile.master_profile ? EUserType.WORKER : EUserType.CLIENT,
    is_verified: true,
  };
}

async function buildSessionFromTokens(tokens: ITokens): Promise<IAuthUser> {
  useAuthStore.getState().setToken(tokens);
  const profile = await axiosInstance
    .get<IMeProfileResponse>(ENDPOINTS.MASTER_PROFILE.ME)
    .then((r) => r.data);
  return buildAuthUser(profile);
}

export async function loginAndBuildSession(data: ILoginRequest): Promise<{
  user: IAuthUser;
  tokens: ITokens;
}> {
  const { access, refresh } = await axiosInstance
    .post<ITokenPair>(ENDPOINTS.AUTH.LOGIN, data, { silentError: true })
    .then((r) => r.data);
  const tokens: ITokens = { access_token: access, refresh_token: refresh };
  const user = await buildSessionFromTokens(tokens);
  return { user, tokens };
}

export const useLoginMutation = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: loginAndBuildSession,
    onSuccess: ({ user, tokens }) => setAuth(user, tokens),
  });
};

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: (data: IRegisterRequest): Promise<IRegisterResponse> =>
      axiosInstance.post(ENDPOINTS.AUTH.REGISTER, data).then((r) => r.data),
  });

// TEMP (testing only), same as web: register-simple skips SMS OTP and logs
// the user in directly. Keep alongside useRegisterMutation — flip
// USE_SIMPLE_REGISTER in app/(auth)/register.tsx when the real OTP flow is
// ready, don't delete either path.
export async function registerSimpleAndBuildSession(data: IRegisterRequest): Promise<{
  user: IAuthUser;
  tokens: ITokens;
}> {
  const { access, refresh } = await axiosInstance
    .post<ITokenPair>(ENDPOINTS.AUTH.REGISTER_SIMPLE, data)
    .then((r) => r.data);
  const tokens: ITokens = { access_token: access, refresh_token: refresh };
  const user = await buildSessionFromTokens(tokens);
  return { user, tokens };
}

export const useRegisterSimpleMutation = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: registerSimpleAndBuildSession,
    onSuccess: ({ user, tokens }) => setAuth(user, tokens),
  });
};

export async function phoneAuthAndAuthorize(data: IPhoneAuthRequest): Promise<void> {
  const { access, refresh } = await axiosInstance
    .post<IPhoneAuthResponse>(ENDPOINTS.AUTH.PHONE_AUTH, data)
    .then((r) => r.data);
  useAuthStore.getState().setToken({ access_token: access, refresh_token: refresh });
}

export const usePhoneAuthMutation = () =>
  useMutation({
    mutationFn: phoneAuthAndAuthorize,
  });

export const useLogoutMutation = () => {
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await axiosInstance
          .post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken })
          .catch(() => undefined);
      }
    },
    onSettled: () => logout(),
  });
};

export async function verifyOtpAndBuildSession(data: IOtpVerifyRequest): Promise<{
  user: IAuthUser;
  tokens: ITokens;
}> {
  const { access, refresh } = await axiosInstance
    .post<ITokenPair>(ENDPOINTS.AUTH.OTP_VERIFY, data)
    .then((r) => r.data);
  const tokens: ITokens = { access_token: access, refresh_token: refresh };
  const user = await buildSessionFromTokens(tokens);
  return { user, tokens };
}

export const useOtpVerifyMutation = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: verifyOtpAndBuildSession,
    onSuccess: ({ user, tokens }) => setAuth(user, tokens),
  });
};

export const useResendOtpMutation = () =>
  useMutation({
    mutationFn: (data: IResendOtpRequest) =>
      axiosInstance.post(ENDPOINTS.AUTH.OTP_RESEND, data).then((r) => r.data),
  });

export const useForgotPasswordMutation = () =>
  useMutation({
    mutationFn: (data: IForgotPasswordRequest) =>
      axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data).then((r) => r.data),
  });

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: (data: IResetPasswordRequest) =>
      axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, data).then((r) => r.data),
  });
