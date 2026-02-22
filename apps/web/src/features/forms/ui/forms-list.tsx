import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ClipboardList, Plus } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import {
   createFormColumns,
   createFormSubComponent,
   FormMobileCard,
   type FormRow,
} from "./form-table-columns";

export function FormsList() {
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug?: string;
      teamSlug?: string;
   };
   const { openAlertDialog } = useAlertDialog();

   const { data: forms, refetch } = useSuspenseQuery(
      orpc.forms.list.queryOptions({}),
   );

   const deleteMutation = useMutation(
      orpc.forms.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Formulário excluído com sucesso");
            refetch();
         },
         onError: () => {
            toast.error("Erro ao excluir formulário");
         },
      }),
   );

   const handleDelete = (form: FormRow) => {
      openAlertDialog({
         title: "Excluir formulário",
         description: `Tem certeza que deseja excluir o formulário "${form.name}"? Esta ação não pode ser desfeita. Todas as submissões associadas também serão removidas.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ id: form.id });
         },
      });
   };

   const resolvedSlug = slug ?? "";
   const resolvedTeamSlug = teamSlug ?? "";

   const columns = useMemo(
      () =>
         createFormColumns({
            slug: resolvedSlug,
            teamSlug: resolvedTeamSlug,
         }),
      [resolvedSlug, resolvedTeamSlug],
   );

   const renderSubComponent = useMemo(
      () =>
         createFormSubComponent({
            onDelete: handleDelete,
            slug: resolvedSlug,
            teamSlug: resolvedTeamSlug,
         }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [resolvedSlug, resolvedTeamSlug],
   );

   if (!forms || forms.length === 0) {
      return (
         <Card>
            <CardContent className="py-12">
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <ClipboardList className="size-12" />
                     </EmptyMedia>
                     <EmptyTitle>Nenhum formulário ainda</EmptyTitle>
                     <EmptyDescription>
                        Crie seu primeiro formulário para começar a coletar
                        dados dos visitantes do seu site.
                     </EmptyDescription>
                     <Button asChild className="mt-4">
                        <Link
                           params={{
                              slug: resolvedSlug,
                              teamSlug: resolvedTeamSlug,
                              formId: "new",
                           }}
                           to="/$slug/$teamSlug/forms/$formId"
                        >
                           <Plus className="mr-2 size-4" />
                           Criar formulário
                        </Link>
                     </Button>
                  </EmptyContent>
               </Empty>
            </CardContent>
         </Card>
      );
   }

   return (
      <DataTable
         columns={columns}
         data={forms}
         getRowId={(row) => row.id}
         renderMobileCard={(props) => (
            <FormMobileCard
               {...props}
               slug={resolvedSlug}
               teamSlug={resolvedTeamSlug}
            />
         )}
         renderSubComponent={renderSubComponent}
      />
   );
}
