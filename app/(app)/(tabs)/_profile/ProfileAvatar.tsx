import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/lib/theme/colors";
import { usePhotoUpdateMutation } from "@/services/user";
import { useAuthStore } from "@/stores";
import { showError } from "@/utils/toast";

interface ProfileAvatarProps {
  displayName: string;
  isOrganization: boolean;
  organizationLogo?: string | null;
}

// Avatar image + its two floating edit buttons: a camera pill (opens the
// pick/remove action sheet — organizations edit their logo elsewhere, not
// here) and a pencil pill (goes to /profile/edit for name/category/etc.).
// Kept as its own component since the upload flow (permissions, action
// sheet, mutation) is a good chunk of logic that doesn't belong inline in
// the screen alongside the nav rows and logout button.
export function ProfileAvatar({ displayName, isOrganization, organizationLogo }: ProfileAvatarProps) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
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

  const openAvatarActionSheet = () => {
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

  return (
    <View>
      <Pressable onPress={isOrganization ? undefined : openAvatarActionSheet} disabled={isOrganization || photoUpdateMutation.isPending}>
        {isOrganization && organizationLogo ? (
          <Image source={{ uri: organizationLogo }} style={{ width: 140, height: 140, borderRadius: 70 }} />
        ) : user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 140, height: 140, borderRadius: 70, opacity: photoUpdateMutation.isPending ? 0.5 : 1 }}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full bg-emerald-100"
            style={{ width: 140, height: 140, opacity: photoUpdateMutation.isPending ? 0.5 : 1 }}
          >
            <Text className="text-5xl font-bold text-primary">{(displayName.trim()?.[0] ?? "?").toUpperCase()}</Text>
          </View>
        )}
        {photoUpdateMutation.isPending ? (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null}
      </Pressable>

      {!isOrganization ? (
        <Pressable
          onPress={openAvatarActionSheet}
          hitSlop={8}
          disabled={photoUpdateMutation.isPending}
          className="absolute -bottom-1 -right-1 h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-surface"
          style={{ shadowColor: "#0F172A", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}
        >
          <Ionicons name="camera" size={17} color={colors.foreground} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => router.push("/profile/edit")}
        hitSlop={8}
        className="absolute -bottom-1 -left-1 h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-surface"
        style={{ shadowColor: "#0F172A", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}
      >
        <Ionicons name="pencil" size={17} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
