import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { client, orpc } from "@/integrations/orpc/client";
import { FieldPalette, type FieldType } from "./field-palette";
import { FormCanvas, type FormField } from "./form-canvas";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let fieldCounter = 0;

function generateFieldId(): string {
   fieldCounter += 1;
   return `field_${Date.now()}_${fieldCounter}`;
}

function createDefaultField(type: FieldType): FormField {
   const labels: Record<FieldType, string> = {
      text: "Campo de texto",
      email: "E-mail",
      textarea: "Mensagem",
      checkbox: "Aceito os termos",
      select: "Selecione uma opcao",
   };

   const placeholders: Record<FieldType, string> = {
      text: "Digite aqui...",
      email: "email@exemplo.com",
      textarea: "Escreva sua mensagem...",
      checkbox: "",
      select: "Selecione...",
   };

   return {
      id: generateFieldId(),
      type,
      label: labels[type],
      placeholder: type !== "checkbox" ? placeholders[type] : undefined,
      required: false,
      options:
         type === "select" ? ["Opcao 1", "Opcao 2", "Opcao 3"] : undefined,
   };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Builder
// ─────────────────────────────────────────────────────────────────────────────

interface FormBuilderProps {
   formId: string;
}

export function FormBuilder({ formId }: FormBuilderProps) {
   const isCreateMode = formId === "new";
   const navigate = useNavigate();
   const { slug } = useParams({ strict: false });
   const queryClient = useQueryClient();

   // ── State ──────────────────────────────────────────────────────────────
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [fields, setFields] = useState<FormField[]>([]);
   const [hasInitialized, setHasInitialized] = useState(isCreateMode);

   // ── Load existing form for edit mode ───────────────────────────────────
   const { data: existingForm, isLoading } = useQuery({
      ...orpc.forms.getById.queryOptions({ input: { id: formId } }),
      enabled: !isCreateMode,
   });

   // Populate state when form data arrives
   useEffect(() => {
      if (existingForm && !hasInitialized) {
         setName(existingForm.name);
         setDescription(existingForm.description ?? "");
         setFields(
            (existingForm.fields as FormField[]).map((f) => ({
               ...f,
               id: f.id || generateFieldId(),
            })),
         );
         setHasInitialized(true);
      }
   }, [existingForm, hasInitialized]);

   // ── Mutations ──────────────────────────────────────────────────────────
   const createMutation = useMutation({
      mutationFn: async (data: {
         name: string;
         description?: string;
         fields: FormField[];
      }) => {
         return await client.forms.create({
            name: data.name,
            description: data.description,
            fields: data.fields.map((f) => ({
               id: f.id,
               type: f.type,
               label: f.label,
               placeholder: f.placeholder,
               required: f.required,
               options: f.options,
            })),
         });
      },
      onSuccess: () => {
         toast.success("Formulario criado com sucesso");
         queryClient.invalidateQueries({
            queryKey: orpc.forms.list.queryKey({}),
         });
         navigate({
            to: "/$slug/forms",
            params: { slug: slug || "" },
         });
      },
      onError: () => {
         toast.error("Erro ao criar formulario");
      },
   });

   const updateMutation = useMutation({
      mutationFn: async (data: {
         id: string;
         name: string;
         description?: string;
         fields: FormField[];
      }) => {
         return await client.forms.update({
            id: data.id,
            name: data.name,
            description: data.description,
            fields: data.fields.map((f) => ({
               id: f.id,
               type: f.type,
               label: f.label,
               placeholder: f.placeholder,
               required: f.required,
               options: f.options,
            })),
         });
      },
      onSuccess: () => {
         toast.success("Formulario atualizado com sucesso");
         queryClient.invalidateQueries({
            queryKey: orpc.forms.list.queryKey({}),
         });
         queryClient.invalidateQueries({
            queryKey: orpc.forms.getById.queryKey({ input: { id: formId } }),
         });
      },
      onError: () => {
         toast.error("Erro ao atualizar formulario");
      },
   });

   const isSaving = createMutation.isPending || updateMutation.isPending;

   // ── Field operations ───────────────────────────────────────────────────
   const handleAddField = useCallback((type: FieldType) => {
      setFields((prev) => [...prev, createDefaultField(type)]);
   }, []);

   const handleFieldUpdate = useCallback(
      (id: string, updates: Partial<FormField>) => {
         setFields((prev) =>
            prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
         );
      },
      [],
   );

   const handleFieldRemove = useCallback((id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id));
   }, []);

   const handleFieldsReorder = useCallback((reordered: FormField[]) => {
      setFields(reordered);
   }, []);

   // ── Save ───────────────────────────────────────────────────────────────
   const handleSave = useCallback(() => {
      if (!name.trim()) {
         toast.error("O nome do formulario e obrigatorio");
         return;
      }
      if (fields.length === 0) {
         toast.error("Adicione pelo menos um campo ao formulario");
         return;
      }

      // Validate all fields have labels
      const missingLabel = fields.find((f) => !f.label.trim());
      if (missingLabel) {
         toast.error("Todos os campos precisam ter um rotulo");
         return;
      }

      if (isCreateMode) {
         createMutation.mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            fields,
         });
      } else {
         updateMutation.mutate({
            id: formId,
            name: name.trim(),
            description: description.trim() || undefined,
            fields,
         });
      }
   }, [
      name,
      description,
      fields,
      isCreateMode,
      formId,
      createMutation,
      updateMutation,
   ]);

   const handleCancel = useCallback(() => {
      navigate({
         to: "/$slug/forms",
         params: { slug: slug || "" },
      });
   }, [navigate, slug]);

   // ── Loading state ──────────────────────────────────────────────────────
   if (!isCreateMode && isLoading) {
      return <FormBuilderSkeleton />;
   }

   // ── Render ─────────────────────────────────────────────────────────────
   return (
      <div className="flex flex-col gap-6">
         {/* Page header */}
         <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <Button
                  className="size-8"
                  onClick={handleCancel}
                  size="icon"
                  type="button"
                  variant="ghost"
               >
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Voltar</span>
               </Button>
               <div>
                  <h1 className="text-2xl font-bold tracking-tight font-serif">
                     {isCreateMode ? "Criar formulario" : "Editar formulario"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                     {isCreateMode
                        ? "Configure os campos do seu novo formulario"
                        : "Altere os campos e configuracoes do formulario"}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2">
               <Button onClick={handleCancel} type="button" variant="outline">
                  Cancelar
               </Button>
               <Button
                  className="min-w-[120px]"
                  disabled={isSaving}
                  onClick={handleSave}
                  type="button"
               >
                  {isSaving ? (
                     <>
                        <Loader2 className="size-4 animate-spin" />
                        Salvando...
                     </>
                  ) : (
                     <>
                        <Save className="size-4" />
                        {isCreateMode ? "Criar formulario" : "Salvar"}
                     </>
                  )}
               </Button>
            </div>
         </div>

         <Separator />

         {/* Form details card */}
         <Card>
            <CardHeader className="pb-3">
               <CardTitle className="text-base">
                  Detalhes do formulario
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                     <Label className="text-sm" htmlFor="form-name">
                        Nome do formulario
                     </Label>
                     <Input
                        className="h-9"
                        id="form-name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Formulario de contato"
                        value={name}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-sm" htmlFor="form-description">
                        Descricao (opcional)
                     </Label>
                     <Input
                        className="h-9"
                        id="form-description"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Uma breve descricao do formulario"
                        value={description}
                     />
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Builder: palette + canvas */}
         <div className="flex gap-6 items-start">
            <FieldPalette onAddField={handleAddField} />

            <div className="flex-1 min-w-0">
               <div className="mb-3">
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                     Campos do formulario
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                     {fields.length === 0
                        ? "Arraste campos para construir seu formulario"
                        : `${fields.length} ${fields.length === 1 ? "campo" : "campos"} configurados`}
                  </p>
               </div>

               <FormCanvas
                  fields={fields}
                  onDropNewField={handleAddField}
                  onFieldRemove={handleFieldRemove}
                  onFieldsReorder={handleFieldsReorder}
                  onFieldUpdate={handleFieldUpdate}
               />
            </div>
         </div>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function FormBuilderSkeleton() {
   return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <Skeleton className="size-8 rounded-md" />
               <div className="space-y-1">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64" />
               </div>
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-9 w-20" />
               <Skeleton className="h-9 w-[120px]" />
            </div>
         </div>
         <Separator />
         <Skeleton className="h-[120px] rounded-lg" />
         <div className="flex gap-6">
            <Skeleton className="w-[260px] h-[320px] rounded-lg" />
            <Skeleton className="flex-1 h-[400px] rounded-lg" />
         </div>
      </div>
   );
}
