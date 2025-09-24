import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Markdown } from "@packages/ui/components/markdown";
// Removed Credenza imports since edit will be inline
import type { ContentSelect } from "@packages/database/schemas/content";
import { EditContentBody } from "../features/edit-content-body";
import { translate } from "@packages/localization";

export function GeneratedContentDisplay({
   content,
   editingBody,
   setEditingBody,
}: {
   content: ContentSelect;
   editingBody: boolean;
   setEditingBody: (editing: boolean) => void;
}) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("pages.content-details.content.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.content-details.content.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {editingBody ? (
               <EditContentBody content={content} setEditing={setEditingBody} />
            ) : (
               <Markdown content={content?.body} />
            )}
         </CardContent>
      </Card>
   );
}
