import { ContentRequestCard } from "./content-card";
import { LoadingContentCard } from "./loading-content-card";
import { useContentList } from "../lib/content-list-context";

const getStatusDisplay = (status: string | null) => {
   if (!status)
      return { label: "Unknown", progress: 0, variant: "secondary" as const };

   const statusConfig = {
      pending: { label: "Pending", progress: 0, variant: "secondary" as const },
      planning: {
         label: "Planning",
         progress: 15,
         variant: "default" as const,
      },
      researching: {
         label: "Researching",
         progress: 35,
         variant: "default" as const,
      },
      writing: { label: "Writing", progress: 60, variant: "default" as const },
      editing: { label: "Editing", progress: 80, variant: "default" as const },
      analyzing: {
         label: "Analyzing",
         progress: 95,
         variant: "default" as const,
      },
      grammar_checking: {
         label: "Grammar Checking",
         progress: 98,
         variant: "default" as const,
      },
      draft: { label: "Draft", progress: 100, variant: "default" as const },
      approved: {
         label: "Approved",
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
            <p className="text-lg">Loading content...</p>
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
                  No content found matching your filters.
               </p>
               <p className="text-sm mt-2">
                  Try adjusting your filter criteria or create new content.
               </p>
            </div>
         )}
      </>
   );
}
