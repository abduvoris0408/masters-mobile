import { ActivityIndicator, View } from "react-native";

import { useProfilePerspective } from "@/hooks/useProfilePerspective";
import { ClientEditView } from "./_edit/ClientEditView";
import { MasterEditView } from "./_edit/MasterEditView";
import { OrganizationEditView } from "./_edit/OrganizationEditView";

// Mobile counterpart to the web project's profile-edit page — one screen
// branching by account kind instead of web's separate ClientEditView /
// MasterEditForm components, since RN doesn't need the route split. No
// profile-type switch here (that's what master-onboarding / organization-
// onboarding are for) — this only edits fields already established.
export default function ProfileEditScreen() {
  const { masterProfile, isWorker, isOrganization, organization, isLoading } = useProfilePerspective();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isOrganization) return <OrganizationEditView organizationGuid={organization?.guid ?? null} />;
  if (isWorker && masterProfile) return <MasterEditView profileGuid={masterProfile.guid} />;
  return <ClientEditView />;
}
