import { betterAuthClient } from "@/integrations/better-auth";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";

export const Route = createFileRoute("/_dashboard/profile/")({
   component: ProfilePage,
});

function ProfilePage() {
   const { data: session } = betterAuthClient.useSession();
   const [activeTab, setActiveTab] = useState("profile");

   const [profileData, setProfileData] = useState({
      firstName: session?.user?.name?.split(" ")[0] || "",
      lastName: session?.user?.name?.split(" ")[1] || "",
      email: session?.user?.email || "",
      company: "",
   });

   const handleSaveProfile = async () => {};

   return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
         <section className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                     Update your personal information and account details.
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                           id="firstName"
                           value={profileData.firstName}
                           onChange={(e) =>
                              setProfileData((prev) => ({
                                 ...prev,
                                 firstName: e.target.value,
                              }))
                           }
                        />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                           id="lastName"
                           value={profileData.lastName}
                           onChange={(e) =>
                              setProfileData((prev) => ({
                                 ...prev,
                                 lastName: e.target.value,
                              }))
                           }
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                           setProfileData((prev) => ({
                              ...prev,
                              email: e.target.value,
                           }))
                        }
                     />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="company">Company (Optional)</Label>
                     <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) =>
                           setProfileData((prev) => ({
                              ...prev,
                              company: e.target.value,
                           }))
                        }
                     />
                  </div>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
               </CardContent>
            </Card>
         </section>
         <section className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Billing</CardTitle>
               </CardHeader>
               <CardContent>
                  <Button>Billing</Button>
               </CardContent>
            </Card>
         </section>
         <section className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Preferences</CardTitle>
               </CardHeader>
               <CardContent>
                  <SquaredIconButton aria-label="Toggle theme" />
               </CardContent>
            </Card>
         </section>
      </div>
   );
}
