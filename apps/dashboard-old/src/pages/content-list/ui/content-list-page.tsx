import { TalkingMascot } from "@/widgets/talking-mascot/ui/talking-mascot";
import { useContentList } from "../lib/use-content-list";
import { ContentRequestCard } from "./content-request-card";

export function ContentListPage() {
   const { requests } = useContentList();

   return (
      <main className="h-full w-full flex flex-col gap-4">
         <TalkingMascot message="Here you can manage all your content requests. Create, edit, or explore your requests below!" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {requests.map((request) => (
               <ContentRequestCard key={request.id} request={request} />
            ))}
         </div>
      </main>
   );
}
