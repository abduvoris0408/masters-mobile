import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { Caption } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import {
  useCreateIntroVideoMutation,
  useDeleteIntroVideoMutation,
  useIntroVideoListQuery,
  useUpdateIntroVideoMutation,
} from "@/services/intro-video";
import type { IIntroVideo, TIntroVideoOwnerKind } from "@/types";
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
  const { t } = useTranslation("profile");
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
        <Caption className="flex-1 text-sm text-foreground">{t("intro_video_watch")}</Caption>
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
          <Caption className="text-foreground">{t("replace")}</Caption>
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
          <Caption className="text-danger">{t("delete")}</Caption>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileIntroVideoScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { masterProfile, isOrganization, organization } = useProfilePerspective();
  const kind: TIntroVideoOwnerKind = isOrganization ? "organization" : "profile";
  const ownerGuid = isOrganization ? (organization?.guid ?? null) : (masterProfile?.guid ?? null);
  const ownerId = isOrganization ? (organization?.id ?? null) : (masterProfile?.id ?? null);

  const { data: videos, isLoading } = useIntroVideoListQuery(kind, ownerGuid);
  const createMutation = useCreateIntroVideoMutation(kind, ownerGuid);
  const updateMutation = useUpdateIntroVideoMutation(kind, ownerGuid);
  const deleteMutation = useDeleteIntroVideoMutation(kind, ownerGuid);
  const [replaceTargetGuid, setReplaceTargetGuid] = useState<string | null>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const pickAndUpload = async (targetGuid: string | null) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permission_required"), t("intro_video_gallery_permission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      showError(t("intro_video_file_too_large"));
      return;
    }

    const video = { uri: asset.uri, type: "video/mp4", name: `intro-${Date.now()}.mp4` };

    if (targetGuid) {
      setReplaceTargetGuid(targetGuid);
      try {
        await updateMutation.mutateAsync({ guid: targetGuid, video });
        showSuccess(t("intro_video_updated"));
      } catch {
        showError(t("intro_video_update_error"));
      } finally {
        setReplaceTargetGuid(null);
      }
      return;
    }

    if (!ownerId) return;
    try {
      await createMutation.mutateAsync({ ownerId, video });
      showSuccess(t("intro_video_added"));
    } catch {
      showError(t("intro_video_upload_error"));
    }
  };

  const handleDelete = (guid: string) => {
    Alert.alert(t("intro_video_delete_title"), t("intro_video_delete_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess(t("intro_video_deleted"));
          } catch {
            showError(t("intro_video_delete_error"));
          } finally {
            setDeletingGuid(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header title={t("intro_video_title")} onBackPress={() => router.back()} />

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
              {t("intro_video_hint")}
            </Text>
          </View>

          {!videos?.length ? (
            <View style={{ paddingTop: 12 }}>
              <EmptyState
                icon="videocam-outline"
                title={t("intro_video_empty_title")}
                description={t("intro_video_empty_description")}
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
                <Caption className="text-sm">{t("intro_video_add")}</Caption>
              </>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
