import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { TextField } from "@/components/ui/TextField";
import { BadgeLabel, CardTitle, Caption, ScreenTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import {
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useDocumentListQuery,
  useUpdateDocumentMutation,
  type IPickedDocumentFile,
} from "@/services/document";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import type { IDocument, TDocumentOwnerKind } from "@/types";
import { formatDate } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPdfFile(url: string) {
  return url.toLowerCase().endsWith(".pdf");
}

interface DocumentFormModalHandle {
  present: (item: IDocument | null) => void;
}

const DocumentFormModal = forwardRef<
  DocumentFormModalHandle,
  { kind: TDocumentOwnerKind; ownerGuid: string | null }
>(function DocumentFormModal({ kind, ownerGuid }, ref) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [item, setItem] = useState<IDocument | null>(null);
  const isEdit = !!item;

  const [title, setTitle] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState<IPickedDocumentFile | null>(null);

  const createMutation = useCreateDocumentMutation(kind, ownerGuid);
  const updateMutation = useUpdateDocumentMutation(kind, ownerGuid);
  const isPending = createMutation.isPending || updateMutation.isPending;

  useImperativeHandle(ref, () => ({
    present: (nextItem) => {
      setItem(nextItem);
      setTitle(nextItem?.title ?? "");
      setIssuedBy(nextItem?.issued_by ?? "");
      setIssuedAt(nextItem?.issued_at ?? "");
      setFile(null);
      sheetRef.current?.present();
    },
  }));

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"] });
    if (result.canceled || !result.assets?.length) return;
    const picked = result.assets[0];
    if (picked.size && picked.size > MAX_FILE_SIZE) {
      showError(t("documents_file_too_large"));
      return;
    }
    setFile({ uri: picked.uri, mimeType: picked.mimeType, name: picked.name });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError(t("documents_enter_title"));
      return;
    }
    if (!issuedBy.trim()) {
      showError(t("documents_enter_issued_by"));
      return;
    }
    if (!DATE_PATTERN.test(issuedAt)) {
      showError(t("documents_enter_date_format"));
      return;
    }
    if (!isEdit && !file) {
      showError(t("documents_select_file"));
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
        showSuccess(t("documents_updated"));
      } else if (file) {
        await createMutation.mutateAsync({ title: title.trim(), issued_by: issuedBy.trim(), issued_at: issuedAt, file });
        showSuccess(t("documents_added"));
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
        <ScreenTitle className="mb-4">{isEdit ? t("documents_edit_title") : t("documents_add_title")}</ScreenTitle>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        <TextField label={t("documents_name")} value={title} onChangeText={setTitle} placeholder={t("documents_name_placeholder")} />
        <View style={{ height: 12 }} />
        <TextField label={t("documents_issued_by")} value={issuedBy} onChangeText={setIssuedBy} placeholder={t("documents_issued_by_placeholder")} />
        <View style={{ height: 12 }} />
        <TextField label={t("documents_issued_at")} value={issuedAt} onChangeText={setIssuedAt} placeholder="2025-01-31" />
        <View style={{ height: 16 }} />

        <Caption className="mb-2 text-sm text-foreground">{t("documents_file")}</Caption>
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
              {t("documents_current_file_kept")}
            </Text>
            <Pressable onPress={handlePick}>
              <BadgeLabel className="text-accent">{t("replace")}</BadgeLabel>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handlePick}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4"
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.muted} />
            <Caption className="text-sm">{t("documents_pick_file")}</Caption>
          </Pressable>
        )}

        <Button className="mb-5 mt-5" loading={isPending} onPress={handleSubmit}>
          {isEdit ? t("save") : t("add")}
        </Button>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default function ProfileDocumentsScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { profileGuid, isOrganization, organizationGuid } = useProfilePerspective();
  const kind: TDocumentOwnerKind = isOrganization ? "organization" : "profile";
  const ownerGuid = isOrganization ? organizationGuid : profileGuid;
  const { data: documents, isLoading } = useDocumentListQuery(kind, ownerGuid);
  const deleteMutation = useDeleteDocumentMutation(kind, ownerGuid);

  const formSheetRef = useRef<DocumentFormModalHandle>(null);
  const [deletingGuid, setDeletingGuid] = useState<string | null>(null);

  const openAdd = () => formSheetRef.current?.present(null);
  const openEdit = (item: IDocument) => formSheetRef.current?.present(item);

  const handleDelete = (guid: string) => {
    Alert.alert(t("documents_delete_title"), t("documents_delete_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          setDeletingGuid(guid);
          try {
            await deleteMutation.mutateAsync(guid);
            showSuccess(t("documents_deleted"));
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
        title={t("documents_title")}
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
            title={t("documents_empty_title")}
            description={t("documents_empty_description")}
            actionLabel={t("documents_add_action")}
            onAction={openAdd}
          />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item: IDocument) => item.guid}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => {
            const isPdf = isPdfFile(item.file);
            return (
            <View className="flex-row items-center gap-3 rounded-3xl bg-surface p-4">
              <Pressable
                onPress={() => Linking.openURL(item.file)}
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: isPdf ? "#FEE2E2" : "#DBEAFE" }}
              >
                <Ionicons
                  name={isPdf ? "document-text-outline" : "image-outline"}
                  size={20}
                  color={isPdf ? "#DC2626" : "#2563EB"}
                />
              </Pressable>
              <Pressable className="flex-1 gap-0.5" onPress={() => Linking.openURL(item.file)}>
                <CardTitle numberOfLines={1}>{item.title}</CardTitle>
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
            );
          }}
        />
      )}

      <DocumentFormModal ref={formSheetRef} kind={kind} ownerGuid={ownerGuid} />
    </View>
  );
}
