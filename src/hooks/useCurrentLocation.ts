import * as Location from "expo-location";
import { useCallback, useState } from "react";

export type TGeoStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

export interface IGeoCoords {
  lat: number;
  lng: number;
}

// Device location on demand: `locate()` asks for the foreground permission
// (the OS prompt only shows the first time) and then reads the position.
// Mobile counterpart of the web project's useGeolocation hook.
export function useCurrentLocation() {
  const [status, setStatus] = useState<TGeoStatus>("idle");
  const [coords, setCoords] = useState<IGeoCoords | null>(null);

  const locate = useCallback(async () => {
    setStatus("locating");
    try {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      // Last known fix first — instant on most phones; a fresh read only
      // when there isn't one (or it's older than 5 minutes).
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      // 6 decimals (~10 cm) is plenty and keeps query keys stable across
      // tiny GPS jitter between refreshes.
      setCoords({ lat: +position.coords.latitude.toFixed(6), lng: +position.coords.longitude.toFixed(6) });
      setStatus("ready");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  return { status, coords, locate };
}
