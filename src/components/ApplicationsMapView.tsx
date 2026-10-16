import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import type { IGeoCoords } from "@/hooks/useCurrentLocation";
import { CardTitle } from "@/components/ui/Typography";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useThemeColors } from "@/lib/theme/colors";
import { DEFAULT_MAP_CENTER } from "@/lib/yandexGeocoder";
import type { IApplication } from "@/types";
import { formatPrice } from "@/utils/format";

// react-native-maps is a native module — it isn't bundled inside Expo Go, so
// a static top-level import throws at module load (same guard pattern as
// MapLocationPicker.tsx / LocationMap.tsx). Falls back to a plain message
// when the module isn't there instead of crashing the "Elonlar" tab.
type ReactNativeMapsModule = typeof import("react-native-maps");
let mapsModule: ReactNativeMapsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapsModule = require("react-native-maps");
} catch {
  mapsModule = null;
}

interface ApplicationsMapViewProps {
  items: IApplication[];
  onSelect: (item: IApplication) => void;
  // "Yaqinimda" mode: centers on the viewer and draws the search radius.
  userLocation?: IGeoCoords | null;
  radiusKm?: number;
}

// Region that fits a `radiusKm` circle around a point (1° latitude ≈ 111 km,
// plus some margin so the ring isn't flush with the map edges).
const regionAround = ({ lat, lng }: IGeoCoords, radiusKm: number) => {
  const delta = ((radiusKm * 2) / 111) * 1.3;
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
};

// "Xaritada ko'rish" mode for the Elonlar feed — one marker per listing that
// has coordinates, tap a marker to preview it in a small card docked at the
// bottom (tap the card to open the full detail screen, same destination as
// the list/grid cards' onPress).
export function ApplicationsMapView({ items, onSelect, userLocation, radiusKm }: ApplicationsMapViewProps) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const [selected, setSelected] = useState<IApplication | null>(null);
  const mapRef = useRef<InstanceType<ReactNativeMapsModule["default"]>>(null);

  const pins = useMemo(
    () => items.filter((item) => item.latitude != null && item.longitude != null),
    [items],
  );

  // Follow the "near me" circle as the radius or position changes — the map
  // only reads initialRegion once, on mount.
  useEffect(() => {
    if (userLocation && radiusKm) mapRef.current?.animateToRegion(regionAround(userLocation, radiusKm), 400);
  }, [userLocation, radiusKm]);

  if (!mapsModule) {
    return (
      <EmptyState
        icon="map-outline"
        title={t("map_unavailable_title")}
        description={t("map_unavailable_description")}
      />
    );
  }

  if (pins.length === 0 && !userLocation) {
    return <EmptyState icon="location-outline" title={t("map_no_located_listings")} />;
  }

  const initialRegion =
    userLocation && radiusKm
      ? regionAround(userLocation, radiusKm)
      : pins.length > 0
        ? {
            latitude: Number(pins[0].latitude),
            longitude: Number(pins[0].longitude),
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }
        : {
            latitude: DEFAULT_MAP_CENTER.lat,
            longitude: DEFAULT_MAP_CENTER.lng,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          };

  return (
    <View style={{ flex: 1 }}>
      <mapsModule.default
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
      >
        {userLocation && radiusKm ? (
          <mapsModule.Circle
            center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            radius={radiusKm * 1000}
            strokeWidth={1.5}
            strokeColor={colors.accent}
            fillColor={`${colors.accent}1A`}
          />
        ) : null}
        {pins.map((item) => (
          <mapsModule.Marker
            key={item.guid}
            coordinate={{ latitude: Number(item.latitude), longitude: Number(item.longitude) }}
            pinColor={item.is_urgent ? colors.danger : colors.accent}
            onPress={() => setSelected(item)}
          />
        ))}
      </mapsModule.default>

      {selected ? (
        <Pressable
          onPress={() => onSelect(selected)}
          className="absolute inset-x-4 flex-row items-center gap-3 rounded-2xl bg-surface p-3.5"
          style={{ bottom: 16, shadowColor: "#0F172A", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
        >
          <View className="flex-1 gap-1">
            <CardTitle numberOfLines={1}>{selected.title}</CardTitle>
            <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {selected.budget_from === selected.budget_to
                ? formatPrice(Number(selected.budget_from))
                : `${formatPrice(Number(selected.budget_from))} – ${formatPrice(Number(selected.budget_to))}`}
            </Text>
          </View>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-accent">
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
