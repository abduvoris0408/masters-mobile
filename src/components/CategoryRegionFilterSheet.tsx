import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/lib/theme/colors";
import { useAllJobsCategoriesQuery, useRegionsQuery } from "@/services/master";

export interface CategoryRegionFilterValue {
  category: number[];
  region: number | null;
}

interface CategoryRegionFilterSheetProps {
  value: CategoryRegionFilterValue;
  onApply: (value: CategoryRegionFilterValue) => void;
}

export interface CategoryRegionFilterSheetHandle {
  present: () => void;
  dismiss: () => void;
}

// Bottom sheet shared by the Home (elonlar) and Masters catalog feeds — both
// filter on the same category/region dimensions per IApplicationsListFilters
// / IMasterCatalogListFilters; screen-specific extra filters (price/sort)
// can be layered on top later without duplicating this shell.
//
// Built on @gorhom/bottom-sheet, same rationale as MoreSheet.tsx — native
// spring/gesture feel instead of a plain <Modal> slide. Imperative
// present()/dismiss() via ref; `open` (local state, driven by the sheet's
// own onChange) replaces the old `visible` prop as the queries' fetch-gate.
export const CategoryRegionFilterSheet = forwardRef<CategoryRegionFilterSheetHandle, CategoryRegionFilterSheetProps>(
  function CategoryRegionFilterSheet({ value, onApply }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const colors = useThemeColors();
    const [open, setOpen] = useState(false);
    const { data: categories } = useAllJobsCategoriesQuery(open);
    const { data: regions } = useRegionsQuery(open);

    const [category, setCategory] = useState<number[]>(value.category);
    const [region, setRegion] = useState<number | null>(value.region);

    useImperativeHandle(ref, () => ({
      present: () => {
        setCategory(value.category);
        setRegion(value.region);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const toggleCategory = (id: number) => {
      setCategory((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
    };

    const reset = () => {
      setCategory([]);
      setRegion(null);
    };

    const apply = () => {
      onApply({ category, region });
      sheetRef.current?.dismiss();
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
        snapPoints={["75%"]}
        enableDynamicSizing={false}
        onChange={(index) => setOpen(index >= 0)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <View className="px-5">
          <Text className="mb-4 text-lg font-semibold text-foreground">Filtr</Text>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
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
        </BottomSheetScrollView>

        <View className="flex-row gap-3 px-5 pb-4 pt-2">
          <Button variant="outline" color="primary" className="flex-1" onPress={reset}>
            Tozalash
          </Button>
          <Button className="flex-1" onPress={apply}>
            Qo'llash
          </Button>
        </View>
      </BottomSheetModal>
    );
  },
);
