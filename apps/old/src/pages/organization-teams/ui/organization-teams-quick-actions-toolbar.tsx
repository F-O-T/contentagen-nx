import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { useSheet } from "@/hooks/use-sheet";

export function TeamsQuickActionsToolbar() {
   const { openSheet } = useSheet();

   return (
      <Button onClick={() => openSheet({ children: <CreateTeamForm /> })}>
         <Plus className="size-4" />
         {"Criar Equipe"}
      </Button>
   );
}
