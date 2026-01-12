import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { Button } from "@packages/ui/components/button";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   SheetClose,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

const memorySchema = z.object({
   title: z
      .string()
      .min(1, "Título é obrigatório")
      .max(200, "Título deve ter no máximo 200 caracteres"),
   content: z.string().min(1, "Conteúdo é obrigatório"),
   enabled: z.boolean(),
});

type ManageMemoryFormProps = {
   agentId: string;
   memory?: InstructionMemoryItem;
};

export function ManageMemoryForm({ agentId, memory }: ManageMemoryFormProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { closeSheet } = useSheet();
   const isEditMode = !!memory;

   const createMutation = useMutation({
      ...trpc.agent.createInstruction.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: trpc.agent.listInstructions.queryKey({ agentId }),
         });
         closeSheet();
      },
   });

   const updateMutation = useMutation({
      ...trpc.agent.updateInstruction.mutationOptions(),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: trpc.agent.listInstructions.queryKey({ agentId }),
         });
         closeSheet();
      },
   });

   const form = useForm({
      defaultValues: {
         title: memory?.title ?? "",
         content: memory?.content ?? "",
         enabled: memory?.enabled ?? true,
      },
      onSubmit: async ({ value }) => {
         if (isEditMode && memory) {
            updateMutation.mutate({
               agentId,
               instructionId: memory.id,
               data: {
                  title: value.title,
                  content: value.content,
                  enabled: value.enabled,
               },
            });
         } else {
            createMutation.mutate({
               agentId,
               data: {
                  title: value.title,
                  content: value.content,
                  enabled: value.enabled,
               },
            });
         }
      },
      validators: {
         onBlur: memorySchema as unknown as undefined,
      },
   });

   const isPending = createMutation.isPending || updateMutation.isPending;

   return (
      <form
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
         }}
      >
         <SheetHeader>
            <SheetTitle>
               {isEditMode ? "Editar Memória" : "Nova Memória"}
            </SheetTitle>
            <SheetDescription>
               {isEditMode
                  ? "Atualize as informações da memória do escritor."
                  : "Adicione uma nova memória de instrução para o escritor."}
            </SheetDescription>
         </SheetHeader>

         <div className="space-y-6 py-6">
            <form.Field name="title">
               {(field) => {
                  const errors = field.state.meta.errors;
                  const hasError = errors.length > 0;
                  return (
                     <Field data-invalid={hasError || undefined}>
                        <FieldLabel>{"Título"}</FieldLabel>
                        <Input
                           maxLength={200}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Ex: Tom de voz, Estilo de escrita..."
                           value={field.state.value}
                        />
                        <FieldError errors={errors} />
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="content">
               {(field) => {
                  const errors = field.state.meta.errors;
                  const hasError = errors.length > 0;
                  return (
                     <Field data-invalid={hasError || undefined}>
                        <FieldLabel>{"Conteúdo"}</FieldLabel>
                        <Textarea
                           className="min-h-[200px]"
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Escreva as instruções em markdown..."
                           value={field.state.value}
                        />
                        <FieldError errors={errors} />
                        <p className="text-xs text-muted-foreground mt-1">
                           {"Suporta formatação markdown."}
                        </p>
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="enabled">
               {(field) => (
                  <Field>
                     <div className="flex items-center justify-between">
                        <div>
                           <FieldLabel className="mb-0">{"Ativo"}</FieldLabel>
                           <p className="text-xs text-muted-foreground">
                              {
                                 "Memórias desativadas não são usadas pelo agente."
                              }
                           </p>
                        </div>
                        <Switch
                           checked={field.state.value}
                           onCheckedChange={field.handleChange}
                        />
                     </div>
                  </Field>
               )}
            </form.Field>
         </div>

         <SheetFooter>
            <SheetClose asChild>
               <Button disabled={isPending} type="button" variant="outline">
                  {"Cancelar"}
               </Button>
            </SheetClose>
            <form.Subscribe selector={(state) => state.isValid}>
               {(isValid) => (
                  <Button disabled={!isValid || isPending} type="submit">
                     {isPending
                        ? "Salvando..."
                        : isEditMode
                          ? "Salvar"
                          : "Adicionar"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}
