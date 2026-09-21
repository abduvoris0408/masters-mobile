import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useMasterProfileQuery } from "@/services/master";
import {
  useCreateIntroVideoMutation,
  useDeleteIntroVideoMutation,
  useIntroVideoListQuery,
  useUpdateIntroVideoMutation,
} from "@/services/intro-video";
import type { IIntroVideo } from "@/types";
import { showError, showSuccess } from "@/utils/toast";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function VideoRow({
  video,
  onReplace,
  onDelete,
  replacing,
  deleting,
}: {
  video: IIntroVideo;
  onReplace: () => void;
  onDelete: () => void;
  replacing: boolean;
  deleting: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="gap-3 rounded-3xl bg-surface p-4">
      <Pressable
        onPress={() => Linking.openURL(video.video)}
        className="flex-row items-center gap-3 rounded-2xl bg-background px-3.5 py-4"
      >
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15">
          <Ionicons name="play" size={18} color={colors.accent} />
        </View>
        <Text className="flex-1 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          Videoni ko'rish
        </Text>
        <Ionicons name="open-outline" size={16} color={colors.muted} />
      </Pressable>

      <View className="flex-row items-center justify-end gap-2">
        <Pressable
          onPress={onReplace}
          disabled={replacing}
          className="flex-row items-center gap-1.5 rounded-full bg-background px-3.5 py-2"
        >
          {replacing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="refresh" size={14} color={colors.foreground} />
          )}
          <Text className="text-xs text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            Almashtirish
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="flex-row items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-2 dark:bg-danger/15"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
          )}
          <Text className="text-xs text-danger" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            O'chirish
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileIntroVideoScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const masterProfile = profile?.master_profile ? profile : null;
  const profileGuid = masterProfile?.guid ?? null;
  const profileId = masterProfile?.id ?? null;

  const { data: videos, isLoading } = useIntroVideoListQuery("profile", profileGuid);
  const createMutation = useCreateIntroVideoMutation("profile", profileGuid);
  const updateMutation = useUpdateIntroVideoMutation("profile", profileGuid);
  const deleteMutation = useDeleteIntroVideoMutation("profile", profileGuid);
  const [replaceTargetGuid, setReplaceTargetGuid] = useState<string | null>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const pickAndUpload = async (targetGuid: string | null) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Ruxsat kerak", "Video tanlash uchun galereyaga ruxsat bering.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      showError("Fayl hajmi 100 MB dan oshmasligi kerak");
      return;
    }

    const video = { uri: asset.uri, type: "video/mp4", name: `intro-${Date.now()}.mp4` };

    if (targetGuid) {
      setReplaceTargetGuid(targetGuid);
      try {
        await updateMutation.mutateAsync({ guid: targetGuid, video });
        showSuccess("Video yangilandi");
      } catch {
        showError("Videoni yangilashda xatolik yuz berdi");
      } finally {
        setReplaceTargetGuid(null);
      }
      return;
    }

    if (!profileId) return;
    try {
      await createMutation.mutateAsync({ ownerId: profileId, video });
      showSuccess("Video qo'shildi");
    } catch {
      showError("Videoni yuklashda xatolik yuz berdi");
    }
  };

  const handleDelete = (guid: string) => {
    Alert.alert("Videoni o'chirish", "Ushbu videoni o'chirishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess("Video o'chirildi");
          } catch {
            showError("Videoni o'chirishda xatolik yuz berdi");
          } finally {
            setDeletingGuid(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title="Tanishtiruv video" onBackPress={() => router.back()} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
        >
          <View className="flex-row items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-3 dark:bg-accent/15">
            <Ionicons name="film-outline" size={16} color={colors.accent} />
            <Text className="flex-1 text-xs text-foreground">
              Mijozlar sizni yaxshiroq tanishi uchun o'zingiz va ishingiz haqida qisqa video qo'shing
            </Text>
          </View>

          {!videos?.length ? (
            <View style={{ paddingTop: 12 }}>
              <EmptyState
                icon="videocam-outline"
                title="Hali video qo'shilmagan"
                description="O'zingizni tanishtiruvchi qisqa video qo'shing, mijozlar ishonchi ortadi"
              />
            </View>
          ) : (
            videos.map((video) => (
              <VideoRow
                key={video.guid}
                video={video}
                onReplace={() => pickAndUpload(video.guid)}
                onDelete={() => handleDelete(video.guid)}
                replacing={replaceTargetGuid === video.guid}
                deleting={deletingGuid === video.guid}
              />
            ))
          )}

          <Pressable
            onPress={() => pickAndUpload(null)}
            disabled={createMutation.isPending}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-5"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.muted} />
                <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                  Video qo'shish
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
