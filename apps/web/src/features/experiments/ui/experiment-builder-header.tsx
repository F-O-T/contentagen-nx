import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import {
   ArrowLeft,
   Ellipsis,
   FlaskConical,
   Loader2,
   Pause,
   Play,
   Save,
   Trash2,
   Trophy,
} from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import type { ExperimentStatus } from "../hooks/use-experiment-config";

export interface ExperimentBuilderHeaderProps {
   name: string;
   onNameChange: (name: string) => void;
   status: ExperimentStatus | null;
   variantCount: number;
   backTo: { slug: string; teamSlug: string };
   onSave: () => void;
   isSaving: boolean;
   onStart?: () => void;
   isStarting?: boolean;
   onPause?: () => void;
   isPausing?: boolean;
   onConclude?: () => void;
   isConcluding?: boolean;
   onDelete?: () => void;
   isDeleting?: boolean;
}

export type { ExperimentStatus };

export function ExperimentBuilderHeader({
   name,
   onNameChange,
   status,
   variantCount,
   backTo,
   onSave,
   isSaving,
   onStart,
   isStarting,
   onPause,
   isPausing,
   onConclude,
   isConcluding,
   onDelete,
   isDeleting,
}: ExperimentBuilderHeaderProps) {
   const { openAlertDialog } = useAlertDialog();

   const isCreateMode = status === null;
   const canStart =
      (status === "draft" || status === "paused") && variantCount >= 2;
   const canStartButNeedsMore =
      (status === "draft" || status === "paused") && variantCount < 2;
   const isRunning = status === "running";
   const isConcluded = status === "concluded";
   const isAnyPending =
      isSaving || isStarting || isPausing || isConcluding || isDeleting;

   const handleDelete = () => {
      openAlertDialog({
         title: "Excluir experimento?",
         description:
            "Esta ação não pode ser desfeita. Todos os dados serão perdidos.",
         actionLabel: "Excluir",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            onDelete?.();
         },
      });
   };

   const handleConclude = () => {
      openAlertDialog({
         title: "Concluir experimento?",
         description:
            "O experimento será marcado como concluído e não coletará mais dados.",
         actionLabel: "Concluir",
         cancelLabel: "Cancelar",
         onAction: async () => {
            onConclude?.();
         },
      });
   };

   return (
      <div className="border-b bg-background sticky top-0 z-10">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        params={backTo as never}
                        to="/$slug/$teamSlug/experiments"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                     <FlaskConical className="size-5 flex-shrink-0 text-muted-foreground" />
                     <InlineEditableText
                        className="text-2xl font-semibold"
                        onSave={onNameChange}
                        placeholder="Nome do experimento"
                        value={name}
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
                  {(isCreateMode ||
                     status === "draft" ||
                     status === "paused") && (
                     <Button
                        disabled={isAnyPending || !name.trim()}
                        onClick={onSave}
                        variant="outline"
                     >
                        {isSaving ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Save className="size-4 mr-2" />
                        )}
                        Salvar
                     </Button>
                  )}

                  {canStart && (
                     <Button disabled={isAnyPending} onClick={onStart}>
                        {isStarting ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Play className="size-4 mr-2" />
                        )}
                        {status === "paused" ? "Retomar" : "Iniciar"}
                     </Button>
                  )}

                  {canStartButNeedsMore && !isCreateMode && (
                     <Button
                        disabled
                        title="Adicione pelo menos 2 variantes para iniciar"
                     >
                        <Play className="size-4 mr-2" />
                        Iniciar
                     </Button>
                  )}

                  {isRunning && (
                     <Button
                        disabled={isAnyPending}
                        onClick={onPause}
                        variant="outline"
                     >
                        {isPausing ? (
                           <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                           <Pause className="size-4 mr-2" />
                        )}
                        Pausar
                     </Button>
                  )}

                  {!isCreateMode && !isConcluded && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button
                              disabled={isAnyPending}
                              size="icon"
                              variant="outline"
                           >
                              <Ellipsis className="size-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {(isRunning || status === "paused") && (
                              <>
                                 <DropdownMenuItem onClick={handleConclude}>
                                    <Trophy className="size-4 mr-2" />
                                    Concluir experimento
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator />
                              </>
                           )}
                           {isRunning ? (
                              <DropdownMenuItem
                                 className="text-muted-foreground"
                                 disabled
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Pause primeiro para excluir
                              </DropdownMenuItem>
                           ) : (
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onClick={handleDelete}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Excluir experimento
                              </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
