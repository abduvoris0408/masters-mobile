import * as Linking from "expo-linking";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { StaticMap } from "./StaticMap";

// react-native-maps is a native module — it isn't bundled inside Expo Go, so
// a static top-level import throws at module load (same guard pattern as
// MapLocationPicker.tsx / ApplicationWizard.tsx's DatePickerField). Falls
// back to the existing StaticMap image when the module isn't there.
type ReactNativeMapsModule = typeof import("react-native-maps");
let mapsModule: ReactNativeMapsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mapsModule = require("react-native-maps");
} catch {
  mapsModule = null;
}

interface LocationMapProps {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
  style?: StyleProp<ViewStyle>;
}

// Read-only "here's where this listing/master is" map — pannable/zoomable
// but the pin can't be moved (unlike MapLocationPicker, which is for
// picking a new point). Tapping it opens the point in a real map app, same
// as StaticMap's openOnPress behavior.
export function LocationMap({ lat, lng, height = 180, zoom = 15, style }: LocationMapProps) {
  if (!mapsModule) {
    return <StaticMap lat={lat} lng={lng} height={height} zoom={zoom} />;
  }

  return (
    <Pressable
      onPress={() => Linking.openURL(`https://yandex.com/maps/?pt=${lng},${lat}&z=${zoom}&l=map`)}
      style={[{ height, borderRadius: 20, overflow: "hidden" }, style]}
    >
      <mapsModule.default
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <mapsModule.Marker coordinate={{ latitude: lat, longitude: lng }} />
      </mapsModule.default>
    </Pressable>
  );
}
