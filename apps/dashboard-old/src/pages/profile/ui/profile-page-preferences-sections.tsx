import { ThemeToggler } from "@/layout/theme-provider";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

export function PreferencesSection() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Preferences</CardTitle>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-4">
            <ThemeToggler />
         </CardContent>
      </Card>
   );
}
