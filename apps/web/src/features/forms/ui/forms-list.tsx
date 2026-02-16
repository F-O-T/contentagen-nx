import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   ClipboardList,
   Edit,
   Inbox,
   MoreHorizontal,
   Plus,
   Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

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

   const handleDelete = (id: string, name: string) => {
      openAlertDialog({
         title: "Excluir formulário",
         description: `Tem certeza que deseja excluir o formulário "${name}"? Esta ação não pode ser desfeita. Todas as submissões associadas também serão removidas.`,
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({ id });
         },
      });
   };

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
                              slug: slug || "",
                              teamSlug: teamSlug || "",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {forms.map((form) => (
            <Card className="flex flex-col" key={form.id}>
               <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                  <div className="min-w-0 flex-1 space-y-1">
                     <CardTitle className="text-base font-medium truncate">
                        {form.name}
                     </CardTitle>
                     {form.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                           {form.description}
                        </CardDescription>
                     )}
                  </div>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           className="size-8 flex-shrink-0"
                           size="icon"
                           variant="ghost"
                        >
                           <MoreHorizontal className="size-4" />
                           <span className="sr-only">Abrir menu</span>
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                           <Link
                              params={{
                                 slug: slug || "",
                                 teamSlug: teamSlug || "",
                                 formId: form.id,
                              }}
                              to="/$slug/$teamSlug/forms/$formId"
                           >
                              <Edit className="mr-2 size-4" />
                              Editar
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link
                              params={{
                                 slug: slug || "",
                                 teamSlug: teamSlug || "",
                                 formId: form.id,
                              }}
                              to="/$slug/$teamSlug/forms/$formId/submissions"
                           >
                              <Inbox className="mr-2 size-4" />
                              Submissões
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           className="text-destructive"
                           onClick={() => handleDelete(form.id, form.name)}
                        >
                           <Trash2 className="mr-2 size-4" />
                           Excluir
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardHeader>
               <CardContent className="flex-1 pt-0">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                     <span>
                        {form.fields.length}{" "}
                        {form.fields.length === 1 ? "campo" : "campos"}
                     </span>
                     <span className="text-border">|</span>
                     <span>
                        {form.submissionCount}{" "}
                        {form.submissionCount === 1
                           ? "submissão"
                           : "submissões"}
                     </span>
                  </div>
                  <div className="mt-3">
                     <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Ativo" : "Inativo"}
                     </Badge>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
   );
}
