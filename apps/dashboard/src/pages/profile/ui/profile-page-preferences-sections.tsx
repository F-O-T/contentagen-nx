import { ThemeToggler } from "@/layout/theme-provider";
import { LanguageSwitcher } from "@/layout/language-switcher";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { WorkflowPreferences } from "./workflow-preferences";

export function PreferencesSection() {
   return (
      <div className="space-y-6">
         <Card>
            <CardHeader>
               <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
               <ThemeToggler />
               <LanguageSwitcher />
            </CardContent>
         </Card>
         <WorkflowPreferences />
      </div>
   );
}
