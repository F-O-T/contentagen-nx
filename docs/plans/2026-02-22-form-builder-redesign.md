# Form Builder CTA-First Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Form Builder into a CTA-first lead acquisition tool with inline-editable header, sidebar layout, 4 new field types, templates, and SDK theme inheritance via CSS custom properties.

**Architecture:** Database schema gains 5 new columns (title, subtitle, icon, buttonText, layout). UI is rebuilt as InsightBuilder-pattern with sidebar (Apresentação / Campos / Configurações sections) + live canvas. SDK replaces hardcoded CSS with shadcn-compatible CSS vars.

**Tech Stack:** React + Drizzle ORM + oRPC + dnd-kit + TanStack Query + Bun

---

## Task 1: Schema — Add CTA columns to `forms` table

**Files:**
- Modify: `packages/database/src/schemas/forms.ts`
- Modify: `packages/database/src/repositories/form-repository.ts`

**Step 1: Add 5 new columns to the `forms` table schema**

In `packages/database/src/schemas/forms.ts`, replace the table definition to add the new columns after the existing `fields` column:

```typescript
// Add these imports at top (already there: text, boolean)
// no new imports needed — text() is already imported

// Inside forms pgTable:
title: text("title"),
subtitle: text("subtitle"),
icon: text("icon"),
buttonText: text("button_text").notNull().default("Enviar"),
layout: text("layout", { enum: ["card", "inline", "banner"] })
   .notNull()
   .default("card"),
```

Also update the `fields` JSONB type to include new field types:
```typescript
fields: jsonb("fields")
   .$type<
      Array<{
         id: string;
         type: "text" | "email" | "textarea" | "checkbox" | "select" | "number" | "date" | "rating" | "file";
         label: string;
         placeholder?: string;
         required: boolean;
         options?: string[];
      }>
   >()
   .notNull(),
```

Also update exported types at bottom:
```typescript
export type FormLayout = "card" | "inline" | "banner";
```

**Step 2: Run database push to apply changes**

```bash
bun run db:push
```

Expected: Migration applied successfully (adds 5 columns to `forms` table)

**Step 3: Update repository to include new columns in `updateForm`**

In `packages/database/src/repositories/form-repository.ts`, update the `updateForm` function signature to include new fields:

```typescript
export async function updateForm(
   db: DatabaseInstance,
   formId: string,
   data: Partial<
      Pick<NewForm, "name" | "description" | "fields" | "settings" | "isActive" | "title" | "subtitle" | "icon" | "buttonText" | "layout">
   >,
) {
```

**Step 4: Verify TypeScript compiles**

```bash
bun run typecheck
```

Expected: No new type errors

**Step 5: Commit**

```bash
git add packages/database/src/schemas/forms.ts packages/database/src/repositories/form-repository.ts
git commit -m "feat(db): add CTA columns to forms table (title, subtitle, icon, buttonText, layout)"
```

---

## Task 2: oRPC Router — Update Zod schemas for new fields

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/forms.ts`
- Modify: `apps/sdk-server/src/orpc/router/forms.ts`

**Step 1: Update `fieldSchema` in web router to include 4 new field types**

In `apps/web/src/integrations/orpc/router/forms.ts`, update:

```typescript
const fieldSchema = z.object({
   id: z.string(),
   type: z.enum([
      "text",
      "email",
      "textarea",
      "checkbox",
      "select",
      "number",
      "date",
      "rating",
      "file",
   ]),
   label: z.string(),
   placeholder: z.string().optional(),
   required: z.boolean(),
   options: z.array(z.string()).optional(),
});
```

**Step 2: Add new CTA fields to `createFormSchema` and `updateFormSchema`**

```typescript
const ctaFieldsSchema = z.object({
   title: z.string().optional(),
   subtitle: z.string().optional(),
   icon: z.string().optional(),
   buttonText: z.string().optional(),
   layout: z.enum(["card", "inline", "banner"]).optional(),
});

const createFormSchema = z.object({
   name: z.string().min(1),
   description: z.string().optional(),
   fields: z.array(fieldSchema).min(1),
   settings: settingsSchema.optional(),
   title: z.string().optional(),
   subtitle: z.string().optional(),
   icon: z.string().optional(),
   buttonText: z.string().optional(),
   layout: z.enum(["card", "inline", "banner"]).optional(),
});

const updateFormSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   fields: z.array(fieldSchema).min(1).optional(),
   settings: settingsSchema.optional(),
   isActive: z.boolean().optional(),
   title: z.string().optional(),
   subtitle: z.string().optional(),
   icon: z.string().optional(),
   buttonText: z.string().optional(),
   layout: z.enum(["card", "inline", "banner"]).optional(),
});
```

**Step 3: Pass new fields to `createForm` in the `create` handler**

In the `create` handler, add the new fields to the `createForm` call:

```typescript
const form = await createForm(db, {
   organizationId,
   teamId,
   name: input.name,
   description: input.description,
   fields: input.fields,
   settings: input.settings ?? {},
   title: input.title,
   subtitle: input.subtitle,
   icon: input.icon,
   buttonText: input.buttonText,
   layout: input.layout,
});
```

**Step 4: Update sdk-server router field types**

In `apps/sdk-server/src/orpc/router/forms.ts`, update the `validateSubmission` function signature to include new field types:

```typescript
function validateSubmission(
   fields: Array<{
      id: string;
      type: "text" | "email" | "textarea" | "checkbox" | "select" | "number" | "date" | "rating" | "file";
      label: string;
      required: boolean;
      options?: string[];
   }>,
   data: Record<string, unknown>,
): Record<string, string> | null {
```

Also add validation for `number`, `date`, `rating` fields:

```typescript
// Number validation
if (field.type === "number" && value !== undefined && value !== null && value !== "") {
   if (typeof value !== "string" || Number.isNaN(Number(value))) {
      errors[field.id] = `${field.label} must be a valid number.`;
   }
}

// Rating validation (1-5)
if (field.type === "rating" && value !== undefined && value !== null && value !== "") {
   const num = Number(value);
   if (Number.isNaN(num) || num < 1 || num > 5) {
      errors[field.id] = `${field.label} must be between 1 and 5.`;
   }
}
```

Also update the `get` endpoint to include new CTA columns:
```typescript
export const get = sdkProcedure
   .input(z.object({ formId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const [form] = await context.db
         .select({
            id: forms.id,
            name: forms.name,
            description: forms.description,
            fields: forms.fields,
            settings: forms.settings,
            title: forms.title,
            subtitle: forms.subtitle,
            icon: forms.icon,
            buttonText: forms.buttonText,
            layout: forms.layout,
         })
         .from(forms)
         // ... rest unchanged
```

**Step 5: Verify types compile**

```bash
bun run typecheck
```

Expected: No type errors

**Step 6: Commit**

```bash
git add apps/web/src/integrations/orpc/router/forms.ts apps/sdk-server/src/orpc/router/forms.ts
git commit -m "feat(orpc): update form router schemas for CTA fields and 4 new field types"
```

---

## Task 3: field-palette.tsx — Add 4 new field types + collapsible sections

**Files:**
- Modify: `apps/web/src/features/forms/ui/field-palette.tsx`

**Step 1: Update FieldType union to include new types**

Replace the current `FieldType` export:

```typescript
export type FieldType =
   | "text"
   | "email"
   | "textarea"
   | "checkbox"
   | "select"
   | "number"
   | "date"
   | "rating"
   | "file";
```

**Step 2: Add new field type definitions**

Add 4 new entries to `FIELD_TYPES`:

```typescript
import { AlignLeft, Calendar, CheckSquare, ChevronDown, Hash, Mail, Paperclip, Star, Type } from "lucide-react";

// New entries:
{
   type: "number",
   label: "Número",
   icon: <Hash className="size-4" />,
   description: "Campo numérico",
   group: "advanced",
},
{
   type: "date",
   label: "Data",
   icon: <Calendar className="size-4" />,
   description: "Seletor de data",
   group: "advanced",
},
{
   type: "rating",
   label: "Avaliação",
   icon: <Star className="size-4" />,
   description: "Escala de 1 a 5 estrelas",
   group: "advanced",
},
{
   type: "file",
   label: "Arquivo",
   icon: <Paperclip className="size-4" />,
   description: "Upload de arquivo",
   group: "advanced",
},
```

**Step 3: Organize into two groups with a collapsible "Avançados" section**

Import `Collapsible, CollapsibleContent, CollapsibleTrigger` from `@packages/ui/components/collapsible` and `ChevronRight` from lucide-react.

Restructure the component to show basic fields always-visible and advanced fields in a collapsible:

```tsx
const BASIC_FIELD_TYPES = FIELD_TYPES.filter(f => f.group === "basic");
const ADVANCED_FIELD_TYPES = FIELD_TYPES.filter(f => f.group === "advanced");

// In render:
<div className="space-y-4">
   <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Básicos</p>
      <div className="flex flex-col gap-1">
         {BASIC_FIELD_TYPES.map(...)}
      </div>
   </div>
   <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 w-full hover:text-foreground transition-colors">
         <ChevronRight className="size-3 transition-transform [[data-state=open]_&]:rotate-90" />
         Avançados
      </CollapsibleTrigger>
      <CollapsibleContent>
         <div className="flex flex-col gap-1">
            {ADVANCED_FIELD_TYPES.map(...)}
         </div>
      </CollapsibleContent>
   </Collapsible>
</div>
```

**Step 4: Verify types compile**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add apps/web/src/features/forms/ui/field-palette.tsx
git commit -m "feat(forms): add 4 new field types (number, date, rating, file) with collapsible groups"
```

---

## Task 4: form-canvas.tsx — CTA wrapper + new field support

**Files:**
- Modify: `apps/web/src/features/forms/ui/form-canvas.tsx`

**Step 1: Update `FormField` interface to include new types**

Update the `type` union in `FormField`:

```typescript
export interface FormField {
   id: string;
   type: "text" | "email" | "textarea" | "checkbox" | "select" | "number" | "date" | "rating" | "file";
   label: string;
   placeholder?: string;
   required: boolean;
   options?: string[];
}
```

**Step 2: Update `FIELD_ICONS` and `FIELD_TYPE_LABELS` for new types**

Import: `Calendar, Hash, Paperclip, Star`

```typescript
const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
   text: <Type className="size-3.5" />,
   email: <Mail className="size-3.5" />,
   textarea: <AlignLeft className="size-3.5" />,
   checkbox: <CheckSquare className="size-3.5" />,
   select: <ChevronDown className="size-3.5" />,
   number: <Hash className="size-3.5" />,
   date: <Calendar className="size-3.5" />,
   rating: <Star className="size-3.5" />,
   file: <Paperclip className="size-3.5" />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
   text: "Texto",
   email: "E-mail",
   textarea: "Texto longo",
   checkbox: "Checkbox",
   select: "Seleção",
   number: "Número",
   date: "Data",
   rating: "Avaliação",
   file: "Arquivo",
};
```

**Step 3: Export `FormCanvasProps` and add CTA props interface**

Export a new interface for the full builder state that the canvas uses:

```typescript
export interface FormCtaConfig {
   title: string;
   subtitle: string;
   icon: string;
   buttonText: string;
   layout: "card" | "inline" | "banner";
}
```

Also update `FormCanvasProps` to accept optional `ctaConfig` for live preview display:
```typescript
interface FormCanvasProps {
   fields: FormField[];
   ctaConfig?: FormCtaConfig;
   onFieldsReorder: (fields: FormField[]) => void;
   onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
   onFieldRemove: (id: string) => void;
   onDropNewField: (type: FieldType) => void;
}
```

**Step 4: Update the `FormCanvas` render to show CTA wrapper**

When `ctaConfig` is provided, wrap the canvas in a styled CTA preview block:

```tsx
// At the top of FormCanvas render, before the DndContext:
<div className="space-y-3">
   {ctaConfig && (ctaConfig.title || ctaConfig.subtitle) && (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
         {ctaConfig.icon && <span className="text-2xl">{ctaConfig.icon}</span>}
         {ctaConfig.title && <p className="font-semibold text-lg">{ctaConfig.title}</p>}
         {ctaConfig.subtitle && <p className="text-sm text-muted-foreground">{ctaConfig.subtitle}</p>}
      </div>
   )}
   {/* existing field list or empty state */}
   {/* ... */}
   {fields.length > 0 && ctaConfig?.buttonText && (
      <div className="pt-2">
         <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-60 cursor-default" type="button" disabled>
            {ctaConfig.buttonText}
         </button>
      </div>
   )}
</div>
```

**Step 5: Verify build**

```bash
bun run typecheck
```

**Step 6: Commit**

```bash
git add apps/web/src/features/forms/ui/form-canvas.tsx
git commit -m "feat(forms): update canvas with CTA wrapper preview and new field type support"
```

---

## Task 5: form-preview.tsx — CSS vars engine matching SDK

**Files:**
- Modify: `apps/web/src/features/forms/ui/form-preview.tsx`

**Step 1: Update `FormPreviewProps` to include CTA fields and new field types**

```typescript
interface FormPreviewProps {
   name: string;
   description: string;
   title: string;
   subtitle: string;
   icon: string;
   buttonText: string;
   layout: "card" | "inline" | "banner";
   fields: FormField[];
}
```

**Step 2: Add preview renderers for new field types**

Add `PreviewNumberField`, `PreviewDateField`, `PreviewRatingField`, `PreviewFileField`:

```tsx
function PreviewNumberField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input id={`preview-${field.id}`} placeholder={field.placeholder} readOnly type="number" />
      </div>
   );
}

function PreviewDateField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input id={`preview-${field.id}`} readOnly type="date" />
      </div>
   );
}

function PreviewRatingField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
         <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
               <Star key={`star-${star}`} className="size-6 text-muted-foreground/40 fill-muted-foreground/10" />
            ))}
         </div>
      </div>
   );
}

function PreviewFileField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input id={`preview-${field.id}`} readOnly type="file" />
      </div>
   );
}
```

**Step 3: Update `FIELD_RENDERERS` map**

```typescript
const FIELD_RENDERERS: Record<FormField["type"], React.ComponentType<{ field: FormField }>> = {
   text: PreviewTextField,
   email: PreviewEmailField,
   textarea: PreviewTextareaField,
   checkbox: PreviewCheckboxField,
   select: PreviewSelectField,
   number: PreviewNumberField,
   date: PreviewDateField,
   rating: PreviewRatingField,
   file: PreviewFileField,
};
```

**Step 4: Update `FormPreview` to use CTA wrapper and CSS-vars-like styling**

Wrap the preview in a container with a comment noting it mirrors the SDK CSS vars:

```tsx
export function FormPreview({ name, description, title, subtitle, icon, buttonText, layout, fields }: FormPreviewProps) {
   const displayTitle = title || name || "Sem título";
   const displaySubtitle = subtitle || description;

   return (
      <div className="max-w-2xl mx-auto space-y-3">
         {/* Mirror the SDK embed appearance */}
         <p className="text-xs text-muted-foreground text-center">
            Este preview representa exatamente como o formulário aparece no blog
         </p>
         <Card className="border-2">
            <CardHeader>
               <div className="space-y-1">
                  {icon && <span className="text-2xl">{icon}</span>}
                  <CardTitle className="text-xl">{displayTitle}</CardTitle>
                  {displaySubtitle && <CardDescription>{displaySubtitle}</CardDescription>}
               </div>
            </CardHeader>
            <CardContent>
               {fields.length === 0 ? (
                  <PreviewEmptyState />
               ) : (
                  <div className="space-y-6">
                     {fields.map((field) => {
                        const Renderer = FIELD_RENDERERS[field.type];
                        return <Renderer field={field} key={field.id} />;
                     })}
                     <div className="pt-2">
                        <Button disabled type="button">{buttonText || "Enviar"}</Button>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
```

**Step 5: Typecheck**

```bash
bun run typecheck
```

**Step 6: Commit**

```bash
git add apps/web/src/features/forms/ui/form-preview.tsx
git commit -m "feat(forms): update preview with CTA fields and 4 new field renderers"
```

---

## Task 6: form-templates.tsx — New template selector component

**Files:**
- Create: `apps/web/src/features/forms/ui/form-templates.tsx`

**Step 1: Create the template definitions**

```typescript
import type { FieldType } from "./field-palette";
import type { FormField } from "./form-canvas";

export interface FormTemplate {
   id: string;
   name: string;
   description: string;
   type: "capture" | "intent" | "engagement" | "gate" | "blank";
   icon: string;
   title: string;
   subtitle: string;
   buttonText: string;
   fields: Omit<FormField, "id">[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
   {
      id: "blank",
      name: "Em branco",
      description: "Comece com um formulário vazio",
      type: "blank",
      icon: "📝",
      title: "",
      subtitle: "",
      buttonText: "Enviar",
      fields: [],
   },
   {
      id: "newsletter",
      name: "Newsletter",
      description: "Captura simples de e-mail",
      type: "capture",
      icon: "📧",
      title: "Receba nossos conteúdos exclusivos",
      subtitle: "Junte-se a milhares de leitores. Sem spam, cancele quando quiser.",
      buttonText: "Quero receber",
      fields: [
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
      ],
   },
   {
      id: "lead-magnet",
      name: "Lead magnet",
      description: "Nome + e-mail para material grátis",
      type: "capture",
      icon: "🎁",
      title: "Baixe gratuitamente",
      subtitle: "Preencha para receber o material no seu e-mail.",
      buttonText: "Quero o material",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
      ],
   },
   {
      id: "demo-request",
      name: "Demo request",
      description: "Nome + e-mail + empresa + mensagem",
      type: "intent",
      icon: "🎯",
      title: "Agende uma demonstração",
      subtitle: "Veja como nossa solução pode ajudar sua empresa.",
      buttonText: "Agendar demo",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
         { type: "text", label: "Empresa", placeholder: "Nome da empresa", required: true },
         { type: "textarea", label: "Mensagem", placeholder: "Como podemos ajudar?", required: false },
      ],
   },
   {
      id: "free-consultation",
      name: "Consulta gratuita",
      description: "Nome + e-mail + telefone",
      type: "intent",
      icon: "📞",
      title: "Agende uma consulta gratuita",
      subtitle: "Fale com um especialista sem compromisso.",
      buttonText: "Agendar consulta",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
         { type: "text", label: "Telefone", placeholder: "(00) 00000-0000", required: false },
      ],
   },
   {
      id: "quote-request",
      name: "Orçamento",
      description: "Nome + e-mail + empresa + budget + mensagem",
      type: "intent",
      icon: "💰",
      title: "Solicite um orçamento",
      subtitle: "Receba uma proposta personalizada para seu projeto.",
      buttonText: "Solicitar orçamento",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
         { type: "text", label: "Empresa", placeholder: "Nome da empresa", required: false },
         { type: "select", label: "Budget", options: ["Até R$ 5k", "R$ 5k - 20k", "R$ 20k - 50k", "Acima de R$ 50k"], required: false },
         { type: "textarea", label: "Descreva seu projeto", placeholder: "Conte-nos sobre o projeto...", required: false },
      ],
   },
   {
      id: "waitlist",
      name: "Waitlist",
      description: "Nome + e-mail para lista de espera",
      type: "capture",
      icon: "⏳",
      title: "Entre na lista de espera",
      subtitle: "Seja o primeiro a saber quando lançarmos.",
      buttonText: "Quero entrar na fila",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
      ],
   },
   {
      id: "webinar",
      name: "Webinar / Evento",
      description: "Nome + e-mail + empresa (opcional)",
      type: "capture",
      icon: "🎙️",
      title: "Reserve sua vaga",
      subtitle: "Participe ao vivo e tire suas dúvidas em tempo real.",
      buttonText: "Quero participar",
      fields: [
         { type: "text", label: "Nome", placeholder: "Seu nome", required: true },
         { type: "email", label: "E-mail", placeholder: "seu@email.com", required: true },
         { type: "text", label: "Empresa", placeholder: "Nome da empresa (opcional)", required: false },
      ],
   },
   {
      id: "article-feedback",
      name: "Feedback do artigo",
      description: "Avaliação + comentário opcional",
      type: "engagement",
      icon: "⭐",
      title: "Este artigo foi útil?",
      subtitle: "Sua opinião nos ajuda a criar conteúdo melhor.",
      buttonText: "Enviar feedback",
      fields: [
         { type: "rating", label: "Como você avalia este artigo?", required: true },
         { type: "textarea", label: "Comentário (opcional)", placeholder: "O que poderíamos melhorar?", required: false },
      ],
   },
];
```

**Step 2: Create the template selector UI component**

```tsx
// Render a grid of template cards with badge for type
// Use Dialog or direct render depending on context

interface FormTemplateSelectorProps {
   onSelect: (template: FormTemplate) => void;
}

const TYPE_LABELS: Record<FormTemplate["type"], string> = {
   capture: "Captura",
   intent: "Intenção",
   engagement: "Engajamento",
   gate: "Gate",
   blank: "Em branco",
};

export function FormTemplateSelector({ onSelect }: FormTemplateSelectorProps) {
   return (
      <div className="space-y-6">
         <div>
            <h2 className="text-xl font-semibold">Escolha um template</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Comece com um template pronto ou em branco
            </p>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FORM_TEMPLATES.map((template) => (
               <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  type="button"
                  className="group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-accent"
               >
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                     <p className="font-medium text-sm">{template.name}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{TYPE_LABELS[template.type]}</Badge>
               </button>
            ))}
         </div>
      </div>
   );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/features/forms/ui/form-templates.tsx
git commit -m "feat(forms): add template selector with 9 templates (newsletter, lead magnet, demo, etc)"
```

---

## Task 7: form-header.tsx — New header component (InsightHeader pattern)

**Files:**
- Create: `apps/web/src/features/forms/ui/form-header.tsx`

**Step 1: Create `form-header.tsx` based on `insight-header.tsx`**

Key differences from InsightHeader:
- Icon is `ClipboardList` (static, no type switching)
- Back link goes to forms list `/$slug/$teamSlug/forms`
- Dropdown has: Duplicar, Ativar/Desativar, Deletar
- No type tabs (tabs will be handled in `form-builder.tsx`)

```tsx
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Copy, Ellipsis, Loader2, Power, Save, Trash2 } from "lucide-react";
import { InlineEditableText } from "@/features/analytics/ui/inline-editable-text";

interface FormHeaderProps {
   name: string;
   description: string;
   isActive: boolean;
   onNameChange: (name: string) => void;
   onDescriptionChange: (description: string) => void;
   onSave: () => void;
   isSaving: boolean;
   onDuplicate?: () => void;
   onToggleActive?: () => void;
   onDelete?: () => void;
   backTo: { slug: string; teamSlug: string };
}

export function FormHeader({
   name,
   description,
   isActive,
   onNameChange,
   onDescriptionChange,
   onSave,
   isSaving,
   onDuplicate,
   onToggleActive,
   onDelete,
   backTo,
}: FormHeaderProps) {
   return (
      <div className="border-b bg-background">
         <div className="container mx-auto px-4 py-4">
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                     <Link
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        params={backTo as never}
                        to="/$slug/$teamSlug/forms"
                     >
                        <ArrowLeft className="size-5" />
                     </Link>
                     <ClipboardList className="size-5 flex-shrink-0 text-muted-foreground" />
                     <InlineEditableText
                        className="text-2xl font-semibold"
                        onSave={onNameChange}
                        placeholder="Nome do formulário"
                        value={name}
                     />
                  </div>
                  <div className="pl-[68px]">
                     <InlineEditableText
                        className="text-sm text-muted-foreground"
                        onSave={onDescriptionChange}
                        placeholder="Adicionar descrição..."
                        value={description}
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2 flex-shrink-0">
                  <Button disabled={isSaving} onClick={onSave}>
                     {isSaving ? (
                        <>
                           <Loader2 className="size-4 mr-2 animate-spin" />
                           Salvando...
                        </>
                     ) : (
                        <>
                           <Save className="size-4 mr-2" />
                           Salvar
                        </>
                     )}
                  </Button>

                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline">
                           <Ellipsis className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        {onDuplicate && (
                           <DropdownMenuItem onClick={onDuplicate}>
                              <Copy className="size-4 mr-2" />
                              Duplicar
                           </DropdownMenuItem>
                        )}
                        {onToggleActive && (
                           <DropdownMenuItem onClick={onToggleActive}>
                              <Power className="size-4 mr-2" />
                              {isActive ? "Desativar" : "Ativar"}
                           </DropdownMenuItem>
                        )}
                        {onDelete && (
                           <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onClick={onDelete}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 Deletar
                              </DropdownMenuItem>
                           </>
                        )}
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
         </div>
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/features/forms/ui/form-header.tsx
git commit -m "feat(forms): add FormHeader component with inline editing and dropdown actions"
```

---

## Task 8: form-builder.tsx — Full redesign (sidebar layout + 3 tabs + CTA panel)

**Files:**
- Modify: `apps/web/src/features/forms/ui/form-builder.tsx`

**Step 1: Understand the new structure before coding**

The new `FormBuilder` has this structure:
```
FormHeader (with inline editable name/description)
────────────────────────────────────────────────────
[ Construtor ] [ Visualizar ] [ Incorporar ]
────────────────────────────────────────────────────
┌────────────────────────┬──────────────────────────┐
│ LEFT SIDEBAR (280px)   │ MAIN CANVAS (flex-1)     │
│ ▼ Apresentação         │                           │
│   icon, title,         │ Live preview of CTA form  │
│   subtitle, buttonText │ with draggable fields     │
│                         │                           │
│ ▶ Campos               │                           │
│   + palette            │                           │
│                         │                           │
│ ▶ Configurações        │                           │
│   success msg, redirect │                           │
│   email notifications   │                           │
└────────────────────────┴──────────────────────────┘
```

**Step 2: Add state for new CTA fields**

```typescript
const [title, setTitle] = useState("");
const [subtitle, setSubtitle] = useState("");
const [icon, setIcon] = useState("");
const [buttonText, setButtonText] = useState("Enviar");
const [layout, setLayout] = useState<"card" | "inline" | "banner">("card");
const [showTemplates, setShowTemplates] = useState(isCreateMode);
```

**Step 3: Populate CTA state in the `useEffect` for existing forms**

```typescript
useEffect(() => {
   if (existingForm && !hasInitialized) {
      setName(existingForm.name);
      setDescription(existingForm.description ?? "");
      setTitle(existingForm.title ?? "");
      setSubtitle(existingForm.subtitle ?? "");
      setIcon(existingForm.icon ?? "");
      setButtonText(existingForm.buttonText ?? "Enviar");
      setLayout((existingForm.layout as "card" | "inline" | "banner") ?? "card");
      setFields(
         (existingForm.fields as FormField[]).map((f) => ({
            ...f,
            id: f.id || generateFieldId(),
         })),
      );
      setHasInitialized(true);
   }
}, [existingForm, hasInitialized]);
```

**Step 4: Add template handler**

```typescript
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
```

**Step 5: Update `handleSave` to pass new fields**

```typescript
if (isCreateMode) {
   createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      fields: mappedFields,
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
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      icon: icon.trim() || undefined,
      buttonText: buttonText.trim() || "Enviar",
      layout,
   });
}
```

**Step 6: Replace the entire render section**

The render becomes:

```tsx
// If create mode and templates not dismissed yet, show template selector
if (showTemplates && isCreateMode) {
   return (
      <div className="flex flex-col gap-0 h-full">
         <div className="border-b bg-background">
            <div className="container mx-auto px-4 py-4 flex items-center gap-3">
               <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <ArrowLeft className="size-5" />
               </Button>
               <h1 className="text-xl font-semibold">Novo formulário</h1>
            </div>
         </div>
         <div className="container mx-auto px-4 py-8">
            <FormTemplateSelector onSelect={handleTemplateSelect} />
         </div>
      </div>
   );
}

return (
   <div className="flex flex-col gap-0 h-full">
      <FormHeader
         name={name}
         description={description}
         isActive={existingForm?.isActive ?? true}
         onNameChange={setName}
         onDescriptionChange={setDescription}
         onSave={handleSave}
         isSaving={isSaving}
         onToggleActive={!isCreateMode ? handleToggleActive : undefined}
         onDelete={!isCreateMode ? handleDelete : undefined}
         backTo={{ slug: slug ?? "", teamSlug: teamSlug ?? "" }}
      />

      {/* Tab bar */}
      <div className="border-b bg-background">
         <div className="container mx-auto px-4">
            <div className="flex items-center gap-0">
               {FORM_TABS.map((tab) => (
                  <Button
                     key={tab.value}
                     className={cn(...)}
                     onClick={() => setActiveTab(tab.value)}
                     variant="ghost"
                  >
                     {tab.label}
                  </Button>
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
                           <CollapsibleSection title="Apresentação" defaultOpen>
                              <div className="space-y-3">
                                 <div className="space-y-1">
                                    <Label className="text-xs">Ícone (emoji)</Label>
                                    <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🎯" className="h-8" />
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs">Título do CTA</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Receba nossos conteúdos" className="h-8" />
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs">Subtítulo</Label>
                                    <Textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Descrição breve..." rows={2} className="resize-none text-sm" />
                                 </div>
                                 <div className="space-y-1">
                                    <Label className="text-xs">Texto do botão</Label>
                                    <Input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Enviar" className="h-8" />
                                 </div>
                              </div>
                           </CollapsibleSection>

                           {/* Campos section — the field palette */}
                           <CollapsibleSection title="Campos" defaultOpen>
                              <FieldPalette onAddField={handleAddField} />
                           </CollapsibleSection>

                           {/* Configurações section */}
                           <CollapsibleSection title="Configurações">
                              <div className="space-y-3">
                                 <div className="space-y-1">
                                    <Label className="text-xs">Mensagem de sucesso</Label>
                                    <Textarea value={successMessage} onChange={e => setSuccessMessage(e.target.value)} placeholder="Obrigado! Entraremos em contato." rows={2} className="resize-none text-sm" />
                                 </div>
                                 {/* email notifications toggle */}
                              </div>
                           </CollapsibleSection>
                        </CardContent>
                     </Card>
                  </aside>

                  {/* MAIN CANVAS */}
                  <div className="flex-1 min-w-0">
                     <FormCanvas
                        fields={fields}
                        ctaConfig={{ title, subtitle, icon, buttonText, layout }}
                        onFieldsReorder={handleFieldsReorder}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldRemove={handleFieldRemove}
                        onDropNewField={handleAddField}
                     />
                  </div>
               </div>
            )}

            {activeTab === "preview" && (
               <FormPreview
                  name={name}
                  description={description}
                  title={title}
                  subtitle={subtitle}
                  icon={icon}
                  buttonText={buttonText}
                  layout={layout}
                  fields={fields}
               />
            )}

            {activeTab === "embed" && (
               <FormEmbedPanel formId={formId} />
            )}

            {!isCreateMode && activeTab === "submissions" && (
               <SubmissionsTable formId={formId} />
            )}
         </div>
      </div>
   </div>
);
```

**Key detail:** Add a local `CollapsibleSection` helper component:

```tsx
function CollapsibleSection({ title, children, defaultOpen = false }: {
   title: string;
   children: React.ReactNode;
   defaultOpen?: boolean;
}) {
   const [open, setOpen] = useState(defaultOpen);
   return (
      <div className="space-y-2">
         <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 w-full text-xs font-semibold text-foreground uppercase tracking-wider"
         >
            <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
            {title}
         </button>
         {open && <div>{children}</div>}
      </div>
   );
}
```

Also add `handleDelete` and `handleToggleActive` handlers.

**Step 7: Update `createDefaultField` to support new types**

```typescript
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
   // ... rest of function
}
```

**Step 8: Typecheck**

```bash
bun run typecheck
```

**Step 9: Commit**

```bash
git add apps/web/src/features/forms/ui/form-builder.tsx
git commit -m "feat(forms): complete Form Builder redesign with sidebar layout, CTA panel, templates, and new tabs"
```

---

## Task 9: form-embed-panel.tsx — New embed tab component

**Files:**
- Create: `apps/web/src/features/forms/ui/form-embed-panel.tsx`

**Step 1: Create the embed instructions component**

```tsx
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FormEmbedPanelProps {
   formId: string;
}

export function FormEmbedPanel({ formId }: FormEmbedPanelProps) {
   const [copiedSnippet, setCopiedSnippet] = useState(false);
   const [copiedId, setCopiedId] = useState(false);

   const snippet = `// 1. Instale o SDK:
// npm install @contentta/sdk

// 2. Inicialize:
const sdk = createBrowserSdk({
  apiKey: "SUA_API_KEY",
  organizationId: "SUA_ORG_ID"
})

// 3. Incorpore o formulário:
<div id="meu-form"></div>
sdk.forms.embedForm("${formId}", "meu-form")`;

   const handleCopySnippet = () => {
      navigator.clipboard.writeText(snippet);
      setCopiedSnippet(true);
      toast.success("Snippet copiado!");
      setTimeout(() => setCopiedSnippet(false), 2000);
   };

   const handleCopyId = () => {
      navigator.clipboard.writeText(formId);
      setCopiedId(true);
      toast.success("ID copiado!");
      setTimeout(() => setCopiedId(false), 2000);
   };

   if (formId === "new") {
      return (
         <div className="max-w-2xl mx-auto text-center py-16">
            <p className="text-muted-foreground">
               Salve o formulário primeiro para obter o snippet de incorporação.
            </p>
         </div>
      );
   }

   return (
      <div className="max-w-2xl mx-auto space-y-6">
         <div>
            <h2 className="text-lg font-semibold">Como incorporar</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Cole este código na sua página para exibir o formulário.
            </p>
         </div>

         <Card>
            <CardContent className="p-4">
               <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-medium">Snippet de incorporação</p>
                  <Button variant="outline" size="sm" onClick={handleCopySnippet} className="shrink-0">
                     {copiedSnippet ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
                     {copiedSnippet ? "Copiado!" : "Copiar snippet"}
                  </Button>
               </div>
               <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                  {snippet}
               </pre>
            </CardContent>
         </Card>

         <Card>
            <CardContent className="p-4 flex items-center justify-between gap-3">
               <div>
                  <p className="text-sm font-medium">ID do formulário</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{formId}</p>
               </div>
               <Button variant="outline" size="sm" onClick={handleCopyId}>
                  {copiedId ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
                  {copiedId ? "Copiado!" : "Copiar ID"}
               </Button>
            </CardContent>
         </Card>
      </div>
   );
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add apps/web/src/features/forms/ui/form-embed-panel.tsx
git commit -m "feat(forms): add FormEmbedPanel with SDK snippet and form ID copy"
```

---

## Task 10: SDK — Replace hardcoded CSS with CSS custom properties

**Files:**
- Modify: `libraries/sdk/src/forms.ts`

**Step 1: Update `FormDefinition` interface to include new CTA fields**

```typescript
interface FormDefinition {
   id: string;
   name: string;
   description?: string;
   fields: FormField[];
   settings?: {
      successMessage?: string;
      redirectUrl?: string;
   };
   title?: string;
   subtitle?: string;
   icon?: string;
   buttonText?: string;
   layout?: "card" | "inline" | "banner";
}
```

Also update `FormField` type union:
```typescript
type: "text" | "email" | "textarea" | "checkbox" | "select" | "number" | "date" | "rating" | "file";
```

**Step 2: Replace `FORM_STYLES` with CSS custom properties**

Replace the entire `FORM_STYLES` constant with:

```typescript
const FORM_STYLES = `
.contentta-form {
	--cf-bg: var(--background, #fff);
	--cf-fg: var(--foreground, #09090b);
	--cf-muted: var(--muted, #f4f4f5);
	--cf-muted-fg: var(--muted-foreground, #71717a);
	--cf-border: var(--border, #e4e4e7);
	--cf-radius: var(--radius, 0.5rem);
	--cf-primary: var(--primary, #18181b);
	--cf-primary-fg: var(--primary-foreground, #fafafa);
	--cf-ring: var(--ring, #18181b);
	--cf-destructive: var(--destructive, #ef4444);

	font-family: inherit;
	max-width: 480px;
	margin: 0 auto;
	background: var(--cf-bg);
	color: var(--cf-fg);
	border-radius: var(--cf-radius);
}
.contentta-form__cta {
	margin-bottom: 1.25rem;
}
.contentta-form__cta-icon {
	font-size: 1.75rem;
	margin-bottom: 0.375rem;
}
.contentta-form__cta-title {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.25rem;
	color: var(--cf-fg);
}
.contentta-form__cta-subtitle {
	font-size: 0.875rem;
	color: var(--cf-muted-fg);
	margin: 0;
}
.contentta-form__title {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.25rem;
	color: var(--cf-fg);
}
.contentta-form__description {
	font-size: 0.875rem;
	color: var(--cf-muted-fg);
	margin: 0 0 1.25rem;
}
.contentta-form__field {
	margin-bottom: 1rem;
}
.contentta-form__label {
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	margin-bottom: 0.375rem;
	color: var(--cf-fg);
}
.contentta-form__required {
	color: var(--cf-destructive);
	margin-left: 0.125rem;
}
.contentta-form__input,
.contentta-form__textarea,
.contentta-form__select {
	display: block;
	width: 100%;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	line-height: 1.5;
	border: 1px solid var(--cf-border);
	border-radius: calc(var(--cf-radius) - 2px);
	background: var(--cf-bg);
	color: var(--cf-fg);
	box-sizing: border-box;
	transition: border-color 0.15s ease;
	font-family: inherit;
}
.contentta-form__input:focus,
.contentta-form__textarea:focus,
.contentta-form__select:focus {
	outline: none;
	border-color: var(--cf-ring);
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--cf-ring) 20%, transparent);
}
.contentta-form__textarea {
	min-height: 5rem;
	resize: vertical;
}
.contentta-form__checkbox-wrapper {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
}
.contentta-form__checkbox {
	margin-top: 0.25rem;
	accent-color: var(--cf-primary);
}
.contentta-form__rating {
	display: flex;
	gap: 0.375rem;
}
.contentta-form__star {
	font-size: 1.5rem;
	cursor: pointer;
	color: var(--cf-border);
	transition: color 0.1s ease;
	background: none;
	border: none;
	padding: 0;
	line-height: 1;
}
.contentta-form__star:hover,
.contentta-form__star--active {
	color: #eab308;
}
.contentta-form__error {
	font-size: 0.75rem;
	color: var(--cf-destructive);
	margin-top: 0.25rem;
	min-height: 0;
}
.contentta-form__submit {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.5rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--cf-primary-fg);
	background: var(--cf-primary);
	border: none;
	border-radius: calc(var(--cf-radius) - 2px);
	cursor: pointer;
	transition: opacity 0.15s ease;
	font-family: inherit;
}
.contentta-form__submit:hover {
	opacity: 0.9;
}
.contentta-form__submit:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
.contentta-form__success {
	padding: 1rem;
	font-size: 0.875rem;
	color: var(--cf-fg);
	background: color-mix(in srgb, var(--cf-primary) 8%, var(--cf-bg));
	border: 1px solid color-mix(in srgb, var(--cf-primary) 20%, transparent);
	border-radius: var(--cf-radius);
	text-align: center;
}
`;
```

**Step 3: Update `renderForm` to use CTA fields**

```typescript
private renderForm(form: FormDefinition): string {
   // Prefer title/subtitle over name/description for CTA display
   const displayTitle = form.title || form.name;
   const displaySubtitle = form.subtitle || form.description;

   const ctaHtml = (form.icon || displayTitle || displaySubtitle) ? `
<div class="contentta-form__cta">
   ${form.icon ? `<div class="contentta-form__cta-icon">${escapeHtml(form.icon)}</div>` : ""}
   ${displayTitle ? `<h3 class="contentta-form__cta-title">${escapeHtml(displayTitle)}</h3>` : ""}
   ${displaySubtitle ? `<p class="contentta-form__cta-subtitle">${escapeHtml(displaySubtitle)}</p>` : ""}
</div>` : "";

   const fieldsHtml = form.fields
      .map((field) => this.renderField(field))
      .join("\n");

   const buttonText = form.buttonText || "Enviar";

   return `
<div class="contentta-form">
   ${ctaHtml}
   <form class="contentta-form__form" novalidate>
      ${fieldsHtml}
      <button type="submit" class="contentta-form__submit">${escapeHtml(buttonText)}</button>
   </form>
</div>`;
}
```

**Step 4: Add rendering for new field types in `renderField`**

Add cases for `number`, `date`, `rating`, `file`:

```typescript
case "number":
   inputHtml = `<input
      type="number"
      id="contentta-field-${escapedId}"
      name="${escapedId}"
      class="contentta-form__input"
      placeholder="${escapedPlaceholder}"
      ${requiredAttr}
   />`;
   break;

case "date":
   inputHtml = `<input
      type="date"
      id="contentta-field-${escapedId}"
      name="${escapedId}"
      class="contentta-form__input"
      ${requiredAttr}
   />`;
   break;

case "rating": {
   const stars = [1, 2, 3, 4, 5].map(n =>
      `<button type="button" class="contentta-form__star" data-rating="${n}" aria-label="${n} estrela${n > 1 ? 's' : ''}">★</button>`
   ).join("");
   inputHtml = `<div class="contentta-form__rating" id="contentta-field-${escapedId}" data-field-id="${escapedId}">
      <input type="hidden" name="${escapedId}" id="contentta-rating-input-${escapedId}" />
      ${stars}
   </div>`;
   break;
}

case "file":
   inputHtml = `<input
      type="file"
      id="contentta-field-${escapedId}"
      name="${escapedId}"
      class="contentta-form__input"
      ${requiredAttr}
   />`;
   break;
```

Also update the `default` case to remove the incorrect exhaustive check (now with 9 types).

**Step 5: Add rating interactivity in `setupFormHandler`**

After the form submit listener, add rating star click handlers:

```typescript
// Setup star rating fields
const ratingContainers = container.querySelectorAll<HTMLDivElement>(".contentta-form__rating");
for (const ratingContainer of ratingContainers) {
   const fieldId = ratingContainer.getAttribute("data-field-id");
   if (!fieldId) continue;
   const stars = ratingContainer.querySelectorAll<HTMLButtonElement>(".contentta-form__star");
   const hiddenInput = container.querySelector<HTMLInputElement>(`#contentta-rating-input-${CSS.escape(fieldId)}`);
   
   for (const [i, star] of stars.entries()) {
      star.addEventListener("click", () => {
         const value = i + 1;
         if (hiddenInput) hiddenInput.value = String(value);
         // Update star visual state
         for (const [j, s] of stars.entries()) {
            s.classList.toggle("contentta-form__star--active", j <= i);
         }
      });
   }
}
```

**Step 6: Run typecheck and build**

```bash
bun run typecheck
```

**Step 7: Commit**

```bash
git add libraries/sdk/src/forms.ts
git commit -m "feat(sdk): replace hardcoded CSS with shadcn-compatible CSS custom properties, add CTA fields and 4 new field types"
```

---

## Task 11: Full integration test and verification

**Step 1: Run full typecheck**

```bash
bun run typecheck
```

Expected: No errors

**Step 2: Run linter/formatter**

```bash
bun run check
```

Expected: No lint errors (apply `--write` if formatting fixes needed)

**Step 3: Run tests**

```bash
bun run test
```

Expected: All tests pass

**Step 4: Start dev server and manually verify**

```bash
bun dev
```

Manual checklist:
- [ ] Navigate to Forms → Create new → Template selector appears
- [ ] Select "Newsletter" template → form builder shows pre-filled CTA fields
- [ ] Sidebar shows Apresentação / Campos / Configurações sections
- [ ] Apresentação fields update the canvas live preview
- [ ] Can drag/add new field types (number, date, rating, file) from Campos section
- [ ] Tab "Visualizar" shows CTA wrapper with title/subtitle/icon
- [ ] Tab "Incorporar" shows code snippet with form ID
- [ ] Saving creates/updates the form with new CTA fields
- [ ] Edit existing form → CTA fields populated from DB
- [ ] Header has inline editable name and description
- [ ] Header dropdown shows Duplicar / Ativar-Desativar / Deletar

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify form builder redesign integration complete"
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/database/src/schemas/forms.ts` | Modify | Add 5 CTA columns + 4 new field types |
| `packages/database/src/repositories/form-repository.ts` | Modify | Include new CTA fields in updateForm |
| `apps/web/src/integrations/orpc/router/forms.ts` | Modify | Update Zod schemas for all new fields |
| `apps/sdk-server/src/orpc/router/forms.ts` | Modify | New field types + CTA columns in GET |
| `apps/web/src/features/forms/ui/field-palette.tsx` | Modify | 4 new types + collapsible groups |
| `apps/web/src/features/forms/ui/form-canvas.tsx` | Modify | New field types + CTA live preview wrapper |
| `apps/web/src/features/forms/ui/form-preview.tsx` | Modify | New field renderers + CTA display |
| `apps/web/src/features/forms/ui/form-builder.tsx` | Modify | Full redesign: sidebar + 4 tabs + templates |
| `apps/web/src/features/forms/ui/form-header.tsx` | Create | New header (InsightHeader pattern) |
| `apps/web/src/features/forms/ui/form-templates.tsx` | Create | Template selector with 9 templates |
| `apps/web/src/features/forms/ui/form-embed-panel.tsx` | Create | Embed tab with SDK snippet |
| `libraries/sdk/src/forms.ts` | Modify | CSS vars + CTA fields + 4 new field renderers |
