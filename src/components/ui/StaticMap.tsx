import { Image, Pressable, type ImageStyle, type StyleProp } from "react-native";
import * as Linking from "expo-linking";

interface StaticMapProps {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
  style?: StyleProp<ImageStyle>;
  /** Tapping opens the point in a real map app — a static image can't pan/zoom itself. */
  openOnPress?: boolean;
}

// Yandex Static Maps is a plain REST/image endpoint (unlike the JS Maps SDK
// the web project uses, which needs a DOM/`window.ymaps` and can't run in
// RN) — one GET request returns a ready-made PNG with a pin, no map-view
// native module or WebView required. Good enough for the read-only "here's
// where this listing/master is" displays; picking a NEW point still needs a
// real interactive map solution (not built here).
export function buildStaticMapUrl(lat: number, lng: number, opts?: { width?: number; height?: number; zoom?: number }): string {
  const apiKey = process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY;
  const width = opts?.width ?? 600;
  const height = opts?.height ?? 300;
  const zoom = opts?.zoom ?? 15;
  const params = new URLSearchParams({
    ll: `${lng},${lat}`,
    z: String(zoom),
    size: `${Math.min(width, 650)},${Math.min(height, 450)}`,
    l: "map",
    pt: `${lng},${lat},pm2gnm`,
  });
  if (apiKey) params.set("apikey", apiKey);
  return `https://static-maps.yandex.ru/1.x/?${params.toString()}`;
}

export function StaticMap({ lat, lng, height = 180, zoom = 15, style, openOnPress = true }: StaticMapProps) {
  const url = buildStaticMapUrl(lat, lng, { height: height * 2, zoom });

  const content = (
    <Image source={{ uri: url }} style={[{ width: "100%", height, borderRadius: 20 }, style]} resizeMode="cover" />
  );

  if (!openOnPress) return content;

  return (
    <Pressable onPress={() => Linking.openURL(`https://yandex.com/maps/?pt=${lng},${lat}&z=${zoom}&l=map`)}>
      {content}
    </Pressable>
  );
}
