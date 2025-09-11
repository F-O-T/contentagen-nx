import { useCompetitorList } from "../lib/competitor-list-context";
import { CompetitorCard } from "./competitor-card";

export function CompetitorCardsList() {
   const { items } = useCompetitorList();

   if (items.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No competitors found</p>
            <p className="text-sm text-gray-400">
               Add your first competitor to get started
            </p>
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {items.map((competitor) => (
            <CompetitorCard key={competitor.id} competitor={competitor} />
         ))}
      </div>
   );
}
