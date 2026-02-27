import type { ContentMeta } from "@packages/database/schemas/content";
import {
   ContextPanel,
   ContextPanelContent,
   ContextPanelHeader,
   ContextPanelHeaderActions,
   ContextPanelTitle,
} from "@packages/ui/components/context-panel";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { MultiSelect } from "@packages/ui/components/multi-select";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { Check, Pencil } from "lucide-react";
import { type FormEvent, useCallback, useState, useTransition } from "react";
import { z } from "zod";

const metaSchema = z.object({
   title: z.string().min(1, "O título é obrigatório."),
   description: z.string(),
   slug: z.string().min(1, "O slug é obrigatório."),
   keywords: z.array(z.string()),
});

interface EditorMetaPanelProps {
   meta: ContentMeta;
   onSave: (values: ContentMeta) => Promise<void>;
}

export function EditorMetaPanel({ meta, onSave }: EditorMetaPanelProps) {
   const [isPending, startTransition] = useTransition();
   const [isEditing, setIsEditing] = useState(false);

   const form = useForm({
      defaultValues: {
         title: meta.title,
         description: meta.description,
         slug: meta.slug,
         keywords: meta.keywords ?? [],
      },
      onSubmit: async ({ value }) => {
         await onSave({ ...meta, ...value });
         setIsEditing(false);
      },
      validators: { onBlur: metaSchema },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         startTransition(async () => {
            await form.handleSubmit();
         });
      },
      [form],
   );

   return (
      <ContextPanel>
         <form className="contents" onSubmit={handleSubmit}>
            <ContextPanelHeader>
               <ContextPanelTitle>Frontmatter</ContextPanelTitle>
               <ContextPanelHeaderActions>
                  {isEditing ? (
                     <form.Subscribe>
                        {(state) => (
                           <Button
                              className="size-6 rounded"
                              disabled={!state.canSubmit || isPending}
                              size="icon"
                              type="submit"
                              variant="ghost"
                           >
                              <Check className="size-4" />
                           </Button>
                        )}
                     </form.Subscribe>
                  ) : (
                     <Button
                        className="size-6 rounded"
                        onClick={() => setIsEditing(true)}
                        size="icon"
                        type="button"
                        variant="ghost"
                     >
                        <Pencil className="size-4" />
                     </Button>
                  )}
               </ContextPanelHeaderActions>
            </ContextPanelHeader>

            <ContextPanelContent>
               <FieldGroup>
                  <form.Field name="title">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Título
                              </FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 disabled={!isEditing || isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Título do conteúdo"
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
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Descrição
                              </FieldLabel>
                              <Textarea
                                 aria-invalid={isInvalid}
                                 disabled={!isEditing || isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Meta descrição"
                                 rows={3}
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>

                  <form.Field name="slug">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                              <Input
                                 aria-invalid={isInvalid}
                                 disabled={!isEditing || isPending}
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="url-do-conteudo"
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>

                  <form.Field name="keywords">
                     {(field) => {
                        const options = field.state.value.map((kw) => ({
                           label: kw,
                           value: kw,
                        }));
                        return (
                           <Field>
                              <FieldLabel>Keywords</FieldLabel>
                              <div
                                 className={
                                    !isEditing
                                       ? "pointer-events-none opacity-50"
                                       : undefined
                                 }
                              >
                                 <MultiSelect
                                    onChange={(selected) =>
                                       field.handleChange(selected)
                                    }
                                    onCreate={(name) => {
                                       const trimmed = name.trim();
                                       if (
                                          trimmed &&
                                          !field.state.value.includes(trimmed)
                                       ) {
                                          field.handleChange([
                                             ...field.state.value,
                                             trimmed,
                                          ]);
                                       }
                                    }}
                                    options={options}
                                    placeholder="Adicionar keyword..."
                                    selected={field.state.value}
                                 />
                              </div>
                           </Field>
                        );
                     }}
                  </form.Field>
               </FieldGroup>
            </ContextPanelContent>
         </form>
      </ContextPanel>
   );
}
