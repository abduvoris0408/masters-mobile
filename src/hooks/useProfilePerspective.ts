import { useMyOrganizationQuery } from "@/services/organization";
import { useMasterProfileQuery } from "@/services/master";
import { EProfileType } from "@/types";

// Single source of truth for "what kind of account is this" — mirrors the
// web project's useProfileManageData: masterProfile.type is the real
// individual-vs-organization discriminant (EUserType.WORKER alone can't tell
// them apart, an org owner is also user_type WORKER). Every role-aware
// screen should read isOrganization from here instead of re-deriving it.
export function useProfilePerspective() {
  const { data: profile, isLoading: profileLoading } = useMasterProfileQuery();
  const masterProfile = profile?.master_profile ? profile : null;
  const isWorker = !!masterProfile;
  const isOrganization = masterProfile?.type === EProfileType.ORGANIZATION;
  const isIndividualMaster = isWorker && !isOrganization;

  const { data: organization, isLoading: organizationLoading } = useMyOrganizationQuery(isOrganization);

  return {
    masterProfile,
    profileGuid: masterProfile?.guid ?? null,
    isWorker,
    isOrganization,
    isIndividualMaster,
    organization: isOrganization ? (organization ?? null) : null,
    organizationGuid: isOrganization ? (organization?.guid ?? null) : null,
    isLoading: profileLoading || (isOrganization && organizationLoading),
  };
}
