import { ContentRequestCard } from "./content-card";
import { LoadingContentCard } from "./loading-content-card";
import { useContentList } from "../lib/content-list-context";
import { translate } from "@packages/localization";

const getStatusDisplay = (status: string | null) => {
   if (!status)
      return {
         label: translate("pages.content-list.status.unknown"),
         progress: 0,
         variant: "secondary" as const,
      };

   const statusConfig = {
      pending: {
         label: translate("pages.content-list.status.pending"),
         progress: 0,
         variant: "secondary" as const,
      },
      planning: {
         label: translate("pages.content-list.status.planning"),
         progress: 15,
         variant: "default" as const,
      },
      researching: {
         label: translate("pages.content-list.status.researching"),
         progress: 35,
         variant: "default" as const,
      },
      writing: {
         label: translate("pages.content-list.status.writing"),
         progress: 60,
         variant: "default" as const,
      },
      editing: {
         label: translate("pages.content-list.status.editing"),
         progress: 80,
         variant: "default" as const,
      },
      analyzing: {
         label: translate("pages.content-list.status.analyzing"),
         progress: 95,
         variant: "default" as const,
      },
      grammar_checking: {
         label: translate("pages.content-list.status.grammar-checking"),
         progress: 98,
         variant: "default" as const,
      },
      draft: {
         label: translate("pages.content-list.status.draft"),
         progress: 100,
         variant: "default" as const,
      },
      approved: {
         label: translate("pages.content-list.status.approved"),
         progress: 100,
         variant: "destructive" as const,
      },
   };

   return (
      statusConfig[status as keyof typeof statusConfig] || {
         label: status,
         progress: 0,
         variant: "secondary" as const,
      }
   );
};

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
            {data.items.map((item) => {
               const isGenerating =
                  item.status &&
                  [
                     "pending",
                     "planning",
                     "researching",
                     "writing",
                     "editing",
                     "analyzing",
                     "grammar_checking",
                  ].includes(item.status);

               if (isGenerating) {
                  const statusInfo = getStatusDisplay(item.status);
                  return (
                     <LoadingContentCard
                        key={item.id}
                        status={item.status}
                        progress={statusInfo.progress}
                     />
                  );
               }

               return <ContentRequestCard key={item.id} request={item} />;
            })}
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
