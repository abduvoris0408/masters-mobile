import { useHeaderHeight as useNativeHeaderHeight } from "expo-router/react-navigation";
import { Platform } from "react-native";

// How far a screen's content must be pushed down to start below the native
// header. iOS draws the header transparent over the content (see
// useNativeHeaderOptions), so this is the real measured header height
// (status bar included). Android's header is opaque and already lays the
// content out below itself, so nothing extra is needed there.
export function useHeaderHeight(): number {
  const height = useNativeHeaderHeight();
  return Platform.OS === "ios" ? height : 0;
}
