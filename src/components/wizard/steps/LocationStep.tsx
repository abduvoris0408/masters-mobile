import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { MapLocationPicker } from "@/components/MapLocationPicker";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import type { IAddressItem } from "@/types";
import type { SetWizardValue, WizardState } from "../types";

interface LocationStepProps {
  values: WizardState;
  set: SetWizardValue;
  errors: Partial<Record<keyof WizardState, string>>;
  regions?: IAddressItem[];
  regionsLoading: boolean;
  districts?: IAddressItem[];
  districtsLoading: boolean;
}

export function LocationStep({ values, set, errors, regions, regionsLoading, districts, districtsLoading }: LocationStepProps) {
  const { t } = useTranslation("orders");
  const selectedRegion = regions?.find((r) => r.guid === values.region);
  const selectedDistrict = districts?.find((d) => d.guid === values.district);

  return (
    <View className="gap-3">
      <MapLocationPicker
        value={values.latitude != null && values.longitude != null ? { lat: values.latitude, lng: values.longitude } : null}
        onChange={({ lat, lng }) => {
          set("latitude", lat);
          set("longitude", lng);
        }}
        onAddressResolved={(resolved) => {
          if (resolved.address) set("address", resolved.address);
          const matchedRegion = regions?.find((r) => r.name === resolved.regionName);
          if (matchedRegion) {
            set("region", matchedRegion.guid);
            set("district", null);
          }
        }}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <PickerField
            label={t("wizard_region_label")}
            placeholder={t("wizard_select_placeholder")}
            loading={regionsLoading}
            value={selectedRegion?.name ?? null}
            options={(regions ?? []).map((r) => ({ value: r.guid, label: r.name }))}
            onSelect={(guid) => {
              set("region", guid);
              set("district", null);
            }}
          />
        </View>
        <View className="flex-1">
          <PickerField
            label={t("wizard_district_label")}
            placeholder={t("wizard_select_placeholder")}
            loading={districtsLoading}
            disabled={!values.region}
            value={selectedDistrict?.name ?? null}
            options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
            onSelect={(guid) => set("district", guid)}
          />
        </View>
      </View>
      <TextField
        label={t("field_address")}
        placeholder={t("wizard_address_placeholder")}
        value={values.address}
        onChangeText={(v) => set("address", v)}
        error={errors.address}
      />
    </View>
  );
}
