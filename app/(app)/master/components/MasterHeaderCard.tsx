import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ActivityIndicator, Linking, Pressable, Share, Text, View } from "react-native";
import { router } from "expo-router";

import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Rating } from "@/components/ui/Rating";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { EProfileType, type IUserServiceCatalogDetail, type IUserServiceCategoryRef } from "@/types";
import { formatPhoneNumber, fromNow } from "@/utils/format";

import { MasterLevelBadge } from "./MasterLevelBadge";

interface Props {
  master: IUserServiceCatalogDetail;
  categories: IUserServiceCategoryRef[];
  averageRating?: number | null;
  onContact: () => void;
  contacting: boolean;
}

export function MasterHeaderCard({ master, categories, averageRating, onContact, contacting }: Props) {
  const colors = useThemeColors();
  const rating = averageRating ?? master.rating ?? null;
  const fullName = [master.name, master.surname].filter(Boolean).join(" ");
  const address = [master.region?.name, master.district?.name].filter(Boolean).join(", ");
  const specializations = useMemo(() => Array.from(new Set(categories.map((c) => c.name))), [categories]);
  const mainCategory = categories.find((c) => c.is_main) ?? null;

  const handleShare = async () => {
    try {
      await Share.share({ message: fullName, title: fullName });
    } catch {
      // User dismissed the share sheet — nothing to surface.
    }
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-3">
        <Avatar uri={master.photo} name={master.name} size={72} />
        <View className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-lg text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.bold }} numberOfLines={1}>
              {fullName}
            </Text>
            {master.level?.current ? <MasterLevelBadge level={master.level} /> : null}
          </View>
          <View className="flex-row items-center gap-2">
            <Rating value={rating ?? 0} />
          </View>
        </View>
      </View>

      <View className="gap-2">
        {master.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${master.phone}`)} className="flex-row items-center gap-2">
            <Ionicons name="call-outline" size={15} color={colors.muted} />
            <Text className="text-sm text-accent">{formatPhoneNumber(master.phone)}</Text>
          </Pressable>
        ) : null}

        {address ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text className="flex-1 text-sm text-muted" numberOfLines={1}>
              {address}
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-2">
          <Ionicons name={master.type === EProfileType.ORGANIZATION ? "business-outline" : "person-outline"} size={15} color={colors.muted} />
          <Text className="text-sm text-muted">
            {master.type === EProfileType.ORGANIZATION ? "Tashkilot" : "Yakka tartibdagi mutaxassis"}
          </Text>
        </View>

        {master.experience_level ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="briefcase-outline" size={15} color={colors.muted} />
            <Text className="text-sm text-muted">Daraja: {master.experience_level}</Text>
          </View>
        ) : null}

        {mainCategory ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
              Asosiy yo'nalish: {mainCategory.name}
            </Text>
          </View>
        ) : null}

        {master.organization ? (
          <Pressable
            onPress={() => router.push(`/organization/${master.organization!.guid}`)}
            className="flex-row items-center gap-2"
          >
            <Ionicons name="business-outline" size={15} color={colors.muted} />
            <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
              {master.organization.name}
            </Text>
            {master.organization.is_verified ? (
              <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {specializations.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {specializations.map((name) => (
            <Chip key={name} label={name} />
          ))}
        </View>
      ) : null}

      {master.description ? (
        <View className="gap-1">
          <Text className="text-xs text-muted" style={{ fontFamily: GOLOS_WEIGHTS.medium }}>
            Tavsif
          </Text>
          <Text className="text-sm leading-6 text-foreground">{master.description}</Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap items-center gap-2.5">
        <Pressable
          onPress={onContact}
          disabled={contacting}
          className="flex-row items-center gap-2 rounded-full bg-accent px-4 py-2.5"
        >
          {contacting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
          )}
          <Text className="text-sm text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            Murojaat qilish
          </Text>
        </Pressable>

        <Pressable onPress={handleShare} className="flex-row items-center gap-2 rounded-full bg-background px-4 py-2.5">
          <Ionicons name="share-social-outline" size={16} color={colors.foreground} />
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            Ulashish
          </Text>
        </Pressable>

        {master.last_login ? (
          <View className="flex-row items-center gap-1.5 rounded-full bg-background px-3 py-2">
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text className="text-xs text-muted">Faol edi: {fromNow(master.last_login)}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
