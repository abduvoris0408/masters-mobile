import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useCreateCourseCompletionMutation,
  useCreateLessonProgressMutation,
  useMandatoryCourseDetailQuery,
} from "@/services/mandatory-courses";
import type { IMandatoryCourseLesson } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLAYER_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

function LessonListRow({
  lesson,
  index,
  active,
  onPress,
}: {
  lesson: IMandatoryCourseLesson;
  index: number;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const isVideo = lesson.type === "video";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${active ? "bg-emerald-50 dark:bg-accent/15" : ""}`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          active ? "bg-accent" : lesson.is_read ? "bg-emerald-50 dark:bg-accent/15" : "bg-surface"
        }`}
      >
        {active ? (
          <Ionicons name="play" size={16} color="#FFFFFF" />
        ) : lesson.is_read ? (
          <Ionicons name="checkmark" size={18} color={colors.accent} />
        ) : (
          <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {index + 1}
          </Text>
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text
          className={`text-sm ${active ? "text-accent" : "text-foreground"}`}
          style={{ fontFamily: active ? GOLOS_WEIGHTS.bold : GOLOS_WEIGHTS.medium }}
          numberOfLines={2}
        >
          {lesson.title}
        </Text>
        <Text className="text-xs text-muted">{isVideo ? "Video dars" : "Material"}</Text>
      </View>
      {!isVideo && lesson.file ? <Ionicons name="open-outline" size={16} color={colors.muted} /> : null}
    </Pressable>
  );
}

export default function CourseDetailScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { guid } = useLocalSearchParams<{ guid: string }>();
  const { data, isLoading, isError, refetch } = useMandatoryCourseDetailQuery(guid ?? null);
  const markLessonMutation = useCreateLessonProgressMutation();
  const completeCourseMutation = useCreateCourseCompletionMutation();
  const [markingLessonId, setMarkingLessonId] = useState<number | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  const lessons = useMemo(() => data?.lessons ?? [], [data]);
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons.find((l) => l.type === "video") ?? null;
  const allRead = lessons.length > 0 && lessons.every((l) => l.is_read);

  useEffect(() => {
    if (!activeLessonId && lessons.length > 0) {
      setActiveLessonId((lessons.find((l) => l.type === "video") ?? lessons[0]).id);
    }
  }, [lessons, activeLessonId]);

  const videoSource = activeLesson?.type === "video" && activeLesson.file ? activeLesson.file : null;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
  });

  const handleMarkRead = async (lessonId: number, options?: { silent?: boolean }) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson?.is_read) return;
    setMarkingLessonId(lessonId);
    try {
      await markLessonMutation.mutateAsync({ lesson: lessonId });
      if (!options?.silent) showSuccess("Dars o'qildi deb belgilandi");
    } catch {
      if (!options?.silent) showError("Amalni bajarishda xatolik yuz berdi");
    } finally {
      setMarkingLessonId(null);
    }
  };

  // YouTube-style auto-progress: once a video lesson plays to the end, mark
  // it read automatically (no manual "mark as read" tap needed) and hand off
  // to the next unread lesson so watching straight through completes the course.
  useEventListener(player, "playToEnd", () => {
    if (activeLesson && !activeLesson.is_read) handleMarkRead(activeLesson.id, { silent: true });
    const currentIndex = lessons.findIndex((l) => l.id === activeLesson?.id);
    const next = lessons.slice(currentIndex + 1).find((l) => l.type === "video");
    if (next) setActiveLessonId(next.id);
  });

  const handleCompleteCourse = async () => {
    if (!data) return;
    try {
      await completeCourseMutation.mutateAsync({ course: data.id });
      showSuccess("Kurs muvaffaqiyatli yakunlandi");
      router.back();
    } catch {
      showError("Kursni yakunlashda xatolik yuz berdi");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} hitSlop={8} className="px-4 py-3">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <EmptyState
          icon="alert-circle-outline"
          title="Kurs topilmadi"
          description="Qayta urinib ko'ring"
          actionLabel="Qayta urinish"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Video player pinned to the very top, under the status bar — the
          YouTube-watch-page layout the user asked for, instead of routing
          out to an external browser to view the lesson. */}
      <View style={{ height: PLAYER_HEIGHT, backgroundColor: "#000" }}>
        {videoSource ? (
          <VideoView player={player} style={{ width: "100%", height: "100%" }} nativeControls contentFit="contain" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="document-text-outline" size={36} color="#FFFFFF" />
            <Text className="mt-2 text-sm text-white/70">Bu material video emas</Text>
          </View>
        )}
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="absolute h-9 w-9 items-center justify-center rounded-full bg-black/40"
          style={{ top: insets.top + 8, left: 12 }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-1 pb-10">
        <View className="gap-2 border-b border-border px-4 py-4">
          <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
            {activeLesson?.title ?? data.title}
          </Text>
          {activeLesson?.description ? (
            <Text className="text-sm leading-6 text-muted">{activeLesson.description}</Text>
          ) : (
            data.description ? <Text className="text-sm leading-6 text-muted">{data.description}</Text> : null
          )}

          {activeLesson && activeLesson.type !== "video" && activeLesson.file ? (
            <Pressable
              onPress={() => Linking.openURL(activeLesson.file as string)}
              className="mt-1 flex-row items-center gap-2 self-start rounded-full bg-emerald-50 px-4 py-2 dark:bg-accent/15"
            >
              <Ionicons name="document-attach-outline" size={16} color={colors.accent} />
              <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                Materialni ochish
              </Text>
            </Pressable>
          ) : null}

          {activeLesson && !activeLesson.is_read ? (
            <Button
              variant="outline"
              style={{ height: 40, marginTop: 8 }}
              loading={markingLessonId === activeLesson.id}
              onPress={() => handleMarkRead(activeLesson.id)}
            >
              O'qildi deb belgilash
            </Button>
          ) : null}
        </View>

        <View className="gap-1 px-2 py-2">
          <Text className="px-2 py-1 text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            Kurs darslari ({lessons.filter((l) => l.is_read).length}/{lessons.length})
          </Text>
          {lessons.map((lesson, index) => (
            <LessonListRow
              key={lesson.guid}
              lesson={lesson}
              index={index}
              active={lesson.id === activeLesson?.id}
              onPress={() => setActiveLessonId(lesson.id)}
            />
          ))}
        </View>

        {allRead ? (
          <View className="px-4 pt-3">
            <Button loading={completeCourseMutation.isPending} onPress={handleCompleteCourse}>
              Kursni yakunlash
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
