import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { GeneratedContentDisplay } from "./generated-content-display";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ContentStatsCard, ContentDetailsCard } from "./request-details-cards";
import { ContentQualityCard } from "./content-quality";

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
      <main className="h-full w-full flex flex-col gap-4">
         <TalkingMascot message="Here's your content request details! You can review, edit, and manage your generated content. Use the export options to get your content in different formats." />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-1 gap-4 flex flex-col">
               <ContentQualityCard content={data} />
               <ContentStatsCard content={data} />
               <ContentDetailsCard content={data} />
            </div>
            <div className="col-span-1 md:col-span-2">
               <GeneratedContentDisplay content={data} />
            </div>
         </div>
      </main>
   );
}
