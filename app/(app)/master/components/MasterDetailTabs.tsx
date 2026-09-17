import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
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

const TAB_META: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "services", label: "Xizmatlar", icon: "construct-outline" },
  { key: "documents", label: "Hujjatlar", icon: "document-attach-outline" },
  { key: "portfolio", label: "Portfolio", icon: "images-outline" },
];

// Card-style tab picker — mirrors the profile screen's NavRow rows (icon
// tile + label, accent-highlighted when active) instead of the web app's
// underlined pill tabs, so the detail screen's chrome matches the rest of
// the app's navigation language.
function TabPicker({ value, onChange }: { value: TabKey; onChange: (key: TabKey) => void }) {
  const colors = useThemeColors();
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
  if (groups.length === 0) {
    return <EmptyState icon="construct-outline" title="Xizmatlar qo'shilmagan" />;
  }

  return (
    <View className="gap-4">
      {groups.map(({ category, services }) => (
        <View key={category.guid} className="gap-2.5">
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
            {category.name}
          </Text>
          <View className="gap-2">
            {services.map((service) => (
              <View key={service.guid} className="gap-2 rounded-2xl bg-background p-3.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {service.service_name ?? "Xizmat"}
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
                    <Text className="text-xs text-white" style={{ fontFamily: GOLOS_WEIGHTS.semibold }}>
                      Buyurtma berish
                    </Text>
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

function DocumentsTab({ profileGuid }: { profileGuid: string }) {
  const colors = useThemeColors();
  const { data, isLoading } = useDocumentListQuery("profile", profileGuid);

  if (isLoading) return <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />;
  if (!data?.length) return <EmptyState icon="document-attach-outline" title="Hujjatlar qo'shilmagan" />;

  return (
    <View className="gap-2.5">
      {data.map((doc) => (
        <View key={doc.guid} className="gap-0.5 rounded-2xl bg-background p-3.5">
          <Text className="text-sm text-foreground" style={{ fontFamily: GOLOS_WEIGHTS.semibold }} numberOfLines={1}>
            {doc.title}
          </Text>
          <Text className="text-xs text-muted">
            {doc.issued_by} · {formatDate(doc.issued_at)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PortfolioTab({ profileGuid }: { profileGuid: string }) {
  const colors = useThemeColors();
  const { data, isLoading } = usePortfolioListQuery(profileGuid);

  if (isLoading) return <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />;
  if (!data?.length) return <EmptyState icon="images-outline" title="Portfolio bo'sh" />;

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
