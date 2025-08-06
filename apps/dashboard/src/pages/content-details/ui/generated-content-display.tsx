import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
import type { ContentSelect } from "@packages/database/schemas/content";

export function GeneratedContentDisplay({
   content,
}: {
   content: ContentSelect;
}) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
               Your AI-generated content with export and edit options
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Markdown content={content?.body} />
         </CardContent>
      </Card>
   );
}
