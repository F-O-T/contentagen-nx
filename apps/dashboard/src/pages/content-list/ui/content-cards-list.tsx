import { ContentRequestCard } from "./content-card";
import { useContentList } from "../lib/content-list-context";
import { translate } from "@packages/localization";

export function ContentCardsList() {
   const { data } = useContentList();

   if (!data) {
      return (
         <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">
               {translate("pages.content-list.list.loading")}
            </p>
         </div>
      );
   }

   return (
      <>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.items.map((item) => (
               <ContentRequestCard key={item.id} request={item} />
            ))}
         </div>
         {data.items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
               <p className="text-lg">
                  {translate("pages.content-list.list.no-results")}
               </p>
               <p className="text-sm mt-2">
                  {translate("pages.content-list.list.no-results-hint")}
               </p>
            </div>
         )}
      </>
   );
}
