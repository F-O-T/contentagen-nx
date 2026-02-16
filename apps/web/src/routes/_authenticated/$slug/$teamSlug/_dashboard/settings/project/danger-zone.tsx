import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/danger-zone",
)({
   component: ProjectDangerZonePage,
});

function ProjectDangerZonePage() {
   const { openAlertDialog } = useAlertDialog();

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Zona de Perigo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Ações irreversíveis para este projeto. Prossiga com cuidado.
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <ArrowRightLeft className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Transferir projeto</ItemTitle>
                  <ItemDescription>
                     Mova este projeto para outra organização.
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Button
                     onClick={() =>
                        openAlertDialog({
                           title: "Transferir projeto",
                           description:
                              "Tem certeza que deseja transferir este projeto para outra organização? Você poderá perder o acesso dependendo das permissões.",
                           actionLabel: "Transferir",
                           onAction: async () => {
                              // TODO: implement
                           },
                        })
                     }
                     size="sm"
                     variant="outline"
                  >
                     Transferir
                  </Button>
               </ItemActions>
            </Item>
            <ItemSeparator />
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Trash2 className="size-4 text-destructive" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Deletar projeto</ItemTitle>
                  <ItemDescription>
                     Remova permanentemente este projeto e todos os seus dados.
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Button
                     onClick={() =>
                        openAlertDialog({
                           title: "Deletar projeto",
                           description:
                              "Tem certeza? Esta ação não pode ser desfeita. Todos os dados serão permanentemente removidos.",
                           actionLabel: "Deletar",
                           variant: "destructive",
                           onAction: async () => {
                              // TODO: implement
                           },
                        })
                     }
                     size="sm"
                     variant="destructive"
                  >
                     Deletar
                  </Button>
               </ItemActions>
            </Item>
         </ItemGroup>
      </div>
   );
}
