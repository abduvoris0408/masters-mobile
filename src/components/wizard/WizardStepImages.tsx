import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/lib/theme/colors";
import { useUploadApplicationImageMutation } from "@/services/application";

export interface IPendingApplicationImage {
  localId: string;
  uri: string;
  serverId: number | null;
  uploading: boolean;
  error: boolean;
}

interface WizardStepImagesProps {
  images: IPendingApplicationImage[];
  onChange: (update: IPendingApplicationImage[] | ((prev: IPendingApplicationImage[]) => IPendingApplicationImage[])) => void;
}

const MAX_IMAGES = 10;

// Each picked photo uploads (POST /application/image/create/) the moment
// it's picked, same as the web wizard — by submit time its server id is
// already known and just gets collected into ICreateApplicationRequest.images.
export function WizardStepImages({ images, onChange }: WizardStepImagesProps) {
  const colors = useThemeColors();
  const uploadImageMutation = useUploadApplicationImageMutation();

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Ruxsat kerak", "Rasm tanlash uchun galereyaga ruxsat bering.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(0, MAX_IMAGES - images.length),
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const accepted: IPendingApplicationImage[] = result.assets.slice(0, MAX_IMAGES - images.length).map((asset) => ({
      localId: `${Date.now()}-${Math.random()}`,
      uri: asset.uri,
      serverId: null,
      uploading: true,
      error: false,
    }));
    if (accepted.length === 0) return;

    onChange((prev) => [...prev, ...accepted]);
    accepted.forEach((img) => {
      uploadImageMutation.mutate(
        { uri: img.uri, type: "image/jpeg", name: `photo-${img.localId}.jpg` },
        {
          onSuccess: (res) => {
            onChange((prev) => prev.map((p) => (p.localId === img.localId ? { ...p, serverId: res.id, uploading: false } : p)));
          },
          onError: () => {
            onChange((prev) => prev.map((p) => (p.localId === img.localId ? { ...p, uploading: false, error: true } : p)));
          },
        },
      );
    });
  };

  const removeImage = (localId: string) => onChange((prev) => prev.filter((img) => img.localId !== localId));

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2.5">
        {images.map((img) => (
          <View key={img.localId} className="h-[92px] w-[92px] overflow-hidden rounded-2xl border border-border">
            <Image source={{ uri: img.uri }} style={{ width: "100%", height: "100%", opacity: img.uploading ? 0.5 : 1 }} />
            {img.uploading ? (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null}
            {img.error && !img.uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/35">
                <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
              </View>
            ) : null}
            <Pressable
              onPress={() => removeImage(img.localId)}
              className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/55"
            >
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}

        {images.length < MAX_IMAGES ? (
          <Pressable
            onPress={pickImages}
            className="h-[92px] w-[92px] items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-background"
          >
            <Ionicons name="image-outline" size={20} color={colors.muted} />
            <Text className="text-[11px] text-muted">Qo'shish</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-xs text-muted">Rasmlar ixtiyoriy, lekin ish haqida ko'proq ma'lumot beradi.</Text>
    </View>
  );
}
