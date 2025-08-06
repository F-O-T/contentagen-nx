import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { ContentRequestCard } from "@/widgets/content-card/ui/content-card";
import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

export function ContentListPage() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.content.listByUserId.queryOptions());

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.map((item) => (
               <ContentRequestCard key={item.id} request={item} />
            ))}
         </div>
      </main>
   );
}
