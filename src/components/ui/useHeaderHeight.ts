import { useSafeAreaInsets } from "react-native-safe-area-context";

// Header.tsx's rendered height: safe-area top inset + 10 top padding + 44px
// icon-row content (HeaderIconButton is h-11) + 12 bottom padding. Screens
// that put the floating Header over a ScrollView/FlatList use this as the
// list's top padding/inset so content starts below the glass instead of
// hiding under it.
export function useHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + 10 + 44 + 12;
}
