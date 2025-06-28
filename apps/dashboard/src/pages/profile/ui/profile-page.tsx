import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ProfileInformation } from "./profile-page-informations-section";
import { PreferencesSection } from "./profile-page-preferences-sections";

export function ProfilePage() {
   return (
      <main className="flex flex-col h-full w-full gap-4 ">
         <TalkingMascot message="Welcome to your profile! Update your details, manage billing, and set your preferences below." />
         <ProfileInformation />
         <PreferencesSection />
      </main>
   );
}
