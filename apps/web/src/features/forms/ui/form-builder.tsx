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
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { FieldPalette, type FieldType } from "./field-palette";
import { FormCanvas, type FormField } from "./form-canvas";
import { FormPreview } from "./form-preview";
import { SubmissionsTable } from "./submissions-table";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateFieldId(): string {
   return `field_${crypto.randomUUID()}`;
}

function createDefaultField(type: FieldType): FormField {
   const labels: Record<FieldType, string> = {
      text: "Campo de texto",
      email: "E-mail",
      textarea: "Mensagem",
      checkbox: "Aceito os termos",
      select: "Selecione uma opção",
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
         type === "select" ? ["Opção 1", "Opção 2", "Opção 3"] : undefined,
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
   const { slug, teamSlug } = useParams({ strict: false }) as {
      slug?: string;
      teamSlug?: string;
   };
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
   const createMutation = useMutation(
      orpc.forms.create.mutationOptions({
         onSuccess: () => {
            toast.success("Formulário criado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.forms.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/forms",
               params: { slug: slug || "", teamSlug: teamSlug || "" },
            });
         },
         onError: () => {
            toast.error("Erro ao criar formulário");
         },
      }),
   );

   const updateMutation = useMutation(
      orpc.forms.update.mutationOptions({
         onSuccess: () => {
            toast.success("Formulário atualizado com sucesso");
            queryClient.invalidateQueries({
               queryKey: orpc.forms.list.queryKey({}),
            });
            queryClient.invalidateQueries({
               queryKey: orpc.forms.getById.queryOptions({
                  input: { id: formId },
               }).queryKey,
            });
         },
         onError: () => {
            toast.error("Erro ao atualizar formulário");
         },
      }),
   );

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
         toast.error("O nome do formulário é obrigatório");
         return;
      }
      if (fields.length === 0) {
         toast.error("Adicione pelo menos um campo ao formulário");
         return;
      }

      // Validate all fields have labels
      const missingLabel = fields.find((f) => !f.label.trim());
      if (missingLabel) {
         toast.error("Todos os campos precisam ter um rótulo");
         return;
      }

      const mappedFields = fields.map((f) => ({
         id: f.id,
         type: f.type,
         label: f.label,
         placeholder: f.placeholder,
         required: f.required,
         options: f.options,
      }));

      if (isCreateMode) {
         createMutation.mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            fields: mappedFields,
         });
      } else {
         updateMutation.mutate({
            id: formId,
            name: name.trim(),
            description: description.trim() || undefined,
            fields: mappedFields,
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
         to: "/$slug/$teamSlug/forms",
         params: { slug: slug || "", teamSlug: teamSlug || "" },
      });
   }, [navigate, slug, teamSlug]);

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
                     {isCreateMode ? "Criar formulário" : "Editar formulário"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                     {isCreateMode
                        ? "Configure os campos do seu novo formulário"
                        : "Altere os campos e configurações do formulário"}
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
                        {isCreateMode ? "Criar formulário" : "Salvar"}
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
                  Detalhes do formulário
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                     <Label className="text-sm" htmlFor="form-name">
                        Nome do formulário
                     </Label>
                     <Input
                        className="h-9"
                        id="form-name"
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Formulário de contato"
                        value={name}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-sm" htmlFor="form-description">
                        Descrição (opcional)
                     </Label>
                     <Input
                        className="h-9"
                        id="form-description"
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Uma breve descrição do formulário"
                        value={description}
                     />
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Builder: palette + canvas */}
         <Tabs defaultValue="builder">
            <TabsList>
               <TabsTrigger value="builder">Construtor</TabsTrigger>
               <TabsTrigger value="preview">Visualizar</TabsTrigger>
               {!isCreateMode && (
                  <TabsTrigger value="submissions">Submissões</TabsTrigger>
               )}
            </TabsList>

            <TabsContent value="builder">
               <div className="flex gap-6 items-start">
                  <FieldPalette onAddField={handleAddField} />

                  <div className="flex-1 min-w-0">
                     <div className="mb-3">
                        <h3 className="text-sm font-semibold text-foreground tracking-tight">
                           Campos do formulário
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                           {fields.length === 0
                              ? "Arraste campos para construir seu formulário"
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
            </TabsContent>

            <TabsContent value="preview">
               <FormPreview
                  description={description}
                  fields={fields}
                  name={name}
               />
            </TabsContent>

            {!isCreateMode && (
               <TabsContent value="submissions">
                  <SubmissionsTable formId={formId} />
               </TabsContent>
            )}
         </Tabs>
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
