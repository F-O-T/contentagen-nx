import {
   AlertDialog,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Spinner } from "@packages/ui/components/spinner";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/danger-zone",
)({
   component: OrgDangerZonePage,
});

function OrgDangerZonePage() {
   const { data: activeOrganization } = useSuspenseQuery(
      orpc.organization.getActiveOrganization.queryOptions({}),
   );

   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   if (!activeOrganization || !session) {
      throw new Error("No active organization or session found");
   }

   const currentMember = activeOrganization.members?.find(
      (member) => member.userId === session.user.id,
   );
   const isOwner = currentMember?.role === "owner";

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">
               Zona de Perigo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
               Ações irreversíveis para esta organização. Prossiga com cuidado.
            </p>
         </div>
         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Trash2 className="size-4 text-destructive" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>Deletar organização</ItemTitle>
                  <ItemDescription>
                     Remova permanentemente esta organização, incluindo todos os
                     projetos, membros, dados de conteúdo, formulários e
                     configurações. Esta ação é irreversível.
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  {isOwner ? (
                     <DeleteOrganizationDialog
                        organizationId={activeOrganization.id}
                        organizationName={activeOrganization.name}
                     />
                  ) : (
                     <Tooltip>
                        <TooltipTrigger asChild>
                           {/* biome-ignore lint/a11y/noNoninteractiveTabindex: needed for tooltip on disabled button */}
                           <span tabIndex={0}>
                              <Button disabled size="sm" variant="destructive">
                                 Deletar organização
                              </Button>
                           </span>
                        </TooltipTrigger>
                        <TooltipContent>
                           Apenas o proprietário pode deletar a organização
                        </TooltipContent>
                     </Tooltip>
                  )}
               </ItemActions>
            </Item>
         </ItemGroup>
      </div>
   );
}

function DeleteOrganizationDialog({
   organizationId,
   organizationName,
}: {
   organizationId: string;
   organizationName: string;
}) {
   const navigate = useNavigate();
   const [open, setOpen] = useState(false);
   const [confirmationText, setConfirmationText] = useState("");
   const [isDeleting, startTransition] = useTransition();

   const isConfirmed = confirmationText === organizationName;

   function handleDelete() {
      if (!isConfirmed) return;

      startTransition(async () => {
         const { error } = await authClient.organization.delete({
            organizationId,
         });

         if (error) {
            toast.error("Erro ao deletar organização", {
               description:
                  error.message ||
                  "Ocorreu um erro inesperado. Tente novamente.",
            });
            return;
         }

         toast.success("Organização deletada com sucesso");
         setOpen(false);
         navigate({ to: "/" });
      });
   }

   return (
      <AlertDialog
         onOpenChange={(value) => {
            if (!isDeleting) {
               setOpen(value);
               if (!value) setConfirmationText("");
            }
         }}
         open={open}
      >
         <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
               Deletar organização
            </Button>
         </AlertDialogTrigger>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  Deletar organização permanentemente
               </AlertDialogTitle>
               <AlertDialogDescription asChild>
                  <div className="space-y-3">
                     <p>
                        Esta ação é <strong>permanente e irreversível</strong>.
                        Ao deletar esta organização, todos os dados associados
                        serão removidos, incluindo:
                     </p>
                     <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Todos os projetos e seus conteúdos</li>
                        <li>Membros e convites pendentes</li>
                        <li>Formulários, configurações e integrações</li>
                        <li>Dados de analytics e histórico</li>
                     </ul>
                     <p>
                        Para confirmar, digite o nome da organização{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold">
                           {organizationName}
                        </code>{" "}
                        abaixo:
                     </p>
                  </div>
               </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
               autoComplete="off"
               disabled={isDeleting}
               onChange={(e) => setConfirmationText(e.target.value)}
               placeholder={organizationName}
               value={confirmationText}
            />
            <AlertDialogFooter>
               <AlertDialogCancel disabled={isDeleting}>
                  Cancelar
               </AlertDialogCancel>
               <Button
                  disabled={!isConfirmed || isDeleting}
                  onClick={handleDelete}
                  variant="destructive"
               >
                  {isDeleting && <Spinner className="size-4" />}
                  Deletar organização
               </Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}
