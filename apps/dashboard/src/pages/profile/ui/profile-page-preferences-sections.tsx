import { ThemeToggler } from "@/layout/theme-provider";
import { LanguageToggler } from "@/layout/language-toggler";
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
               <LanguageToggler />
            </CardContent>
         </Card>
         <WorkflowPreferences />
      </div>
   );
}
