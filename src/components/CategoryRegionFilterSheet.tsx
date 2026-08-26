import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useAllJobsCategoriesQuery, useRegionsQuery } from "@/services/master";

export interface CategoryRegionFilterValue {
  category: number[];
  region: number | null;
}

interface CategoryRegionFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  value: CategoryRegionFilterValue;
  onApply: (value: CategoryRegionFilterValue) => void;
}

// Bottom sheet shared by the Home (elonlar) and Masters catalog feeds — both
// filter on the same category/region dimensions per IApplicationsListFilters
// / IMasterCatalogListFilters; screen-specific extra filters (price/sort)
// can be layered on top later without duplicating this shell.
export function CategoryRegionFilterSheet({ visible, onClose, value, onApply }: CategoryRegionFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { data: categories } = useAllJobsCategoriesQuery(visible);
  const { data: regions } = useRegionsQuery(visible);

  const [category, setCategory] = useState<number[]>(value.category);
  const [region, setRegion] = useState<number | null>(value.region);

  const toggleCategory = (id: number) => {
    setCategory((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const reset = () => {
    setCategory([]);
    setRegion(null);
  };

  const apply = () => {
    onApply({ category, region });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        className="rounded-t-3xl bg-background px-5 pt-5"
        style={{ paddingBottom: insets.bottom + 16, maxHeight: "75%" }}
      >
        <Text className="mb-4 text-lg font-semibold text-foreground">Filtr</Text>

        <ScrollView>
          <Text className="mb-2 text-sm font-medium text-muted">Kategoriya</Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {categories?.map((c) => {
              const active = category.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggleCategory(c.id)}
                  className={`rounded-full px-3.5 py-2 ${active ? "bg-primary" : "bg-surface"}`}
                >
                  <Text className={`text-sm font-medium ${active ? "text-primary-foreground" : "text-foreground"}`}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 text-sm font-medium text-muted">Viloyat</Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setRegion(null)}
              className={`rounded-full px-3.5 py-2 ${region === null ? "bg-primary" : "bg-surface"}`}
            >
              <Text className={`text-sm font-medium ${region === null ? "text-primary-foreground" : "text-foreground"}`}>
                Barchasi
              </Text>
            </Pressable>
            {regions?.map((r) => {
              const active = region === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRegion(r.id)}
                  className={`rounded-full px-3.5 py-2 ${active ? "bg-primary" : "bg-surface"}`}
                >
                  <Text className={`text-sm font-medium ${active ? "text-primary-foreground" : "text-foreground"}`}>
                    {r.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row gap-3 pt-2">
          <Button variant="outline" color="primary" className="flex-1" onPress={reset}>
            Tozalash
          </Button>
          <Button className="flex-1" onPress={apply}>
            Qo'llash
          </Button>
        </View>
      </View>
    </Modal>
  );
}
