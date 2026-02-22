import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import {
   type FormEvent,
   forwardRef,
   useCallback,
   useEffect,
   useImperativeHandle,
   useTransition,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/integrations/better-auth/auth-client";
import type { StepHandle, StepState } from "./step-handle";

const projectSchema = z.object({
   projectName: z
      .string()
      .min(2, "O nome do projeto deve ter no mínimo 2 caracteres."),
});

interface ProjectStepProps {
   organizationId: string;
   onNext: (team: { id: string; slug: string }) => void;
   onStateChange: (state: StepState) => void;
   onSlugChange?: (slug: string | null) => void;
}

export const ProjectStep = forwardRef<StepHandle, ProjectStepProps>(
   function ProjectStep(
      { organizationId, onNext, onStateChange, onSlugChange },
      ref,
   ) {
      const [isPending, startTransition] = useTransition();

      const form = useForm({
         defaultValues: { projectName: "" },
         onSubmit: async ({ value }) => {
            try {
               const slug = createSlug(value.projectName);

               const result = await authClient.organization.createTeam({
                  name: value.projectName,
                  organizationId,
               });

               if (!result.data?.id) {
                  throw new Error("Failed to create project");
               }

               const teamId = result.data.id;

               const session = await authClient.getSession();
               if (!session?.data?.user?.id) {
                  throw new Error("No active session");
               }

               await authClient.organization.addTeamMember({
                  teamId,
                  userId: session.data.user.id,
               });

               await authClient.organization.setActiveTeam({ teamId });

               toast.success("Projeto criado com sucesso!");
               onNext({ id: teamId, slug });
            } catch (error) {
               toast.error(
                  error instanceof Error
                     ? error.message
                     : "Erro ao criar projeto.",
               );
            }
         },
         validators: { onBlur: projectSchema },
      });

      useImperativeHandle(
         ref,
         () => ({
            submit: async () => {
               await form.handleSubmit();
               return true;
            },
            canContinue: true,
            isPending,
         }),
         [form, isPending],
      );

      useEffect(() => {
         onStateChange({ canContinue: true, isPending });
      }, [isPending, onStateChange]);

      const handleSubmit = useCallback(
         (e: FormEvent) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(async () => {
               await form.handleSubmit();
            });
         },
         [form, startTransition],
      );

      return (
         <div className="space-y-6">
            <div className="space-y-2 text-center">
               <h2 className="font-serif text-2xl font-semibold">
                  Crie seu primeiro projeto
               </h2>
               <p className="text-sm text-muted-foreground">
                  Projetos organizam seu conteúdo por site, blog ou produto.
               </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
               <FieldGroup>
                  <form.Field name="projectName">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Nome do Projeto
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 autoFocus
                                 disabled={isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    const slug =
                                       e.target.value.length >= 2
                                          ? createSlug(e.target.value)
                                          : null;
                                    onSlugChange?.(slug);
                                 }}
                                 placeholder="Ex: Blog da Empresa, Site Institucional"
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               </FieldGroup>
            </form>
         </div>
      );
   },
);
