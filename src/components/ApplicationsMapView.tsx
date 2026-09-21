import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
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
}

// "Xaritada ko'rish" mode for the Elonlar feed — one marker per listing that
// has coordinates, tap a marker to preview it in a small card docked at the
// bottom (tap the card to open the full detail screen, same destination as
// the list/grid cards' onPress).
export function ApplicationsMapView({ items, onSelect }: ApplicationsMapViewProps) {
  const colors = useThemeColors();
  const [selected, setSelected] = useState<IApplication | null>(null);

  const pins = useMemo(
    () => items.filter((item) => item.latitude != null && item.longitude != null),
    [items],
  );

  if (!mapsModule) {
    return (
      <EmptyState
        icon="map-outline"
        title="Xarita mavjud emas"
        description="Interaktiv xarita ushbu ilova versiyasida ishlamaydi"
      />
    );
  }

  if (pins.length === 0) {
    return <EmptyState icon="location-outline" title="Manzili ko'rsatilgan elonlar yo'q" />;
  }

  const initialRegion = {
    latitude: Number(pins[0].latitude),
    longitude: Number(pins[0].longitude),
    latitudeDelta: 0.3,
    longitudeDelta: 0.3,
  };

  return (
    <View style={{ flex: 1 }}>
      <mapsModule.default
        style={StyleSheet.absoluteFill}
        initialRegion={pins.length > 0 ? initialRegion : { ...DEFAULT_MAP_CENTER, latitude: DEFAULT_MAP_CENTER.lat, longitude: DEFAULT_MAP_CENTER.lng, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
      >
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
            <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={1}>
              {selected.title}
            </Text>
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
