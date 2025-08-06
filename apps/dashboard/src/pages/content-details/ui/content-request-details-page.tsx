import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { GeneratedContentDisplay } from "./generated-content-display";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

export function ContentRequestDetailsPage() {
   const { id } = useParams({
      from: "/_dashboard/content/$id",
   });
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.content.get.queryOptions({
         id,
      }),
   );

   return (
      <main className="h-full w-full flex flex-col gap-6">
         <TalkingMascot message="Here's your content request details! You can review, edit, and manage your generated content. Use the export options to get your content in different formats." />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <GeneratedContentDisplay content={data} />
            </div>
         </div>
      </main>
   );
}
