import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useAlertDialog } from "@/hooks/use-alert-dialog";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/danger-zone",
)({
   component: AccountDangerZonePage,
});

function AccountDangerZonePage() {
   const { openAlertDialog } = useAlertDialog();

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Zona de Perigo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Ações irreversíveis para sua conta. Prossiga com cuidado.
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Trash2 className="size-4 text-destructive" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Deletar conta</ItemTitle>
                  <ItemDescription>
                     Remova permanentemente sua conta e saia de todas as
                     organizações.
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Button
                     onClick={() =>
                        openAlertDialog({
                           title: "Deletar conta",
                           description:
                              "Tem certeza? Esta ação não pode ser desfeita. Todos os dados serão permanentemente removidos.",
                           actionLabel: "Deletar conta",
                           variant: "destructive",
                           onAction: async () => {
                              // TODO: implement
                           },
                        })
                     }
                     size="sm"
                     variant="destructive"
                  >
                     Deletar conta
                  </Button>
               </ItemActions>
            </Item>
         </ItemGroup>
      </div>
   );
}
