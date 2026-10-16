import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";

import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar } from "@/components/ui/Avatar";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { PillTabs } from "@/components/ui/PillTabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { CardTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useThemeColors } from "@/lib/theme/colors";
import { useFavoriteLookup, useFavoritesQuery } from "@/services/favorite";
import type { IFavorite, IFavoriteOrganization, IFavoriteProfile, TFavoriteType } from "@/types";
import { appendUniquePage } from "@/utils/pagination";

const PAGE_SIZE = 20;

const LEGAL_FORMS = new Set(["mchj", "yatt", "xk", "aj", "other"]);

// `profile.user` may be a plain name string or a nested user object
// ({ name, surname, ... }); anything else (e.g. a bare id) has no usable name.
const getFavoriteProfileName = (user: unknown): string => {
  if (typeof user === "string") return user;
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const parts = [u.surname, u.name, u.first_name, u.last_name].filter(
      (p): p is string => typeof p === "string" && p.trim() !== "",
    );
    if (parts.length) return parts.join(" ");
    if (typeof u.full_name === "string") return u.full_name;
  }
  return "";
};

// Same leniency for `organization.categories`: documented as a string, but a
// list of names or {name} objects is handled too.
const getCategoryNames = (categories: unknown): string[] => {
  if (typeof categories === "string") return categories.split(",").map((c) => c.trim()).filter(Boolean);
  if (Array.isArray(categories)) {
    return categories
      .map((c) => (typeof c === "string" ? c : (c as { name?: unknown })?.name))
      .filter((c): c is string => typeof c === "string" && c !== "");
  }
  return [];
};

function FavoriteTile({
  avatar,
  title,
  description,
  heart,
  onPress,
}: {
  avatar: ReactNode;
  title: string;
  description: string;
  heart: ReactNode;
  onPress: () => void;
}) {
  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-3.5 p-4">
      {avatar}
      <View className="flex-1 gap-1 self-start">
        <View className="flex-row items-start gap-2">
          <CardTitle className="flex-1" numberOfLines={1}>
            {title}
          </CardTitle>
          {heart}
        </View>
        <Text className="text-[13px] leading-5 text-muted" numberOfLines={2}>
          {description}
        </Text>
      </View>
    </PressableCard>
  );
}

function FavoriteMasterTile({ profile }: { profile: IFavoriteProfile }) {
  const { t } = useTranslation("favorites");
  const name = getFavoriteProfileName(profile.user) || t("unnamed_master");
  return (
    <FavoriteTile
      onPress={() => router.push(`/master/${profile.guid}`)}
      avatar={<Avatar uri={profile.photo} name={name} size={60} />}
      title={name}
      description={profile.description?.trim() || t("no_description")}
      heart={<FavoriteButton type="profile" targetGuid={profile.guid} variant="plain" />}
    />
  );
}

function FavoriteOrganizationTile({ organization }: { organization: IFavoriteOrganization }) {
  const { t } = useTranslation(["favorites", "catalog"]);
  const summary = [
    LEGAL_FORMS.has(organization.legal_form)
      ? t(`org_detail_legal_form_${organization.legal_form}`, { ns: "catalog" })
      : null,
    getCategoryNames(organization.categories).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <FavoriteTile
      onPress={() => router.push(`/organization/${organization.guid}`)}
      avatar={<Avatar uri={organization.logo} name={organization.name} size={60} fallbackIcon="business" />}
      title={organization.name}
      description={summary || t("no_description")}
      heart={<FavoriteButton type="organization" targetGuid={organization.guid} variant="plain" />}
    />
  );
}

function TileSkeleton() {
  return (
    <PressableCard className="flex-row items-center gap-3.5 p-4">
      <Skeleton width={60} height={60} radius={30} />
      <View className="flex-1 gap-1.5">
        <Skeleton width="55%" height={15} />
        <Skeleton width="85%" height={12} />
      </View>
    </PressableCard>
  );
}

// Mobile counterpart to the web project's /favorites page — saved masters
// and organizations, one pill tab each, with the heart to un-save in place.
export default function FavoritesScreen() {
  const { t } = useTranslation("favorites");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const [type, setType] = useState<TFavoriteType>("profile");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IFavorite[]>([]);
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useFavoritesQuery(type, page, PAGE_SIZE);
  // Tab counters — these lookups are already cached by the hearts.
  const profileCount = useFavoriteLookup("profile").size;
  const organizationCount = useFavoriteLookup("organization").size;

  useEffect(() => {
    // Placeholder data is the previous tab's/page's list — wait for the real one.
    if (!data || isPlaceholderData) return;
    const results = Array.isArray(data.results) ? data.results : [];
    setItems((prev) => appendUniquePage(page === 1 ? [] : prev, results, (i) => i.guid));
  }, [data, isPlaceholderData, page]);

  const changeType = (next: TFavoriteType) => {
    if (next === type) return;
    setType(next);
    setPage(1);
    setItems([]);
  };

  const isProfile = type === "profile";
  const hasMore = !!data?.next;
  const showSkeleton = isLoading || (isPlaceholderData && items.length === 0);

  return (
    <View className="flex-1 bg-background">
      <Header title={t("title")} onBackPress={() => router.back()} />

      <View className="px-4 pb-3" style={{ paddingTop: headerHeight + 8 }}>
        <PillTabs<TFavoriteType>
          value={type}
          onChange={changeType}
          options={[
            { value: "profile", label: `${t("tab_masters")} · ${profileCount}` },
            { value: "organization", label: `${t("tab_organizations")} · ${organizationCount}` },
          ]}
        />
      </View>

      {showSkeleton ? (
        <View className="gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={isProfile ? t("empty_masters_title") : t("empty_organizations_title")}
          description={t("empty_desc")}
          actionLabel={isProfile ? t("browse_masters") : t("browse_organizations")}
          onAction={() => router.push(isProfile ? "/more/masters-catalog" : "/more/organizations-catalog")}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-3 px-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) =>
            item.type === "profile" && item.profile ? (
              <FavoriteMasterTile profile={item.profile} />
            ) : item.organization ? (
              <FavoriteOrganizationTile organization={item.organization} />
            ) : null
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => hasMore && !isFetching && setPage((p) => p + 1)}
          ListFooterComponent={isFetching && page > 1 ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && page === 1 && items.length > 0}
              onRefresh={() => (page === 1 ? refetch() : setPage(1))}
            />
          }
        />
      )}
    </View>
  );
}
