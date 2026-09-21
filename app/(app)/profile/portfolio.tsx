import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useCreatePortfolioMutation,
  useDeletePortfolioMutation,
  usePortfolioListQuery,
  useUpdatePortfolioMutation,
  type IPickedPortfolioImage,
} from "@/services/portfolio";
import { useMasterProfileQuery } from "@/services/master";
import type { IPortfolioImage, IPortfolioWork } from "@/types";
import { formatDate } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface NewImage extends IPickedPortfolioImage {
  localId: string;
}

interface PortfolioFormModalHandle {
  present: (item: IPortfolioWork | null) => void;
}

const PortfolioFormModal = forwardRef<PortfolioFormModalHandle, { profileGuid: string | null }>(function PortfolioFormModal(
  { profileGuid },
  ref,
) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const [item, setItem] = useState<IPortfolioWork | null>(null);
  const isEdit = !!item;

  const [description, setDescription] = useState("");
  const [keptImages, setKeptImages] = useState<IPortfolioImage[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  const createMutation = useCreatePortfolioMutation(profileGuid);
  const updateMutation = useUpdatePortfolioMutation(profileGuid);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useImperativeHandle(ref, () => ({
    present: (nextItem) => {
      setItem(nextItem);
      setDescription(nextItem?.description ?? "");
      setKeptImages(nextItem?.images ?? []);
      setRemovedIds([]);
      setNewImages([]);
      sheetRef.current?.present();
    },
  }));

  const acceptAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const accepted: NewImage[] = [];
    for (const asset of assets) {
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        showError(t("portfolio_image_too_large"));
        continue;
      }
      accepted.push({ localId: `${Date.now()}-${Math.random()}`, uri: asset.uri, type: "image/jpeg", name: `portfolio-${Date.now()}.jpg` });
    }
    if (accepted.length) setNewImages((prev) => [...prev, ...accepted]);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permission_required"), t("portfolio_camera_permission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    acceptAssets(result.assets);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permission_required"), t("portfolio_gallery_permission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    acceptAssets(result.assets);
  };

  const handlePick = () => {
    showActionSheetWithOptions(
      {
        options: [t("portfolio_camera"), t("portfolio_gallery"), t("cancel")],
        cancelButtonIndex: 2,
      },
      (selectedIndex) => {
        if (selectedIndex === 0) pickFromCamera();
        else if (selectedIndex === 1) pickFromLibrary();
      },
    );
  };

  const removeKept = (img: IPortfolioImage) => {
    setKeptImages((prev) => prev.filter((i) => i.id !== img.id));
    setRemovedIds((prev) => [...prev, img.id]);
  };

  const removeNew = (localId: string) => setNewImages((prev) => prev.filter((i) => i.localId !== localId));

  const totalImages = keptImages.length + newImages.length;

  const handleSubmit = async () => {
    if (!description.trim()) {
      showError(t("portfolio_enter_description"));
      return;
    }
    if (!isEdit && newImages.length === 0) {
      showError(t("portfolio_add_at_least_one_image"));
      return;
    }
    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({
          guid: item.guid,
          description: description.trim(),
          newImages,
          removeImageIds: removedIds,
        });
        showSuccess(t("portfolio_updated"));
      } else {
        await createMutation.mutateAsync({ description: description.trim(), images: newImages });
        showSuccess(t("portfolio_added"));
      }
      sheetRef.current?.dismiss();
    } catch {
      showError(isEdit ? t("update_error") : t("add_error"));
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["85%"]}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      <View className="px-5">
        <Text className="mb-4 text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {isEdit ? t("portfolio_edit_title") : t("portfolio_add_title")}
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        <Text className="mb-1.5 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {t("description")}
        </Text>
        <BottomSheetTextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder={t("portfolio_description_placeholder")}
          placeholderTextColor={colors.muted}
          className="mb-4 rounded-2xl bg-surface px-4 py-3 text-base text-foreground"
          style={{ minHeight: 90, textAlignVertical: "top", color: colors.foreground }}
        />

        <Text className="mb-2 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
          {t("portfolio_images_label")} {totalImages > 0 ? `(${totalImages})` : ""}
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2.5">
          {keptImages.map((img) => (
            <View key={img.id} style={{ width: 88, height: 88 }}>
              <Image source={{ uri: img.image }} className="h-full w-full rounded-xl" />
              <Pressable
                onPress={() => removeKept(img)}
                className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {newImages.map((img) => (
            <View key={img.localId} style={{ width: 88, height: 88 }}>
              <Image source={{ uri: img.uri }} className="h-full w-full rounded-xl" />
              <Pressable
                onPress={() => removeNew(img.localId)}
                className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={handlePick}
            className="items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface"
            style={{ width: 88, height: 88 }}
          >
            <Ionicons name="image-outline" size={20} color={colors.muted} />
            <Text className="text-[10px] text-muted">{t("portfolio_add_image")}</Text>
          </Pressable>
        </View>

        <Button className="mb-5" loading={isPending} onPress={handleSubmit}>
          {isEdit ? t("save") : t("add")}
        </Button>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default function ProfilePortfolioScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: works, isLoading } = usePortfolioListQuery(profileGuid);
  const deleteMutation = useDeletePortfolioMutation(profileGuid);

  const formSheetRef = useRef<PortfolioFormModalHandle>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const openAdd = () => formSheetRef.current?.present(null);
  const openEdit = (item: IPortfolioWork) => formSheetRef.current?.present(item);

  const handleDelete = (guid: string) => {
    Alert.alert(t("portfolio_delete_title"), t("portfolio_delete_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess(t("portfolio_deleted"));
          } catch {
            showError(t("delete_error"));
          } finally {
            setDeletingGuid(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Header
        title={t("portfolio_title")}
        onBackPress={() => router.back()}
        right={
          <Pressable onPress={openAdd} hitSlop={8}>
            <Ionicons name="add-circle" size={26} color={colors.accent} />
          </Pressable>
        }
      />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !works?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="images-outline"
            title={t("portfolio_empty_title")}
            description={t("portfolio_empty_description")}
            actionLabel={t("portfolio_add_action")}
            onAction={openAdd}
          />
        </View>
      ) : (
        <FlatList
          data={works}
          keyExtractor={(item: IPortfolioWork) => item.guid}
          contentContainerClassName="gap-3 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => (
            <View className="gap-2 rounded-3xl bg-surface p-3">
              <View className="flex-row flex-wrap gap-2">
                {item.images.map((img) => (
                  <Image key={img.id} source={{ uri: img.image }} className="rounded-2xl" style={{ width: 110, height: 110 }} />
                ))}
              </View>
              {item.description ? <Text className="px-1 text-sm text-foreground">{item.description}</Text> : null}
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-xs text-muted">{formatDate(item.created_at)}</Text>
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={16} color={colors.foreground} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.guid)} hitSlop={8} disabled={deletingGuid === item.guid}>
                    {deletingGuid === item.guid ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <PortfolioFormModal ref={formSheetRef} profileGuid={profileGuid} />
    </View>
  );
}
