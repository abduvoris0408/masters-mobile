import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useDocumentListQuery,
  useUpdateDocumentMutation,
  type IPickedDocumentFile,
} from "@/services/document";
import { useMasterProfileQuery } from "@/services/master";
import type { IDocument } from "@/types";
import { formatDate } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function DocumentFormModal({
  visible,
  profileGuid,
  item,
  onClose,
}: {
  visible: boolean;
  profileGuid: string | null;
  item: IDocument | null;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isEdit = !!item;

  const [title, setTitle] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState<IPickedDocumentFile | null>(null);

  const createMutation = useCreateDocumentMutation("profile", profileGuid);
  const updateMutation = useUpdateDocumentMutation("profile", profileGuid);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!visible) return;
    setTitle(item?.title ?? "");
    setIssuedBy(item?.issued_by ?? "");
    setIssuedAt(item?.issued_at ?? "");
    setFile(null);
  }, [visible, item]);

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (result.canceled || !result.assets?.length) return;
    const picked = result.assets[0];
    if (picked.size && picked.size > MAX_FILE_SIZE) {
      showError("Fayl hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    setFile({ uri: picked.uri, mimeType: picked.mimeType, name: picked.name });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Nomini kiriting");
      return;
    }
    if (!issuedBy.trim()) {
      showError("Kim tomonidan berilganini kiriting");
      return;
    }
    if (!DATE_PATTERN.test(issuedAt)) {
      showError("Sanani YYYY-MM-DD formatida kiriting");
      return;
    }
    if (!isEdit && !file) {
      showError("Faylni tanlang");
      return;
    }
    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({
          guid: item.guid,
          title: title.trim(),
          issuedBy: issuedBy.trim(),
          issuedAt,
          file: file ?? undefined,
        });
        showSuccess("Hujjat yangilandi");
      } else if (file) {
        await createMutation.mutateAsync({ title: title.trim(), issued_by: issuedBy.trim(), issued_at: issuedAt, file });
        showSuccess("Hujjat qo'shildi");
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
          {isEdit ? "Hujjatni tahrirlash" : "Yangi hujjat qo'shish"}
        </Text>

        <ScrollView>
          <TextField label="Nomi" value={title} onChangeText={setTitle} placeholder="Sertifikat nomi" />
          <View style={{ height: 12 }} />
          <TextField label="Kim tomonidan berilgan" value={issuedBy} onChangeText={setIssuedBy} placeholder="Tashkilot nomi" />
          <View style={{ height: 12 }} />
          <TextField label="Berilgan sana" value={issuedAt} onChangeText={setIssuedAt} placeholder="2025-01-31" />
          <View style={{ height: 16 }} />

          <Text className="mb-2 text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            Fayl
          </Text>
          {file ? (
            <View className="flex-row items-center gap-2.5 rounded-2xl bg-surface px-3.5 py-3">
              <Ionicons name="document-text-outline" size={18} color={colors.accent} />
              <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                {file.name}
              </Text>
              <Pressable onPress={() => setFile(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ) : isEdit && item?.file ? (
            <View className="flex-row items-center gap-2.5 rounded-2xl bg-surface px-3.5 py-3">
              <Ionicons name="document-text-outline" size={18} color={colors.muted} />
              <Text className="flex-1 text-xs text-muted" numberOfLines={1}>
                Joriy fayl saqlanadi
              </Text>
              <Pressable onPress={handlePick}>
                <Text className="text-xs text-accent" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                  Almashtirish
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePick}
              className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4"
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.muted} />
              <Text className="text-sm text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
                Fayl tanlash (rasm yoki PDF)
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <Button className="mt-5" loading={isPending} onPress={handleSubmit}>
          {isEdit ? "Saqlash" : "Qo'shish"}
        </Button>
      </View>
    </Modal>
  );
}

export default function ProfileDocumentsScreen() {
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { data: profile } = useMasterProfileQuery();
  const profileGuid = profile?.master_profile ? profile.guid : null;
  const { data: documents, isLoading } = useDocumentListQuery("profile", profileGuid);
  const deleteMutation = useDeleteDocumentMutation("profile", profileGuid);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<IDocument | null>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (item: IDocument) => {
    setEditing(item);
    setModalVisible(true);
  };

  const handleDelete = (guid: string) => {
    Alert.alert("Hujjatni o'chirish", "Ushbu hujjatni o'chirishni tasdiqlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish",
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess("Hujjat o'chirildi");
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
        title="Hujjatlar"
        onBackPress={() => router.back()}
        right={
          <Pressable onPress={openAdd} hitSlop={8}>
            <Ionicons name="add-circle" size={26} color={colors.accent} />
          </Pressable>
        }
      />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !documents?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="document-attach-outline"
            title="Hujjatlar qo'shilmagan"
            actionLabel="Hujjat qo'shish"
            onAction={openAdd}
          />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item: IDocument) => item.guid}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 rounded-3xl bg-surface p-4">
              <Pressable
                onPress={() => Linking.openURL(item.file)}
                className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-accent/15"
              >
                <Ionicons name="document-text-outline" size={20} color={colors.accent} />
              </Pressable>
              <Pressable className="flex-1 gap-0.5" onPress={() => Linking.openURL(item.file)}>
                <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {item.issued_by} · {formatDate(item.issued_at)}
                </Text>
              </Pressable>
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
          )}
        />
      )}

      <DocumentFormModal visible={modalVisible} profileGuid={profileGuid} item={editing} onClose={() => setModalVisible(false)} />
    </View>
  );
}
