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
import { Separator } from "@packages/ui/components/separator";
import { Switch } from "@packages/ui/components/switch";
import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_dashboard/profile/preferences/")({
   component: PreferencesPage,
});

export function PreferencesPage() {
   const [preferences, setPreferences] = useState({
      usageAlerts: true,
      billingNotifications: true,
      productUpdates: true,
      defaultWordCount: 1000,
      defaultTone: "professional",
   });

   const handleSavePreferences = () => {
      console.log(preferences);
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center">
               <Settings className="h-5 w-5 mr-2" />
               Account Preferences
            </CardTitle>
            <CardDescription>
               Customize your account settings and preferences.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <div>
               <h4 className="font-medium mb-3">Email Notifications</h4>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-medium">Usage Alerts</p>
                        <p className="text-sm text-muted-foreground">
                           Get notified when approaching plan limits
                        </p>
                     </div>
                     <Switch
                        checked={preferences.usageAlerts}
                        onCheckedChange={(checked) =>
                           setPreferences((prev) => ({
                              ...prev,
                              usageAlerts: checked,
                           }))
                        }
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-medium">
                           Billing Notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                           Receive billing and payment notifications
                        </p>
                     </div>
                     <Switch
                        checked={preferences.billingNotifications}
                        onCheckedChange={(checked) =>
                           setPreferences((prev) => ({
                              ...prev,
                              billingNotifications: checked,
                           }))
                        }
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-sm font-medium">Product Updates</p>
                        <p className="text-sm text-muted-foreground">
                           Stay updated on new features and improvements
                        </p>
                     </div>
                     <Switch
                        checked={preferences.productUpdates}
                        onCheckedChange={(checked) =>
                           setPreferences((prev) => ({
                              ...prev,
                              productUpdates: checked,
                           }))
                        }
                     />
                  </div>
               </div>
            </div>

            <Separator />

            <div>
               <h4 className="font-medium mb-3">Default Settings</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <Label htmlFor="defaultWordCount">
                        Default Word Count
                     </Label>
                     <Input
                        id="defaultWordCount"
                        type="number"
                        value={preferences.defaultWordCount}
                        onChange={(e) =>
                           setPreferences((prev) => ({
                              ...prev,
                              defaultWordCount:
                                 parseInt(e.target.value) || 1000,
                           }))
                        }
                     />
                  </div>
                  <div>
                     <Label htmlFor="defaultTone">Default Tone</Label>
                     <select
                        className="w-full p-2 border rounded-md bg-background border-border"
                        value={preferences.defaultTone}
                        onChange={(e) =>
                           setPreferences((prev) => ({
                              ...prev,
                              defaultTone: e.target.value,
                           }))
                        }
                     >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="conversational">Conversational</option>
                     </select>
                  </div>
               </div>
            </div>

            <Button onClick={handleSavePreferences}>Save Preferences</Button>
         </CardContent>
      </Card>
   );
}
