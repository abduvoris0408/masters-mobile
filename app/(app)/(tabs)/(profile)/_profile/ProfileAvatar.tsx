import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { usePhotoUpdateMutation } from "@/services/user";
import { useAuthStore } from "@/stores";
import { showError } from "@/utils/toast";

// The avatar pick/remove flow (permissions, action sheet, upload) — shared
// by the avatar itself and the "Rasmni o'zgartirish" button next to it.
export function useAvatarPicker() {
  const { t } = useTranslation("profile");
  const user = useAuthStore((s) => s.user);
  const photoUpdateMutation = usePhotoUpdateMutation();
  const { showActionSheetWithOptions } = useActionSheet();

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      await photoUpdateMutation.mutateAsync({
        photo: { uri: asset.uri, type: "image/jpeg", name: `avatar-${Date.now()}.jpg` },
      });
    } catch {
      showError(t("avatar_update_error"));
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permission_required_title"), t("permission_camera_message"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || result.assets.length === 0) return;
    uploadAvatar(result.assets[0]);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permission_required_title"), t("permission_gallery_message"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || result.assets.length === 0) return;
    uploadAvatar(result.assets[0]);
  };

  const removeAvatar = () => {
    Alert.alert(t("avatar_remove_confirm_title"), t("avatar_remove_confirm_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("avatar_remove_confirm_action"),
        style: "destructive",
        onPress: () => photoUpdateMutation.mutate({ remove_photo: true }),
      },
    ]);
  };

  const open = () => {
    const options = [t("avatar_camera_option"), t("avatar_gallery_option")];
    if (user?.avatar) options.push(t("avatar_remove_option"));
    options.push(t("common_cancel"));
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = user?.avatar ? options.length - 2 : undefined;

    showActionSheetWithOptions({ options, cancelButtonIndex, destructiveButtonIndex }, (selectedIndex) => {
      if (selectedIndex === 0) pickFromCamera();
      else if (selectedIndex === 1) pickFromLibrary();
      else if (selectedIndex === destructiveButtonIndex) removeAvatar();
    });
  };

  return { open, isPending: photoUpdateMutation.isPending };
}

interface ProfileAvatarProps {
  displayName: string;
  isOrganization: boolean;
  organizationLogo?: string | null;
  size?: number;
  /** Opens the picker on tap; omitted for organizations (their logo is
   *  edited elsewhere). */
  onPress?: () => void;
  pending?: boolean;
}

// The photo alone — no buttons drawn over it. Editing goes through a tap on
// the photo or the separate "Rasmni o'zgartirish" action beside it.
export function ProfileAvatar({
  displayName,
  isOrganization,
  organizationLogo,
  size = 88,
  onPress,
  pending,
}: ProfileAvatarProps) {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const round = { width: size, height: size, borderRadius: size / 2 };
  const dimmed = { opacity: pending ? 0.5 : 1 };
  const uri = isOrganization ? organizationLogo : user?.avatar;

  return (
    <Pressable onPress={onPress} disabled={!onPress || pending}>
      {uri ? (
        <Image source={{ uri }} style={[round, dimmed]} />
      ) : (
        <View className="items-center justify-center bg-emerald-100 dark:bg-accent/15" style={[round, dimmed]}>
          <Text className="text-primary" style={{ fontSize: size * 0.4, fontFamily: GOLOS_WEIGHTS.bold }}>
            {(displayName.trim()?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>
      )}
      {pending ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
    </Pressable>
  );
}
