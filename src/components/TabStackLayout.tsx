import { Stack } from "expo-router";

import { useNativeHeaderOptions } from "@/lib/navigation/useNativeHeaderOptions";

// Native tabs have no header of their own, so every tab group under
// app/(app)/(tabs) wraps its screen in this stack to get the same native
// header as the rest of the app.
export function TabStackLayout() {
  const headerOptions = useNativeHeaderOptions();
  return <Stack screenOptions={headerOptions} />;
}
