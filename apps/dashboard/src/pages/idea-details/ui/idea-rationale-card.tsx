import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import { translate } from "@packages/localization";
import type { IdeaSelect } from "@packages/database/schema";

interface IdeaRationaleCardProps {
   idea: IdeaSelect;
}

export function IdeaRationaleCard({ idea }: IdeaRationaleCardProps) {
   const rationale = idea.confidence?.rationale;

   if (!rationale) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.idea-details.rationale.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.idea-details.rationale.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Markdown content={rationale} />
         </CardContent>
      </Card>
   );
}
