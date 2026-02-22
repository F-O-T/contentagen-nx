import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Switch } from "@packages/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Crown, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { orpc } from "@/integrations/orpc/client";

type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

interface ExperimentVariantsTabProps {
   experimentId: string;
   status: ExperimentStatus;
   targetType: "content" | "form" | "cluster";
   winnerId: string | null;
}

function AddVariantForm({
   experimentId,
   targetType,
   onClose,
}: {
   experimentId: string;
   targetType: "content" | "form" | "cluster";
   onClose: () => void;
}) {
   const [name, setName] = useState("");
   const [isControl, setIsControl] = useState(false);
   const [linkedId, setLinkedId] = useState("");

   const { data: contentList } = useSuspenseQuery(
      orpc.content.listAllContent.queryOptions({ input: { limit: 100 } }),
   );

   const addMutation = useMutation(
      orpc.experiments.addVariantToExperiment.mutationOptions({
         onSuccess: () => {
            toast.success("Variante adicionada!");
            onClose();
         },
         onError: (err) => {
            toast.error(err.message ?? "Erro ao adicionar variante");
         },
      }),
   );

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      addMutation.mutate({
         experimentId,
         name: name.trim(),
         isControl,
         ...(targetType === "content" && linkedId
            ? { contentId: linkedId }
            : {}),
         ...(targetType === "form" && linkedId ? { formId: linkedId } : {}),
      });
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Nova variante</CredenzaTitle>
            <CredenzaDescription>
               Adicione uma variante ao experimento
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
               <div className="flex flex-col gap-2">
                  <Label htmlFor="variant-name">Nome da variante</Label>
                  <Input
                     autoFocus
                     id="variant-name"
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Ex: Variante A"
                     value={name}
                  />
               </div>

               {targetType === "content" && (
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="variant-content">Conteúdo vinculado</Label>
                     <Select onValueChange={setLinkedId} value={linkedId}>
                        <SelectTrigger id="variant-content">
                           <SelectValue placeholder="Selecione um conteúdo" />
                        </SelectTrigger>
                        <SelectContent>
                           {contentList?.items?.map(
                              (item: { id: string; title?: string | null }) => (
                                 <SelectItem key={item.id} value={item.id}>
                                    {item.title ?? "Sem título"}
                                 </SelectItem>
                              ),
                           )}
                        </SelectContent>
                     </Select>
                  </div>
               )}

               <div className="flex items-center gap-3">
                  <Switch
                     checked={isControl}
                     id="variant-control"
                     onCheckedChange={setIsControl}
                  />
                  <Label className="cursor-pointer" htmlFor="variant-control">
                     Variante de controle
                  </Label>
               </div>

               <CredenzaFooter>
                  <Button
                     disabled={!name.trim() || addMutation.isPending}
                     type="submit"
                  >
                     {addMutation.isPending && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                     )}
                     Adicionar variante
                  </Button>
               </CredenzaFooter>
            </form>
         </CredenzaBody>
      </>
   );
}

export function ExperimentVariantsTab({
   experimentId,
   status,
   targetType,
   winnerId,
}: ExperimentVariantsTabProps) {
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();

   const { data: experiment } = useSuspenseQuery(
      orpc.experiments.getById.queryOptions({
         input: { id: experimentId },
      }),
   );

   const removeMutation = useMutation(
      orpc.experiments.removeVariantFromExperiment.mutationOptions({
         onSuccess: () => toast.success("Variante removida"),
         onError: (err) =>
            toast.error(err.message ?? "Erro ao remover variante"),
      }),
   );

   const canEdit = status === "draft" || status === "paused";

   const handleRemove = (variantId: string, variantName: string) => {
      openAlertDialog({
         title: `Remover variante "${variantName}"?`,
         description:
            "Esta ação não pode ser desfeita. Os dados desta variante serão perdidos.",
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await removeMutation.mutateAsync({ variantId });
         },
      });
   };

   const handleAddVariant = () => {
      openCredenza({
         className: "sm:max-w-md",
         children: (
            <AddVariantForm
               experimentId={experimentId}
               onClose={closeCredenza}
               targetType={targetType}
            />
         ),
      });
   };

   const variants = experiment.variants ?? [];

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
               {variants.length} variante{variants.length !== 1 ? "s" : ""}{" "}
               configurada{variants.length !== 1 ? "s" : ""}
            </p>
            {canEdit && (
               <Button onClick={handleAddVariant} size="sm" variant="outline">
                  <Plus className="mr-2 size-4" />
                  Adicionar variante
               </Button>
            )}
         </div>

         {variants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border rounded-lg border-dashed">
               <p className="text-sm text-muted-foreground">
                  Nenhuma variante configurada ainda.
               </p>
               {canEdit && (
                  <Button
                     onClick={handleAddVariant}
                     size="sm"
                     variant="outline"
                  >
                     <Plus className="mr-2 size-4" />
                     Adicionar primeira variante
                  </Button>
               )}
            </div>
         ) : (
            <div className="flex flex-col gap-2">
               {variants.map((variant) => (
                  <div
                     className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                     key={variant.id}
                  >
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                 {variant.name}
                              </span>
                              {variant.isControl && (
                                 <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    Controle
                                 </span>
                              )}
                              {winnerId === variant.id && (
                                 <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    <Crown className="size-3" />
                                    Vencedor
                                 </span>
                              )}
                           </div>
                           {(variant.contentId ?? variant.formId) && (
                              <span className="text-xs text-muted-foreground">
                                 ID:{" "}
                                 {(variant.contentId ?? variant.formId)?.slice(
                                    0,
                                    8,
                                 )}
                                 …
                              </span>
                           )}
                        </div>
                     </div>
                     {canEdit && (
                        <Button
                           className="size-8 text-destructive hover:text-destructive"
                           disabled={removeMutation.isPending}
                           onClick={() =>
                              handleRemove(variant.id, variant.name)
                           }
                           size="icon"
                           variant="ghost"
                        >
                           {removeMutation.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                           ) : (
                              <Trash2 className="size-4" />
                           )}
                        </Button>
                     )}
                  </div>
               ))}
            </div>
         )}

         {!canEdit && status === "running" && (
            <p className="text-xs text-muted-foreground text-center">
               Variantes não podem ser modificadas enquanto o experimento está
               em execução.
            </p>
         )}
      </div>
   );
}
