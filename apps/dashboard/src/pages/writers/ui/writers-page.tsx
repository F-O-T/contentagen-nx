import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { ManageWriterForm } from "@/features/writers/ui/manage-writer-form";
import { useSheet } from "@/hooks/use-sheet";
import { WritersListSection } from "./writers-list-section";
import { WritersStats } from "./writers-stats";

export function WritersPage() {
   const { openSheet } = useSheet();

   const handleCreateWriter = () => {
      openSheet({
         children: <ManageWriterForm />,
      });
   };

   return (
      <main className="space-y-6">
         <DefaultHeader
            actions={
               <Button onClick={handleCreateWriter}>
                  <Plus className="size-4" />
                  {"Novo Escritor"}
               </Button>
            }
            description={"Gerencie seus escritores IA"}
            title={"Escritores"}
         />

         <WritersStats />

         <WritersListSection />
      </main>
   );
}
