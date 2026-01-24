import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/integrations/clients";

type OnboardingWriterFormProps = {
   onSuccess: () => void;
};

export function OnboardingWriterForm({ onSuccess }: OnboardingWriterFormProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const createMutation = useMutation(
      trpc.writer.create.mutationOptions({
         onSuccess: () => {
            toast.success("Escritor criado com sucesso");
            queryClient.invalidateQueries({
               queryKey: trpc.writer.list.queryKey(),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.writer.getStats.queryKey(),
            });
            onSuccess();
         },
         onError: (error) => {
            toast.error(
               error.message || "Ocorreu um erro. Por favor, tente novamente.",
            );
         },
      }),
   );

   const schema = z.object({
      name: z
         .string()
         .min(1, "O nome é obrigatório")
         .max(50, "O nome deve ter no máximo 50 caracteres"),
      description: z
         .string()
         .max(200, "A descrição deve ter no máximo 200 caracteres")
         .optional(),
   });

   const form = useForm({
      defaultValues: {
         name: "",
         description: "",
      },
      onSubmit: async ({ value }) => {
         const personaConfig = {
            metadata: {
               name: value.name,
               description: value.description || undefined,
            },
            instructions: {
               ragIntegration: true,
            },
         };

         createMutation.mutate({ personaConfig });
      },
      validators: {
         onBlur: schema as unknown as undefined,
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   return (
      <form className="space-y-6" onSubmit={handleSubmit}>
         <form.Field name="name">
            {(field) => {
               const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

               return (
                  <Field data-invalid={isInvalid}>
                     <FieldLabel htmlFor={field.name}>{"Nome"}</FieldLabel>
                     <Input
                        aria-invalid={isInvalid}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={"Nome do escritor"}
                        type="text"
                        value={field.state.value}
                     />
                     {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                     )}
                  </Field>
               );
            }}
         </form.Field>

         <form.Field name="description">
            {(field) => {
               const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

               return (
                  <Field data-invalid={isInvalid}>
                     <FieldLabel htmlFor={field.name}>{"Descrição"}</FieldLabel>
                     <Textarea
                        aria-invalid={isInvalid}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={"Uma breve descrição do escritor"}
                        rows={3}
                        value={field.state.value}
                     />
                     <FieldDescription>
                        {"Uma breve descrição sobre seu escritor"}
                     </FieldDescription>
                     {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                     )}
                  </Field>
               );
            }}
         </form.Field>

         <form.Subscribe>
            {(formState) => (
               <Button
                  className="w-full gap-2"
                  disabled={
                     !formState.canSubmit ||
                     formState.isSubmitting ||
                     createMutation.isPending
                  }
                  size="lg"
                  type="submit"
               >
                  {createMutation.isPending ? (
                     <>
                        <Loader2Icon className="size-4 animate-spin" />
                        {"Criando..."}
                     </>
                  ) : (
                     <>
                        {"Criar e continuar"}
                        <ChevronRightIcon className="size-4" />
                     </>
                  )}
               </Button>
            )}
         </form.Subscribe>
      </form>
   );
}
