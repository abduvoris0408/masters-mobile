import { Platform } from "react-native";

import { ENDPOINTS } from "@/constants";
import { axiosInstance } from "@/lib/axios";

interface IDeviceTokenRegisterRequest {
  token: string;
  platform: "android" | "ios";
}

// Fire-and-forget, same as the web project's registerDeviceTokenSilently —
// a failed registration shouldn't surface as an error toast anywhere in the
// app, it just means this device won't get push until the next successful
// retry (next app open / token refresh).
export async function registerDeviceToken(token: string): Promise<void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return;
  const data: IDeviceTokenRegisterRequest = { token, platform: Platform.OS };
  try {
    await axiosInstance.post(ENDPOINTS.DEVICE_TOKEN.REGISTER, data, { silentError: true });
  } catch {
    // swallow — see comment above
  }
}
