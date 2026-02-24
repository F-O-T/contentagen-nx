import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MoreHorizontal, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";

interface WriterInstructionsSectionProps {
   writerId: string;
   instructions: InstructionMemoryItem[];
}

function InstructionGuide() {
   return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
         <p className="text-sm font-medium">Como escrever boas instruções</p>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
               {[
                  "Use sempre Contentta com dois t's",
                  "Inclua um CTA no final de cada artigo",
                  "Nunca mencione concorrentes pelo nome",
                  "Escreva parágrafos com no máximo 3 linhas",
               ].map((example, index) => (
                  <div className="flex items-start gap-2" key={`good-${index + 1}`}>
                     <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                     <span className="text-xs text-muted-foreground">{example}</span>
                  </div>
               ))}
            </div>
            <div className="space-y-1.5">
               {[
                  { text: "Escreva bem", reason: "o agente não sabe o que isso significa" },
                  { text: "Seja criativo", reason: "sem ação clara" },
                  { text: "Use um bom tom", reason: "o que é 'bom'?" },
               ].map((example, index) => (
                  <div className="flex items-start gap-2" key={`bad-${index + 1}`}>
                     <XCircle className="size-3.5 mt-0.5 shrink-0 text-destructive" />
                     <span className="text-xs text-muted-foreground">
                        <span className="line-through">{example.text}</span>
                        {" — "}
                        {example.reason}
                     </span>
                  </div>
               ))}
            </div>
         </div>
         <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">
               <span className="font-medium text-foreground">Regra de ouro:</span> se você explicasse isso a um redator humano que nunca viu seu produto, ele saberia exatamente o que fazer?
            </p>
         </div>
      </div>
   );
}

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
      mutation.mutate({ writerId, instruction: { title, content, enabled: true } });
   }

   return (
      <Card>
         <CardContent className="p-5">
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
                     placeholder="Descreva a instrução com clareza e especificidade..."
                     value={content}
                  />
               </div>
               <div className="flex justify-end">
                  <Button disabled={mutation.isPending || !canSubmit} type="submit">
                     {mutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                     {mutation.isPending ? "Adicionando..." : "Adicionar instrução"}
                  </Button>
               </div>
            </form>
         </CardContent>
      </Card>
   );
}

export function WriterInstructionsSection({ writerId, instructions }: WriterInstructionsSectionProps) {
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
            await deleteMutation.mutateAsync({ writerId, instructionId: instruction.id });
         },
      });
   }

   const sorted = [...instructions].sort((a, b) => a.order - b.order);
   const activeCount = sorted.filter((i) => i.enabled).length;

   return (
      <div className="space-y-4">
         <div>
            <h2 className="text-base font-semibold">Instruções fixas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
               Sempre ativas em toda geração. São injetadas diretamente no sistema do agente.
            </p>
         </div>

         <InstructionGuide />

         <AddInstructionForm writerId={writerId} />

         <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
               {activeCount} ativa{activeCount !== 1 ? "s" : ""} · {sorted.length} total
            </p>

            {sorted.length === 0 ? (
               <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground border border-dashed rounded-lg">
                  <p className="text-sm">Nenhuma instrução adicionada ainda.</p>
                  <p className="text-xs">Use o formulário acima para criar a primeira.</p>
               </div>
            ) : (
               <div className="space-y-2">
                  {sorted.map((instruction) => (
                     <div
                        className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3"
                        key={instruction.id}
                     >
                        <Switch
                           aria-label={`${instruction.enabled ? "Desativar" : "Ativar"} instrução "${instruction.title}"`}
                           checked={instruction.enabled}
                           disabled={toggleMutation.isPending && toggleMutation.variables?.instructionId === instruction.id}
                           onCheckedChange={() =>
                              toggleMutation.mutate({ writerId, instructionId: instruction.id })
                           }
                        />
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{instruction.title}</p>
                              <Badge
                                 className="text-[10px] px-1.5 py-0"
                                 variant={instruction.enabled ? "default" : "secondary"}
                              >
                                 {instruction.enabled ? "ativa" : "inativa"}
                              </Badge>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {instruction.content}
                           </p>
                        </div>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button className="size-7" size="icon" variant="ghost">
                                 <MoreHorizontal className="size-3.5" />
                                 <span className="sr-only">Opções</span>
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                 className="text-destructive"
                                 onSelect={() => handleDelete(instruction)}
                              >
                                 <Trash2 />
                                 Remover
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
