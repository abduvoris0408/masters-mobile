import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PressableCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PickerField } from "@/components/ui/PickerField";
import { TextField } from "@/components/ui/TextField";
import { CardTitle, ScreenTitle, SectionTitle } from "@/components/ui/Typography";
import { useHeaderHeight } from "@/components/ui/useHeaderHeight";
import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { useThemeColors } from "@/lib/theme/colors";
import { GOLOS_WEIGHTS } from "@/lib/theme/fonts";
import {
  useAllJobsCategoriesQuery,
  useCountriesQuery,
  useDistrictsQuery,
  useExperienceLevelsQuery,
  useRegionsQuery,
} from "@/services/master";
import {
  useOrganizationMemberDetailQuery,
  useOrganizationMembersQuery,
  useRegisterOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,
  useUpdateOrganizationMemberServiceMutation,
} from "@/services/organization";
import type { IOrganizationMemberService, IOrganizationMemberSummary } from "@/types";
import { formatPhoneNumber } from "@/utils/format";
import { showError, showSuccess } from "@/utils/toast";

interface AddSpecialistSheetHandle {
  present: () => void;
}

const AddSpecialistSheet = forwardRef<AddSpecialistSheetHandle, { organizationId: number }>(
  function AddSpecialistSheet({ organizationId }, ref) {
    const { t } = useTranslation("profile");
    const colors = useThemeColors();
    const sheetRef = useRef<BottomSheetModal>(null);

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [baseCategoryGuid, setBaseCategoryGuid] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [experienceLevelId, setExperienceLevelId] = useState<number | null>(null);
    const [regionGuid, setRegionGuid] = useState<string | null>(null);
    const [districtGuid, setDistrictGuid] = useState<string | null>(null);

    const { data: categories, isLoading: categoriesLoading } = useAllJobsCategoriesQuery();
    const { data: experienceLevels, isLoading: experienceLoading } = useExperienceLevelsQuery();
    const { data: countries } = useCountriesQuery();
    const { data: regions, isLoading: regionsLoading } = useRegionsQuery();
    const { data: districts, isLoading: districtsLoading } = useDistrictsQuery(regionGuid);

    const registerMutation = useRegisterOrganizationMemberMutation();

    useImperativeHandle(ref, () => ({
      present: () => {
        setName("");
        setSurname("");
        setPhone("");
        setPassword("");
        setBaseCategoryGuid(null);
        setCategoryId(null);
        setExperienceLevelId(null);
        setRegionGuid(null);
        setDistrictGuid(null);
        sheetRef.current?.present();
      },
    }));

    const selectedCategory = categories?.find((c) => c.id === categoryId);
    const selectedExperience = experienceLevels?.find((e) => e.id === experienceLevelId);
    const selectedRegion = regions?.find((r) => r.guid === regionGuid);
    const selectedDistrict = districts?.find((d) => d.guid === districtGuid);

    const canSubmit = name.trim() !== "" && surname.trim() !== "" && phone.length === 13 && password.length >= 6;

    const handleSubmit = async () => {
      if (!canSubmit) return;
      try {
        await registerMutation.mutateAsync({
          organization: organizationId,
          phone,
          password,
          password2: password,
          name: name.trim(),
          surname: surname.trim(),
          categories: categoryId ? [categoryId] : [],
          experience_level: experienceLevelId ?? undefined,
          country: countries?.[0]?.id,
          region: regions?.find((r) => r.guid === regionGuid)?.id,
          district: districts?.find((d) => d.guid === districtGuid)?.id,
        });
        showSuccess(t("specialists_added"));
        sheetRef.current?.dismiss();
      } catch {
        showError(t("add_error"));
      }
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
        snapPoints={["90%"]}
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <View className="px-5">
          <ScreenTitle className="mb-4">{t("specialists_add_title")}</ScreenTitle>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          <Text className="text-xs text-muted">
            {t("specialists_add_hint")}
          </Text>

          <TextField label={t("first_name")} placeholder={t("first_name")} value={name} onChangeText={setName} />
          <TextField label={t("last_name")} placeholder={t("last_name")} value={surname} onChangeText={setSurname} />
          <PhoneInput label={t("phone_number")} value={phone} onChange={setPhone} />
          <TextField label={t("password")} placeholder={t("password_hint_min_chars")} value={password} onChangeText={setPassword} secureToggle secureTextEntry />

          <PickerField
            label={t("service_category_optional")}
            placeholder={t("service_category_placeholder")}
            loading={categoriesLoading}
            value={selectedCategory?.name ?? null}
            options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            onSelect={(v) => setCategoryId(Number(v))}
          />

          <PickerField
            label={t("experience_level_optional")}
            placeholder={t("experience_level_placeholder")}
            loading={experienceLoading}
            value={selectedExperience?.name ?? null}
            options={(experienceLevels ?? []).map((e) => ({ value: String(e.id), label: e.name }))}
            onSelect={(v) => setExperienceLevelId(Number(v))}
          />

          <PickerField
            label={t("region_optional")}
            placeholder={t("region_placeholder")}
            loading={regionsLoading}
            value={selectedRegion?.name ?? null}
            options={(regions ?? []).map((r) => ({ value: r.guid, label: r.name }))}
            onSelect={(guid) => {
              setRegionGuid(guid);
              setDistrictGuid(null);
            }}
          />

          {regionGuid ? (
            <PickerField
              label={t("district_optional")}
              placeholder={t("district_placeholder")}
              loading={districtsLoading}
              value={selectedDistrict?.name ?? null}
              options={(districts ?? []).map((d) => ({ value: d.guid, label: d.name }))}
              onSelect={setDistrictGuid}
            />
          ) : null}

          <Button className="mt-2" loading={registerMutation.isPending} disabled={!canSubmit} onPress={handleSubmit}>
            {t("add")}
          </Button>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

function ServiceEditRow({
  service,
  onSave,
  saving,
}: {
  service: IOrganizationMemberService;
  onSave: (price: string, isPublished: boolean) => void;
  saving: boolean;
}) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const [price, setPrice] = useState(service.price);
  const [isPublished, setIsPublished] = useState(service.is_published);

  return (
    <View className="gap-2.5 rounded-2xl bg-background p-3.5">
      {service.service_name ? <CardTitle>{service.service_name}</CardTitle> : null}
      <Pressable onPress={() => setIsPublished((v) => !v)} className="flex-row items-center gap-2">
        <Ionicons name={isPublished ? "checkbox" : "square-outline"} size={18} color={isPublished ? colors.accent : colors.muted} />
        <Text className="text-xs text-muted">{t("specialists_show")}</Text>
      </Pressable>
      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center rounded-xl bg-surface px-3">
          <TextField
            value={price}
            onChangeText={setPrice}
            editable={isPublished}
            keyboardType="number-pad"
            placeholder={t("services_price")}
            style={{ height: 40, fontSize: 14 }}
          />
        </View>
        <Pressable
          onPress={() => onSave(price, isPublished)}
          disabled={saving}
          className="items-center justify-center rounded-xl bg-accent px-3.5 py-2.5"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

interface MemberDetailSheetHandle {
  present: (guid: string) => void;
}

const MemberDetailSheet = forwardRef<MemberDetailSheetHandle>(function MemberDetailSheet(_props, ref) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [guid, setGuid] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    present: (nextGuid) => {
      setGuid(nextGuid);
      sheetRef.current?.present();
    },
  }));

  const { data: member, isLoading } = useOrganizationMemberDetailQuery(guid);
  const updateServiceMutation = useUpdateOrganizationMemberServiceMutation(guid ?? "");
  const removeMutation = useRemoveOrganizationMemberMutation();
  const [savingServiceGuid, setSavingServiceGuid] = useState<string | null>(null);

  const handleSaveService = async (service: IOrganizationMemberService, price: string, isPublished: boolean) => {
    setSavingServiceGuid(service.guid);
    try {
      await updateServiceMutation.mutateAsync({ serviceGuid: service.guid, data: { price, is_published: isPublished } });
      showSuccess(t("specialists_service_saved"));
    } catch {
      showError(t("edit_save_error"));
    } finally {
      setSavingServiceGuid(null);
    }
  };

  const handleRemove = () => {
    if (!guid) return;
    Alert.alert(t("specialists_remove_title"), t("specialists_remove_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("specialists_remove_action"),
        style: "destructive",
        onPress: async () => {
          try {
            await removeMutation.mutateAsync(guid);
            showSuccess(t("specialists_removed"));
            sheetRef.current?.dismiss();
          } catch {
            showError(t("action_error"));
          }
        },
      },
    ]);
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  const fullName = member ? [member.name, member.surname, member.middle_name].filter(Boolean).join(" ") : "";
  const address = member ? [member.country, member.region, member.district].filter(Boolean).join(", ") : "";

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["85%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      {isLoading || !member ? (
        <ActivityIndicator className="mt-10" color={colors.accent} />
      ) : (
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
          <View className="flex-row items-center gap-3">
            <Avatar uri={member.photo} name={fullName} size={56} />
            <View className="flex-1">
              <SectionTitle>{fullName}</SectionTitle>
              <Text className="text-xs text-muted">{formatPhoneNumber(member.phone)}</Text>
              {address ? <Text className="text-xs text-muted">{address}</Text> : null}
            </View>
          </View>

          {member.description ? <Text className="text-sm text-muted">{member.description}</Text> : null}

          <Pressable
            onPress={handleRemove}
            disabled={removeMutation.isPending}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 dark:bg-danger/15"
          >
            {removeMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="person-remove-outline" size={16} color={colors.danger} />
            )}
            <Text className="text-sm text-danger" style={{ fontFamily: GOLOS_WEIGHTS.bold }}>
              {t("specialists_remove_action")}
            </Text>
          </Pressable>

          <CardTitle>{t("specialists_services_and_prices")}</CardTitle>

          {member.services.length === 0 ? (
            <Text className="text-xs text-muted">{t("specialists_no_services")}</Text>
          ) : (
            <View className="gap-2.5">
              {member.services.map((service) => (
                <ServiceEditRow
                  key={service.guid}
                  service={service}
                  saving={savingServiceGuid === service.guid}
                  onSave={(price, isPublished) => handleSaveService(service, price, isPublished)}
                />
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
});

function MemberCard({ member, onPress }: { member: IOrganizationMemberSummary; onPress: () => void }) {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const fullName = `${member.name} ${member.surname}`.trim();

  return (
    <PressableCard onPress={onPress} className="flex-row items-center gap-3">
      <Avatar uri={member.photo} name={fullName} size={48} />
      <View className="flex-1 gap-0.5">
        <CardTitle numberOfLines={1}>{fullName}</CardTitle>
        <Text className="text-xs text-muted">{formatPhoneNumber(member.phone)}</Text>
        <Text className="text-xs text-muted">{t("specialists_service_count", { count: member.services.length })}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </PressableCard>
  );
}

export default function OrganizationSpecialistsScreen() {
  const { t } = useTranslation("profile");
  const colors = useThemeColors();
  const headerHeight = useHeaderHeight();
  const { isOrganization, organization } = useProfilePerspective();

  const { data: members, isLoading, refetch, isFetching } = useOrganizationMembersQuery(isOrganization);

  const addSheetRef = useRef<AddSpecialistSheetHandle>(null);
  const detailSheetRef = useRef<MemberDetailSheetHandle>(null);

  return (
    <View className="flex-1 bg-background">
      <Header
        title={t("specialists_title")}
        onBackPress={() => router.back()}
        right={
          <Pressable onPress={() => addSheetRef.current?.present()} hitSlop={8}>
            <Ionicons name="person-add" size={22} color={colors.accent} />
          </Pressable>
        }
      />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: headerHeight + 24 }} />
      ) : !members?.length ? (
        <View style={{ flex: 1, paddingTop: headerHeight }}>
          <EmptyState
            icon="people-outline"
            title={t("specialists_empty_title")}
            description={t("specialists_empty_description")}
            actionLabel={t("specialists_add_action")}
            onAction={() => addSheetRef.current?.present()}
          />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.guid}
          contentContainerClassName="gap-2.5 px-4 pb-8"
          contentContainerStyle={{ paddingTop: headerHeight + 12 }}
          renderItem={({ item }) => <MemberCard member={item} onPress={() => detailSheetRef.current?.present(item.guid)} />}
          onRefresh={refetch}
          refreshing={isFetching}
        />
      )}

      <AddSpecialistSheet ref={addSheetRef} organizationId={organization?.id ?? 0} />
      <MemberDetailSheet ref={detailSheetRef} />
    </View>
  );
}
