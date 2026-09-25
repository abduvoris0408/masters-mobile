import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { Card } from "@/components/ui/Card";
import { CardTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";

// Standalone card for a master's intro video(s), separate from the header
// card — a profile can have more than one video; a horizontal switcher picks
// which one is loaded into the single embedded player below it, the same
// idea as the course screen's lesson list driving one shared VideoView
// instead of rendering N independent players.
export function IntroVideoSection({ videos }: { videos: string[] }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const source = videos[activeIndex] ?? null;
  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
  });

  if (videos.length === 0) return null;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name="videocam-outline" size={16} color={colors.accent} />
        <CardTitle>{t("intro_video_title")}</CardTitle>
      </View>

      <View style={{ aspectRatio: 16 / 9, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}>
        <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls contentFit="contain" />
      </View>

      {videos.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {videos.map((_, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={index}
                onPress={() => setActiveIndex(index)}
                className={`items-center justify-center rounded-full px-3.5 py-1.5 ${active ? "bg-accent" : "bg-background"}`}
              >
                <Text
                  className={`text-xs ${active ? "text-white" : "text-muted"}`}
                  style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium }}
                >
                  {t("intro_video_index", { index: index + 1 })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </Card>
  );
}
