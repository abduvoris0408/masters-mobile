import type { IAuthUser } from "../modules/auth";
import type { ITokens } from "../general";

export interface IAuthStore {
  user: IAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuth: boolean | null;
  isInitiated: boolean;
  setAuth: (user: IAuthUser, tokens: ITokens) => void;
  setToken: (tokens: ITokens) => void;
  setUser: (user?: IAuthUser) => void;
  setIsAuth: (v: boolean) => void;
  setIsInitiated: (v: boolean) => void;
  logout: () => void;
}
