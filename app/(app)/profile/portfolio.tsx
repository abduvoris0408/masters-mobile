import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function PortfolioFormModal({
  visible,
  profileGuid,
  item,
  onClose,
}: {
  visible: boolean;
  profileGuid: string | null;
  item: IPortfolioWork | null;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isEdit = !!item;

  const [description, setDescription] = useState("");
  const [keptImages, setKeptImages] = useState<IPortfolioImage[]>([]);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);

  const createMutation = useCreatePortfolioMutation(profileGuid);
  const updateMutation = useUpdatePortfolioMutation(profileGuid);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!visible) return;
    setDescription(item?.description ?? "");
    setKeptImages(item?.images ?? []);
    setRemovedIds([]);
    setNewImages([]);
  }, [visible, item]);

  const handlePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Ruxsat kerak", "Rasm tanlash uchun galereyaga ruxsat bering.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const accepted: NewImage[] = [];
    for (const asset of result.assets) {
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        showError("Rasm hajmi 5 MB dan oshmasligi kerak");
        continue;
      }
      accepted.push({ localId: `${Date.now()}-${Math.random()}`, uri: asset.uri, type: "image/jpeg", name: `portfolio-${Date.now()}.jpg` });
    }
    if (accepted.length) setNewImages((prev) => [...prev, ...accepted]);
  };

  const removeKept = (img: IPortfolioImage) => {
    setKeptImages((prev) => prev.filter((i) => i.id !== img.id));
    setRemovedIds((prev) => [...prev, img.id]);
  };

  const removeNew = (localId: string) => setNewImages((prev) => prev.filter((i) => i.localId !== localId));

  const totalImages = keptImages.length + newImages.length;

  const handleSubmit = async () => {
    if (!description.trim()) {
      showError("Tavsifni kiriting");
      return;
    }
    if (!isEdit && newImages.length === 0) {
      showError("Kamida bitta rasm qo'shing");
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
        showSuccess("Ish yangilandi");
      } else {
        await createMutation.mutateAsync({ description: description.trim(), images: newImages });
        showSuccess("Ish qo'shildi");
      }
      onClose();
    } catch {
      showError(isEdit ? "Yangilashda xatolik yuz berdi" : "Qo'shishda xatolik yuz berdi");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 16, maxHeight: "85%" }}>
        <Text className="mb-4 text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
          {isEdit ? "Ishni tahrirlash" : "Yangi ish qo'shish"}
        </Text>

        <ScrollView>
          <Text className="mb-1.5 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            Tavsif
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Bajarilgan ish haqida qisqacha yozing"
            placeholderTextColor={colors.muted}
            className="mb-4 rounded-2xl bg-surface px-4 py-3 text-base text-foreground"
            style={{ minHeight: 90, textAlignVertical: "top", color: colors.foreground }}
          />

          <Text className="mb-2 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            Rasmlar {totalImages > 0 ? `(${totalImages})` : ""}
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
              <Text className="text-[10px] text-muted">Rasm qo'shish</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Button loading={isPending} onPress={handleSubmit}>
          {isEdit ? "Saqlash" : "Qo'shish"}
        </Button>
      </View>
    </Modal>
  );
}

export default function ProfilePortfolioScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: works, isLoading } = usePortfolioListQuery(profileGuid);
  const deleteMutation = useDeletePortfolioMutation(profileGuid);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<IPortfolioWork | null>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (item: IPortfolioWork) => {
    setEditing(item);
    setModalVisible(true);
  };

  const handleDelete = (guid: string) => {
    Alert.alert("Ishni o'chirish", "Ushbu ishni o'chirishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess("Ish o'chirildi");
          } catch {
            showError("O'chirishda xatolik yuz berdi");
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
        title="Portfolio"
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
            title="Portfolio bo'sh"
            description="Hali bajarilgan ishlar qo'shilmagan"
            actionLabel="Ish qo'shish"
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

      <PortfolioFormModal visible={modalVisible} profileGuid={profileGuid} item={editing} onClose={() => setModalVisible(false)} />
    </View>
  );
}
