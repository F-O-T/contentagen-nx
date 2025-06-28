import {
   Card,
   CardHeader,
   CardTitle,
   CardDescription,
   CardContent,
} from "@packages/ui/components/card";
import { betterAuthClient } from "@/integrations/better-auth";
import { InfoItem } from "@packages/ui/components/info-item";
import { User as UserIcon, Mail as MailIcon } from "lucide-react";

export function ProfileInformation() {
   const { data: session } = betterAuthClient.useSession();

   return (
      <Card>
         <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
               Update your personal information and account details.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <InfoItem
               label="Name"
               value={session?.user?.name || "—"}
               icon={<UserIcon size={16} />}
            />
            <InfoItem
               label="Email"
               value={session?.user?.email || "—"}
               icon={<MailIcon size={16} />}
            />
         </CardContent>
      </Card>
   );
}

