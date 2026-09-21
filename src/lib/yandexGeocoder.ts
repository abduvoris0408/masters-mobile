// RN port of the web project's src/lib/yandexMaps.ts geocoding helpers.
// react-native-maps renders Google/Apple tiles (Yandex tiles aren't
// officially supported there), but the Yandex Geocoder is a plain REST
// endpoint with no DOM/`window` dependency — reused as-is so addresses
// stay worded exactly like the web app's ("Andijon viloyati", not
// "Андижанская область").

// Tashkent — used as the map's initial region before any point is known.
export const DEFAULT_MAP_CENTER = { lat: 41.311081, lng: 69.240562 };

const GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/";

async function geocodeRequest(geocode: string): Promise<any | null> {
  const apiKey = process.env.EXPO_PUBLIC_YANDEX_GEOCODER_API_KEY;
  try {
    // uz_UZ makes the Geocoder respond in Uzbek-Latin ("Andijon viloyati")
    // instead of its Russian default ("Андижанская область"), matching the
    // backend's region/district naming.
    const url = `${GEOCODER_URL}?apikey=${apiKey ?? ""}&format=json&results=1&lang=uz_UZ&geocode=${encodeURIComponent(geocode)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoder responded with ${res.status}`);
    const data = await res.json();
    return data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject ?? null;
  } catch (err) {
    // Swallowed on purpose (the address field just stays whatever it was),
    // but logged — a failed geocode (bad/unscoped key, quota, network)
    // otherwise looks identical to "nothing was picked".
    console.error("[yandexGeocoder] geocode request failed", err);
    return null;
  }
}

export interface GeocodedAddress {
  address: string;
  /** Region/province name, e.g. "Toshkent shahri" — from the Geocoder's AdministrativeArea. */
  regionName?: string;
  /** District name, e.g. "Chilonzor tumani" — from the Geocoder's SubAdministrativeArea. */
  districtName?: string;
}

function toGeocodedAddress(geoObject: any): GeocodedAddress {
  const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
  const adminArea = meta?.AddressDetails?.Country?.AdministrativeArea;
  // District-equivalent name shows up in different spots depending on the
  // region: a regular viloyat nests it under SubAdministrativeArea (e.g.
  // "Andijon viloyati" -> SubAdministrativeArea "Andijon"), while Tashkent
  // city has no SubAdministrativeArea at all — its ichki tuman ("Chilonzor
  // tumani") comes through AdministrativeArea.Locality.DependentLocality
  // instead.
  const districtName =
    adminArea?.SubAdministrativeArea?.SubAdministrativeAreaName ??
    adminArea?.Locality?.DependentLocality?.DependentLocalityName;
  return {
    address: meta?.text ?? "",
    regionName: adminArea?.AdministrativeAreaName,
    districtName,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  // The HTTP Geocoder takes reverse lookups as "longitude,latitude".
  const geoObject = await geocodeRequest(`${lng},${lat}`);
  return geoObject ? toGeocodedAddress(geoObject) : null;
}

export async function forwardGeocode(
  query: string,
): Promise<({ lat: number; lng: number } & GeocodedAddress) | null> {
  const geoObject = await geocodeRequest(query);
  if (!geoObject) return null;
  // Point.pos comes back as "longitude latitude" — flip it to our lat/lng convention.
  const [lng, lat] = (geoObject.Point.pos as string).split(" ").map(Number);
  const resolved = toGeocodedAddress(geoObject);
  return { lat, lng, ...resolved, address: resolved.address || query };
}
