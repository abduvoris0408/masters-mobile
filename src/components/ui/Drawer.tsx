import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Animated, Dimensions, Modal, Pressable, View } from "react-native";

interface DrawerProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  widthPercent?: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

// Generic left-side slide-in panel (Animated, no extra nav/drawer dependency)
// — the sidebar menu is the first consumer, but this stays content-agnostic
// so any future left-drawer use case reuses it instead of hand-rolling one.
export function Drawer({ visible, onClose, widthPercent = 0.8, children }: DrawerProps) {
  const width = SCREEN_WIDTH * widthPercent;
  const translateX = useRef(new Animated.Value(-width)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Keeps the Modal mounted through the close animation — Modal's own
  // `visible` prop unmounts instantly, which would cut the slide-out short.
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) setModalVisible(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -width,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && !visible) setModalVisible(false);
    });
  }, [visible, width, translateX, backdropOpacity]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 flex-row">
        {/* Colors set inline, not via className: RN's core Animated.View
            (unlike View/Text/Pressable) isn't one of NativeWind's
            auto-intercepted components, so utility classes silently no-op on
            it — confirmed via screenshot, the panel rendered with no
            background at all. Keep this hex in sync with tailwind.config.js's
            `sidebar` token. */}
        <Animated.View style={{ width, backgroundColor: "#2E2450", transform: [{ translateX }] }}>
          {children}
        </Animated.View>
        <Animated.View style={{ flex: 1, opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}
