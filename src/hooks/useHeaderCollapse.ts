import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { useHeaderHeight } from "@/components/ui/useHeaderHeight";

// Drives <Header largeTitle collapsed>: false while the list sits at the
// top (title on the left of the bar, no background), true once it has been
// scrolled (title centered, blurred bar). Spread the result's scroll props
// onto the screen's main ScrollView/FlatList.
//
// With contentInsetAdjustmentBehavior="automatic" the resting contentOffset
// is minus the header height on iOS (the content inset under the
// transparent bar), and 0 on Android, where useHeaderHeight() is 0 too.
export function useHeaderCollapse(threshold = 6) {
  const headerHeight = useHeaderHeight();
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = e.nativeEvent.contentOffset.y + headerHeight > threshold;
      // Only re-render (and re-set the header options) when crossing the line.
      if (next !== collapsedRef.current) {
        collapsedRef.current = next;
        setCollapsed(next);
      }
    },
    [headerHeight, threshold],
  );

  return { collapsed, scrollProps: { onScroll, scrollEventThrottle: 16 } };
}
