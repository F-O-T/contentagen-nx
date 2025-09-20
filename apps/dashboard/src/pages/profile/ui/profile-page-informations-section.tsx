import { useState } from "react";
import { translate } from "@packages/localization";

import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { Button } from "@packages/ui/components/button";
import {
   Avatar,
   AvatarImage,
   AvatarFallback,
} from "@packages/ui/components/avatar";
import {
   MoreHorizontal,
   Mail as MailIcon,
   KeyIcon,
   User as UserIcon,
} from "lucide-react";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@packages/ui/components/dropdown-menu";
import { UpdateEmailForm } from "../features/update-email-form";
import { UpdatePasswordForm } from "../features/update-password-form";
import { UpdateProfileForm } from "../features/update-profile-form";
import { betterAuthClient } from "@/integrations/clients";
import { InfoItem } from "@packages/ui/components/info-item";

export function ProfileInformation() {
   const { data: session } = betterAuthClient.useSession();
   const [showEmailModal, setShowEmailModal] = useState(false);
   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [showProfileModal, setShowProfileModal] = useState(false);

   // Helper for avatar fallback
   const getInitials = (name: string, email: string) => {
      if (name) {
         return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
      }
      return email ? email.slice(0, 2).toUpperCase() : "?";
   };

   return (
      <>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
               <div>
                  <CardTitle>
                     {translate("pages.profile.information.title")}
                  </CardTitle>
                  <CardDescription>
                     {translate("pages.profile.information.description")}
                  </CardDescription>
               </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                           {translate("pages.profile.information.more-options")}
                        </span>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => setShowEmailModal(true)}>
                        <MailIcon className="h-4 w-4" />
                        {translate(
                           "pages.profile.information.actions.update-email",
                        )}
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={() => setShowPasswordModal(true)}
                     >
                        <KeyIcon className="h-4 w-4" />
                        {translate(
                           "pages.profile.information.actions.update-password",
                        )}
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        onClick={() => setShowProfileModal(true)}
                     >
                        <UserIcon className="h-4 w-4" />
                        {translate(
                           "pages.profile.information.actions.update-profile",
                        )}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 md:flex-row">
               <Avatar className="h-20 w-20">
                  <AvatarImage
                     src={session?.user?.image || undefined}
                     alt={session?.user?.name || "Profile picture"}
                  />
                  <AvatarFallback className="text-lg">
                     {getInitials(
                        session?.user?.name || "",
                        session?.user?.email || "",
                     )}
                  </AvatarFallback>
               </Avatar>
               <div className="flex flex-col gap-4 w-full h-full">
                  <InfoItem
                     icon={<UserIcon className="h-4 w-4" />}
                     label={translate("pages.profile.information.fields.name")}
                     value={
                        session?.user?.name ||
                        translate("pages.profile.information.fields.anonymous")
                     }
                     className="normal-case"
                  />
                  <InfoItem
                     icon={<MailIcon className="h-4 w-4" />}
                     label={translate("pages.profile.information.fields.email")}
                     value={
                        session?.user?.email ||
                        translate("pages.profile.information.fields.no-email")
                     }
                     className="normal-case"
                  />
               </div>
            </CardContent>
         </Card>
         <UpdateEmailForm
            open={showEmailModal}
            onOpenChange={setShowEmailModal}
            currentEmail={session?.user?.email || ""}
         />
         <UpdatePasswordForm
            open={showPasswordModal}
            onOpenChange={setShowPasswordModal}
         />
         <UpdateProfileForm
            open={showProfileModal}
            onOpenChange={setShowProfileModal}
            currentName={session?.user?.name || ""}
            currentImage={session?.user?.image || ""}
         />
      </>
   );
}
