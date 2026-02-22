import { Card, CardContent } from "@packages/ui/components/card";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Textarea } from "@packages/ui/components/textarea";
import { cn } from "@packages/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { orpc } from "@/integrations/orpc/client";
import { FieldPalette, type FieldType } from "./field-palette";
import { FormCanvas, type FormField } from "./form-canvas";
import { FormEmbedPanel } from "./form-embed-panel";
import { FormHeader } from "./form-header";
import { FormPreview } from "./form-preview";
import { type FormTemplate, FormTemplateSelector } from "./form-templates";
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
      number: "Número",
      date: "Data",
      rating: "Avaliação",
      file: "Arquivo",
   };

   const placeholders: Record<FieldType, string> = {
      text: "Digite aqui...",
      email: "email@exemplo.com",
      textarea: "Escreva sua mensagem...",
      checkbox: "",
      select: "Selecione...",
      number: "0",
      date: "",
      rating: "",
      file: "",
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
// CollapsibleSection helper
// ─────────────────────────────────────────────────────────────────────────────

function CollapsibleSection({
   title,
   children,
   defaultOpen = false,
}: {
   title: string;
   children: React.ReactNode;
   defaultOpen?: boolean;
}) {
   const [open, setOpen] = useState(defaultOpen);
   return (
      <div className="space-y-2">
         <button
            className="flex items-center gap-1 w-full text-xs font-semibold text-foreground uppercase tracking-wider"
            onClick={() => setOpen(!open)}
            type="button"
         >
            <ChevronRight
               className={cn(
                  "size-3 transition-transform",
                  open && "rotate-90",
               )}
            />
            {title}
         </button>
         {open && <div>{children}</div>}
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────

const FORM_TABS = [
   { value: "builder", label: "Construtor" },
   { value: "preview", label: "Visualizar" },
   { value: "embed", label: "Incorporar" },
   { value: "submissions", label: "Submissões" },
] as const;

type FormTab = (typeof FORM_TABS)[number]["value"];

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
   const { openAlertDialog } = useAlertDialog();

   // ── State ──────────────────────────────────────────────────────────────
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [fields, setFields] = useState<FormField[]>([]);
   const [hasInitialized, setHasInitialized] = useState(isCreateMode);
   const [activeTab, setActiveTab] = useState<FormTab>("builder");
   const [showTemplates, setShowTemplates] = useState(isCreateMode);

   // CTA fields
   const [title, setTitle] = useState("");
   const [subtitle, setSubtitle] = useState("");
   const [icon, setIcon] = useState("");
   const [buttonText, setButtonText] = useState("Enviar");
   const [layout, setLayout] = useState<"card" | "inline" | "banner">("card");

   // Settings
   const [successMessage, setSuccessMessage] = useState("");

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
         // biome-ignore lint/suspicious/noExplicitAny: CTA columns not yet typed on client query result
         const form = existingForm as any;
         setTitle(form.title ?? "");
         setSubtitle(form.subtitle ?? "");
         setIcon(form.icon ?? "");
         setButtonText(form.buttonText ?? "Enviar");
         setLayout((form.layout as "card" | "inline" | "banner") ?? "card");
         setSuccessMessage(
            (existingForm.settings as { successMessage?: string })
               ?.successMessage ?? "",
         );
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

   const deleteMutation = useMutation(
      orpc.forms.remove.mutationOptions({
         onSuccess: () => {
            toast.success("Formulário excluído");
            queryClient.invalidateQueries({
               queryKey: orpc.forms.list.queryKey({}),
            });
            navigate({
               to: "/$slug/$teamSlug/forms",
               params: { slug: slug || "", teamSlug: teamSlug || "" },
            });
         },
         onError: () => {
            toast.error("Erro ao excluir formulário");
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

   // ── Template selection ─────────────────────────────────────────────────
   const handleTemplateSelect = useCallback((template: FormTemplate) => {
      setTitle(template.title);
      setSubtitle(template.subtitle);
      setButtonText(template.buttonText || "Enviar");
      setIcon(template.icon || "");
      setFields(
         template.fields.map((f) => ({
            ...f,
            id: generateFieldId(),
            required: f.required ?? false,
         })),
      );
      setShowTemplates(false);
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

      const settings = successMessage.trim()
         ? { successMessage: successMessage.trim() }
         : undefined;

      if (isCreateMode) {
         createMutation.mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            fields: mappedFields,
            settings,
            title: title.trim() || undefined,
            subtitle: subtitle.trim() || undefined,
            icon: icon.trim() || undefined,
            buttonText: buttonText.trim() || "Enviar",
            layout,
         });
      } else {
         updateMutation.mutate({
            id: formId,
            name: name.trim(),
            description: description.trim() || undefined,
            fields: mappedFields,
            settings,
            title: title.trim() || undefined,
            subtitle: subtitle.trim() || undefined,
            icon: icon.trim() || undefined,
            buttonText: buttonText.trim() || "Enviar",
            layout,
         });
      }
   }, [
      name,
      description,
      fields,
      successMessage,
      title,
      subtitle,
      icon,
      buttonText,
      layout,
      isCreateMode,
      formId,
      createMutation,
      updateMutation,
   ]);

   // ── Delete ─────────────────────────────────────────────────────────────
   const handleDelete = useCallback(() => {
      openAlertDialog({
         title: "Excluir formulário?",
         description:
            "Esta ação não pode ser desfeita. Todas as submissões também serão excluídas.",
         onAction: () => deleteMutation.mutate({ id: formId }),
         variant: "destructive",
      });
   }, [openAlertDialog, deleteMutation, formId]);

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

   // ── Template selector (create mode only) ──────────────────────────────
   if (showTemplates && isCreateMode) {
      return (
         <div className="flex flex-col gap-0 h-full">
            <div className="border-b bg-background">
               <div className="container mx-auto px-4 py-4 flex items-center gap-3">
                  <button
                     className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                     onClick={handleCancel}
                     type="button"
                  >
                     <ArrowLeft className="size-5" />
                  </button>
                  <h1 className="text-xl font-semibold">Novo formulário</h1>
               </div>
            </div>
            <div className="container mx-auto px-4 py-8">
               <FormTemplateSelector onSelect={handleTemplateSelect} />
            </div>
         </div>
      );
   }

   // ── Render ─────────────────────────────────────────────────────────────
   return (
      <div className="flex flex-col h-full">
         <FormHeader
            backTo={{ slug: slug ?? "", teamSlug: teamSlug ?? "" }}
            description={description}
            isActive={true}
            isSaving={isSaving}
            name={name}
            onDelete={!isCreateMode ? handleDelete : undefined}
            onDescriptionChange={setDescription}
            onNameChange={setName}
            onSave={handleSave}
         />

         {/* Tab bar */}
         <div className="border-b bg-background">
            <div className="container mx-auto px-4">
               <div className="flex items-center gap-0">
                  {FORM_TABS.filter(
                     (tab) => isCreateMode || tab.value !== "submissions",
                  )
                     .filter((tab) => !isCreateMode || tab.value !== "embed")
                     .map((tab) => (
                        <button
                           className={cn(
                              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                              activeTab === tab.value
                                 ? "border-primary text-foreground"
                                 : "border-transparent text-muted-foreground hover:text-foreground",
                           )}
                           key={tab.value}
                           onClick={() => setActiveTab(tab.value)}
                           type="button"
                        >
                           {tab.label}
                        </button>
                     ))}
               </div>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6">
               {activeTab === "builder" && (
                  <div className="flex gap-6 items-start">
                     {/* LEFT SIDEBAR */}
                     <aside className="w-[280px] flex-shrink-0 space-y-4">
                        <Card className="sticky top-4">
                           <CardContent className="p-4 space-y-6">
                              {/* Apresentação section */}
                              <CollapsibleSection
                                 defaultOpen
                                 title="Apresentação"
                              >
                                 <div className="space-y-3">
                                    <div className="space-y-1">
                                       <Label className="text-xs">
                                          Ícone (emoji)
                                       </Label>
                                       <Input
                                          className="h-8"
                                          onChange={(e) =>
                                             setIcon(e.target.value)
                                          }
                                          placeholder="🎯"
                                          value={icon}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <Label className="text-xs">
                                          Título do CTA
                                       </Label>
                                       <Input
                                          className="h-8"
                                          onChange={(e) =>
                                             setTitle(e.target.value)
                                          }
                                          placeholder="Receba nossos conteúdos"
                                          value={title}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <Label className="text-xs">
                                          Subtítulo
                                       </Label>
                                       <Textarea
                                          className="resize-none text-sm"
                                          onChange={(e) =>
                                             setSubtitle(e.target.value)
                                          }
                                          placeholder="Descrição breve..."
                                          rows={2}
                                          value={subtitle}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <Label className="text-xs">
                                          Texto do botão
                                       </Label>
                                       <Input
                                          className="h-8"
                                          onChange={(e) =>
                                             setButtonText(e.target.value)
                                          }
                                          placeholder="Enviar"
                                          value={buttonText}
                                       />
                                    </div>
                                 </div>
                              </CollapsibleSection>

                              <Separator />

                              {/* Campos section — the field palette */}
                              <CollapsibleSection defaultOpen title="Campos">
                                 <FieldPalette onAddField={handleAddField} />
                              </CollapsibleSection>

                              <Separator />

                              {/* Configurações section */}
                              <CollapsibleSection title="Configurações">
                                 <div className="space-y-3">
                                    <div className="space-y-1">
                                       <Label className="text-xs">
                                          Mensagem de sucesso
                                       </Label>
                                       <Textarea
                                          className="resize-none text-sm"
                                          onChange={(e) =>
                                             setSuccessMessage(e.target.value)
                                          }
                                          placeholder="Obrigado! Entraremos em contato."
                                          rows={2}
                                          value={successMessage}
                                       />
                                    </div>
                                 </div>
                              </CollapsibleSection>
                           </CardContent>
                        </Card>
                     </aside>

                     {/* MAIN CANVAS */}
                     <div className="flex-1 min-w-0">
                        <div className="mb-3">
                           <p className="text-xs text-muted-foreground">
                              {fields.length === 0
                                 ? "Arraste campos para construir seu formulário"
                                 : `${fields.length} ${fields.length === 1 ? "campo" : "campos"} configurados`}
                           </p>
                        </div>
                        <FormCanvas
                           ctaConfig={{
                              title,
                              subtitle,
                              icon,
                              buttonText,
                              layout,
                           }}
                           fields={fields}
                           onDropNewField={handleAddField}
                           onFieldRemove={handleFieldRemove}
                           onFieldsReorder={handleFieldsReorder}
                           onFieldUpdate={handleFieldUpdate}
                        />
                     </div>
                  </div>
               )}

               {activeTab === "preview" && (
                  <FormPreview
                     buttonText={buttonText}
                     description={description}
                     fields={fields}
                     icon={icon}
                     layout={layout}
                     name={name}
                     subtitle={subtitle}
                     title={title}
                  />
               )}

               {activeTab === "embed" && <FormEmbedPanel formId={formId} />}

               {!isCreateMode && activeTab === "submissions" && (
                  <SubmissionsTable formId={formId} />
               )}
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
      <div className="flex flex-col gap-0">
         <div className="border-b p-4">
            <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="space-y-1">
                     <Skeleton className="h-7 w-48" />
                     <Skeleton className="h-4 w-64" />
                  </div>
               </div>
               <Skeleton className="h-9 w-[120px]" />
            </div>
         </div>
         <div className="border-b p-4">
            <div className="flex gap-4">
               {[1, 2, 3].map((i) => (
                  <Skeleton className="h-8 w-24" key={`tab-${i}`} />
               ))}
            </div>
         </div>
         <div className="flex gap-6 p-6">
            <Skeleton className="w-[280px] h-[500px] rounded-lg" />
            <Skeleton className="flex-1 h-[400px] rounded-lg" />
         </div>
      </div>
   );
}
