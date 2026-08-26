import { View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useAppDrawer } from "@/providers/DrawerProvider";

export default function ChatScreen() {
  const { open } = useAppDrawer();

  return (
    <View className="flex-1 bg-background">
      <Header title="Xabarlar" onMenuPress={open} />
      <EmptyState icon="chatbubble-outline" title="Hozircha xabarlar yo'q" description="Realtime chat keyingi bosqichda ulanadi." />
    </View>
  );
}
