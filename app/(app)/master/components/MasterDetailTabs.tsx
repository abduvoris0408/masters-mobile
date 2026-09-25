import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { BadgeLabel, CardTitle } from "@/components/ui/Typography";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import { useDocumentListQuery } from "@/services/document";
import { usePortfolioListQuery } from "@/services/portfolio";
import type { IUserServiceCatalogServiceDetail, IUserServiceCategoryRef } from "@/types";
import { formatDate, formatPrice } from "@/utils/format";

export interface ServiceGroup {
  category: IUserServiceCategoryRef;
  services: IUserServiceCatalogServiceDetail[];
}

type TabKey = "services" | "documents" | "portfolio";

function useTabMeta(t: (key: string) => string): { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] {
  return [
    { key: "services", label: t("master_tabs_services"), icon: "construct-outline" },
    { key: "documents", label: t("master_tabs_documents"), icon: "document-attach-outline" },
    { key: "portfolio", label: t("master_tabs_portfolio"), icon: "images-outline" },
  ];
}

// Card-style tab picker — mirrors the profile screen's NavRow rows (icon
// tile + label, accent-highlighted when active) instead of the web app's
// underlined pill tabs, so the detail screen's chrome matches the rest of
// the app's navigation language.
function TabPicker({ value, onChange }: { value: TabKey; onChange: (key: TabKey) => void }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const TAB_META = useTabMeta(t);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
      {TAB_META.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-row items-center gap-2 rounded-2xl px-3.5 py-3 ${active ? "bg-accent" : "bg-background"}`}
          >
            <Ionicons name={tab.icon} size={16} color={active ? "#FFFFFF" : colors.muted} />
            <Text
              className={`text-sm ${active ? "text-white" : "text-muted"}`}
              style={{ fontFamily: active ? GOLOS_WEIGHTS.semibold : GOLOS_WEIGHTS.medium }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ServicesTab({ groups, onOrder }: { groups: ServiceGroup[]; onOrder?: (service: IUserServiceCatalogServiceDetail) => void }) {
  const { t } = useTranslation("catalog");
  if (groups.length === 0) {
    return <EmptyState icon="construct-outline" title={t("master_tabs_services_empty")} />;
  }

  return (
    <View className="gap-4">
      {groups.map(({ category, services }) => (
        <View key={category.guid} className="gap-2.5">
          <CardTitle>{category.name}</CardTitle>
          <View className="gap-2">
            {services.map((service) => (
              <View key={service.guid} className="gap-2 rounded-2xl bg-background p-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {service.service_name ?? t("master_tabs_service_fallback")}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-sm text-accent" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
                      {formatPrice(Number(service.price))}
                    </Text>
                    {service.allowed_units[0] ? (
                      <Text className="text-xs text-muted">/ {service.allowed_units[0].name}</Text>
                    ) : null}
                  </View>
                </View>
                {onOrder ? (
                  <Pressable onPress={() => onOrder(service)} className="self-start rounded-full bg-accent px-3.5 py-1.5">
                    <BadgeLabel className="text-white">{t("master_tabs_order_service")}</BadgeLabel>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function isPdfFile(url: string) {
  return url.toLowerCase().endsWith(".pdf");
}

function DocumentsTab({ profileGuid }: { profileGuid: string }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const { data, isLoading } = useDocumentListQuery("profile", profileGuid);

  if (isLoading) return <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />;
  if (!data?.length) return <EmptyState icon="document-attach-outline" title={t("master_tabs_documents_empty")} />;

  return (
    <View className="gap-2.5">
      {data.map((doc) => {
        const isPdf = isPdfFile(doc.file);
        return (
          <Pressable
            key={doc.guid}
            onPress={() => Linking.openURL(doc.file)}
            className="flex-row items-center gap-3 rounded-2xl bg-background p-3.5"
          >
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: isPdf ? "#FEE2E2" : "#DBEAFE" }}
            >
              <Ionicons
                name={isPdf ? "document-text-outline" : "image-outline"}
                size={17}
                color={isPdf ? "#DC2626" : "#2563EB"}
              />
            </View>
            <View className="flex-1 gap-0.5">
              <CardTitle numberOfLines={1}>{doc.title}</CardTitle>
              <Text className="text-xs text-muted">
                {doc.issued_by} · {formatDate(doc.issued_at)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PortfolioTab({ profileGuid }: { profileGuid: string }) {
  const { t } = useTranslation("catalog");
  const colors = useThemeColors();
  const { data, isLoading } = usePortfolioListQuery(profileGuid);

  if (isLoading) return <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />;
  if (!data?.length) return <EmptyState icon="images-outline" title={t("master_tabs_portfolio_empty")} />;

  return (
    <View className="gap-3">
      {data.map((item) => (
        <View key={item.guid} className="gap-2 rounded-2xl bg-background p-3">
          <View className="flex-row flex-wrap gap-2">
            {item.images.map((img) => (
              <Image key={img.id} source={{ uri: img.image }} className="rounded-xl" style={{ width: 100, height: 100 }} />
            ))}
          </View>
          {item.description ? <Text className="px-0.5 text-sm text-foreground">{item.description}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function MasterDetailTabs({
  groups,
  onOrder,
  profileGuid,
}: {
  groups: ServiceGroup[];
  onOrder?: (service: IUserServiceCatalogServiceDetail) => void;
  profileGuid: string;
}) {
  const [tab, setTab] = useState<TabKey>("services");

  return (
    <View className="gap-4 rounded-3xl bg-surface p-4">
      <TabPicker value={tab} onChange={setTab} />
      {tab === "services" ? <ServicesTab groups={groups} onOrder={onOrder} /> : null}
      {tab === "documents" ? <DocumentsTab profileGuid={profileGuid} /> : null}
      {tab === "portfolio" ? <PortfolioTab profileGuid={profileGuid} /> : null}
    </View>
  );
}
