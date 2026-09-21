import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import type RNMapView from "react-native-maps";
import type { LatLng, MapPressEvent, Region } from "react-native-maps";

import { useThemeColors } from "@/lib/theme/colors";
import { DEFAULT_MAP_CENTER, forwardGeocode, reverseGeocode, type GeocodedAddress } from "@/lib/yandexGeocoder";

// react-native-maps is a native module — it isn't bundled inside Expo Go, so
// a static top-level import throws at module load (same issue as
// @react-native-community/datetimepicker, see ApplicationWizard.tsx). Loaded
// lazily and guarded so Expo Go falls back to a search-only picker below,
// while a dev-client/production build gets the real interactive map.
type ReactNativeMapsModule = typeof import("react-native-maps");
let mapsModule: ReactNativeMapsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapsModule = require("react-native-maps");
} catch {
  mapsModule = null;
}

// The backend's latitude/longitude fields allow at most 9 digits total
// (~6 decimal places, ~11cm precision) — device/geocoder coordinates come
// back with far more, so every value handed to onChange is rounded here.
// Mirrors the web project's MapLocationPicker.tsx round6().
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

interface Coords {
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  value?: Coords | null;
  onChange: (coords: Coords) => void;
  /** Fired with the resolved address (plus region/district name, when the
   *  Geocoder returns them) whenever the pin moves (tap, drag, search,
   *  "use my location") — wire this to the address text field (and
   *  optionally region/district selects) to keep them in sync. Mirrors the
   *  web project's MapLocationPicker onAddressResolved prop. */
  onAddressResolved?: (info: GeocodedAddress) => void;
  height?: number;
}

// RN port of the web project's MapLocationPicker.tsx: tap the map, drag the
// pin, search an address, or use the device's location — all four converge
// on the same onChange(coords) + onAddressResolved(address) callbacks. Uses
// react-native-maps (Google Maps on Android, Apple Maps on iOS) for the tile
// layer — Yandex's JS SDK is web-only — but keeps the same Yandex Geocoder
// REST calls for search/reverse-geocode, so resolved address text matches
// the web app's wording exactly.
export function MapLocationPicker({ value, onChange, onAddressResolved, height = 260 }: MapLocationPickerProps) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");
  const mapRef = useRef<RNMapView>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const initialRegion: Region = {
    latitude: value?.lat ?? DEFAULT_MAP_CENTER.lat,
    longitude: value?.lng ?? DEFAULT_MAP_CENTER.lng,
    latitudeDelta: value ? 0.05 : 0.5,
    longitudeDelta: value ? 0.05 : 0.5,
  };

  const handlePicked = async (coords: Coords, animate = true) => {
    onChange({ lat: round6(coords.lat), lng: round6(coords.lng) });
    if (animate) mapRef.current?.animateToRegion({ ...coords, latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 } as unknown as Region, 300);
    if (!onAddressResolved) return;
    const resolved = await reverseGeocode(coords.lat, coords.lng);
    if (resolved?.address) onAddressResolved(resolved);
  };

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    handlePicked({ lat: latitude, lng: longitude }, false);
  };

  const onMarkerDragEnd = (e: { nativeEvent: { coordinate: LatLng } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    handlePicked({ lat: latitude, lng: longitude }, false);
  };

  const handleSearch = async () => {
    const query = searchValue.trim();
    if (!query) return;
    setSearching(true);
    const result = await forwardGeocode(query);
    setSearching(false);
    if (!result) return;
    handlePicked({ lat: result.lat, lng: result.lng });
    onAddressResolved?.(result);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      handlePicked({ lat: position.coords.latitude, lng: position.coords.longitude });
    } finally {
      setLocating(false);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{t("map_pick_location")}</Text>

      <View className="flex-row gap-2">
        <View className="h-11 flex-1 flex-row items-center rounded-2xl bg-surface px-3.5">
          <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
          <TextInput
            className="flex-1"
            style={{ fontSize: 14, color: colors.foreground }}
            value={searchValue}
            onChangeText={setSearchValue}
            onSubmitEditing={handleSearch}
            placeholder={t("map_search_address_placeholder")}
            placeholderTextColor={colors.muted}
            returnKeyType="search"
          />
        </View>
        <Pressable
          onPress={handleSearch}
          disabled={searching}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-surface"
        >
          {searching ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name="search" size={18} color={colors.accent} />}
        </Pressable>
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={locating}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-surface"
        >
          {locating ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name="locate" size={18} color={colors.accent} />}
        </Pressable>
      </View>

      {mapsModule ? (
        <>
          <View style={{ height, borderRadius: 20, overflow: "hidden" }}>
            <mapsModule.default
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={initialRegion}
              onPress={onMapPress}
              provider={Platform.OS === "android" ? "google" : undefined}
            >
              {value ? (
                <mapsModule.Marker
                  coordinate={{ latitude: value.lat, longitude: value.lng }}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                  pinColor={colors.accent}
                />
              ) : null}
            </mapsModule.default>
          </View>
          <Text className="text-xs text-muted">{t("map_tap_or_drag_hint")}</Text>
        </>
      ) : (
        <View className="items-center gap-2 rounded-2xl bg-surface px-4 py-6">
          <Ionicons name="map-outline" size={22} color={colors.muted} />
          <Text className="text-center text-xs text-muted">{t("map_interactive_unavailable")}</Text>
        </View>
      )}
    </View>
  );
}
