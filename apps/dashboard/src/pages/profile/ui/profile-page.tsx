import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { translate } from "@packages/localization";
import { ProfilePageBilling } from "./profile-page-billing";
import { ProfileInformation } from "./profile-page-informations-section";
import { PreferencesSection } from "./profile-page-preferences-sections";
import { ProfilePageSessionsSection } from "./profile-page-sessions-section";

export function ProfilePage() {
   return (
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message={translate("pages.profile.mascot-message")} />
         <ProfileInformation />
         <ProfilePageBilling />
         <ProfilePageSessionsSection />
         <PreferencesSection />
      </main>
   );
}
