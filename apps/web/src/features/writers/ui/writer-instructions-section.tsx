import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
   BookOpen,
   CheckCircle2,
   Loader2,
   Plus,
   Trash2,
   XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

interface WriterInstructionsSectionProps {
   writerId: string;
   instructions: InstructionMemoryItem[];
}

const TIPS = [
   { type: "good" as const, text: "Use sempre Contentta com dois t's" },
   { type: "good" as const, text: "Inclua um CTA no final de cada artigo" },
   { type: "bad" as const, text: "Escreva bem", reason: "muito vago" },
   { type: "bad" as const, text: "Seja criativo", reason: "sem ação clara" },
];

function AddInstructionForm({ writerId }: { writerId: string }) {
   const [title, setTitle] = useState("");
   const [content, setContent] = useState("");

   const mutation = useMutation(
      orpc.writer.addInstruction.mutationOptions({
         onSuccess: () => {
            toast.success("Instrução adicionada");
            setTitle("");
            setContent("");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao adicionar instrução");
         },
      }),
   );

   const canSubmit = title.trim().length > 0 && content.trim().length > 0;

   function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!canSubmit) return;
      mutation.mutate({
         writerId,
         instruction: { title, content, enabled: true },
      });
   }

   return (
      <div className="space-y-4">
         <div className="space-y-0.5">
            <p className="text-sm font-semibold">Nova instrução</p>
            <p className="text-xs text-muted-foreground">
               Seja específico — o agente segue instruções literalmente.
            </p>
         </div>

         <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
               <Label htmlFor="instruction-title">Título</Label>
               <Input
                  id="instruction-title"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Tom formal para artigos técnicos"
                  value={title}
               />
            </div>
            <div className="space-y-1.5">
               <Label htmlFor="instruction-content">Instrução</Label>
               <Textarea
                  className="min-h-[100px] resize-none"
                  id="instruction-content"
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva com clareza e especificidade..."
                  value={content}
               />
            </div>
            <Button
               className="w-full"
               disabled={mutation.isPending || !canSubmit}
               size="sm"
               type="submit"
            >
               {mutation.isPending ? (
                  <>
                     <Loader2 className="size-3.5 animate-spin" />
                     Adicionando...
                  </>
               ) : (
                  <>
                     <Plus className="size-3.5" />
                     Adicionar instrução
                  </>
               )}
            </Button>
         </form>

         <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
               Exemplos
            </p>
            <div className="space-y-1.5">
               {TIPS.map((item, i) => (
                  <div
                     className="flex items-start gap-1.5"
                     key={`tip-${i + 1}`}
                  >
                     {item.type === "good" ? (
                        <CheckCircle2 className="size-3 shrink-0 text-emerald-500 self-start translate-y-0.5" />
                     ) : (
                        <XCircle className="size-3 shrink-0 text-destructive self-start translate-y-0.5" />
                     )}
                     <span className="text-xs text-muted-foreground">
                        {item.type === "bad" ? (
                           <>
                              <span className="line-through">{item.text}</span>
                              {" — "}
                              {item.reason}
                           </>
                        ) : (
                           item.text
                        )}
                     </span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}

export function WriterInstructionsSection({
   writerId,
   instructions,
}: WriterInstructionsSectionProps) {
   const { openAlertDialog } = useAlertDialog();

   const toggleMutation = useMutation(
      orpc.writer.toggleInstruction.mutationOptions({
         onError: (error) => {
            toast.error(error.message ?? "Erro ao atualizar instrução");
         },
      }),
   );

   const deleteMutation = useMutation(
      orpc.writer.deleteInstruction.mutationOptions({
         onSuccess: () => {
            toast.success("Instrução removida");
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao remover instrução");
         },
      }),
   );

   function handleDelete(instruction: InstructionMemoryItem) {
      openAlertDialog({
         title: "Remover instrução",
         description: `Tem certeza que deseja remover "${instruction.title}"?`,
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         variant: "destructive",
         onAction: async () => {
            await deleteMutation.mutateAsync({
               writerId,
               instructionId: instruction.id,
            });
         },
      });
   }

   const sorted = [...instructions].sort((a, b) => a.order - b.order);
   const activeCount = sorted.filter((i) => i.enabled).length;

   return (
      <div className="py-4 space-y-4">
         {/* Header */}
         <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
               <h2 className="text-base font-semibold">Instruções fixas</h2>
               <p className="text-sm text-muted-foreground">
                  Injetadas no sistema do agente em toda geração.
               </p>
            </div>
            {sorted.length > 0 && (
               <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0 pt-0.5">
                  {activeCount} ativa{activeCount !== 1 ? "s" : ""} ·{" "}
                  {sorted.length} total
               </p>
            )}
         </div>

         {/* Two-column: list left, form right */}
         <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-x-8">
            {/* Instruction list */}
            <div className="col-span-1 lg:col-span-2">
               {sorted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground border rounded-lg">
                     <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                        <BookOpen className="size-5" />
                     </div>
                     <div className="text-center space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                           Nenhuma instrução ainda
                        </p>
                        <p className="text-xs text-muted-foreground">
                           Use o formulário para criar a primeira instrução.
                        </p>
                     </div>
                  </div>
               ) : (
                  <div className="rounded-lg border divide-y overflow-hidden">
                     {sorted.map((instruction) => (
                        <div
                           className="flex items-start gap-3 px-4 py-4"
                           key={instruction.id}
                        >
                           <Switch
                              aria-label={`${instruction.enabled ? "Desativar" : "Ativar"} instrução "${instruction.title}"`}
                              checked={instruction.enabled}
                              className="shrink-0 self-start translate-y-0.5"
                              disabled={
                                 toggleMutation.isPending &&
                                 toggleMutation.variables?.instructionId ===
                                    instruction.id
                              }
                              onCheckedChange={() =>
                                 toggleMutation.mutate({
                                    writerId,
                                    instructionId: instruction.id,
                                 })
                              }
                           />
                           <div className="flex-1 min-w-0 space-y-1">
                              <p
                                 className={cn(
                                    "text-sm font-medium leading-snug",
                                    !instruction.enabled &&
                                       "text-muted-foreground",
                                 )}
                              >
                                 {instruction.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                 {instruction.content}
                              </p>
                           </div>
                           <Button
                              aria-label="Remover instrução"
                              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(instruction)}
                              size="icon"
                              variant="ghost"
                           >
                              <Trash2 className="size-3.5" />
                           </Button>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Add form + tips */}
            <div className="pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-4">
               <AddInstructionForm writerId={writerId} />
            </div>
         </div>
      </div>
   );
}
