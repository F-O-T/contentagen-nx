import { Badge } from "@packages/ui/components/badge";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpFromLine } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/analytics/data-management/destinations",
)({
   component: DestinationsPage,
});

function DestinationsPage() {
   return (
      <div className="flex flex-col gap-6">
         <div>
            <h2 className="text-2xl font-bold tracking-tight">Destinos</h2>
            <p className="text-muted-foreground">
               Configure para onde os dados processados serão enviados
            </p>
         </div>

         <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-muted">
               <ArrowUpFromLine className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
               <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg font-semibold">Destinos</h3>
                  <Badge variant="secondary">Em breve</Badge>
               </div>
               <p className="text-sm text-muted-foreground max-w-sm">
                  Configure destinos como data warehouses, plataformas de
                  analytics e ferramentas de BI para receber seus dados
                  processados.
               </p>
            </div>
         </div>
      </div>
   );
}
