import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Checkbox } from "@packages/ui/components/checkbox";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Textarea } from "@packages/ui/components/textarea";
import { Eye, Star } from "lucide-react";
import type { FormField } from "./form-canvas";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Field renderers
// ─────────────────────────────────────────────────────────────────────────────

function PreviewTextField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            readOnly
            type="text"
         />
      </div>
   );
}

function PreviewEmailField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            readOnly
            type="email"
         />
      </div>
   );
}

function PreviewTextareaField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Textarea
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            readOnly
            rows={4}
         />
      </div>
   );
}

function PreviewCheckboxField({ field }: { field: FormField }) {
   return (
      <div className="flex items-center gap-2">
         <Checkbox disabled id={`preview-${field.id}`} />
         <Label className="cursor-default" htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
      </div>
   );
}

function PreviewSelectField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Select disabled>
            <SelectTrigger id={`preview-${field.id}`}>
               <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
               {(field.options ?? []).map((option, index) => (
                  <SelectItem key={`option-${index + 1}`} value={option}>
                     {option}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
      </div>
   );
}

function PreviewNumberField({ field }: { field: FormField }) {
   return (
      <div className="space-y-2">
         <Label htmlFor={`preview-${field.id}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <Input
            id={`preview-${field.id}`}
            placeholder={field.placeholder}
            readOnly
            type="number"
         />
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
         <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
         </Label>
         <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
               <Star
                  className="size-6 text-muted-foreground/40 fill-muted-foreground/10"
                  key={`star-${star}`}
               />
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

const FIELD_RENDERERS: Record<
   FormField["type"],
   React.ComponentType<{ field: FormField }>
> = {
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

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function PreviewEmptyState() {
   return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
         <div className="size-12 rounded-full flex items-center justify-center mb-4 bg-muted text-muted-foreground">
            <Eye className="size-5" />
         </div>
         <p className="text-sm text-muted-foreground">
            Adicione campos ao formulário para visualizar o preview
         </p>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Preview
// ─────────────────────────────────────────────────────────────────────────────

export function FormPreview({
   name,
   description,
   title,
   subtitle,
   icon,
   buttonText,
   fields,
}: FormPreviewProps) {
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
                  {displaySubtitle && (
                     <CardDescription>{displaySubtitle}</CardDescription>
                  )}
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
                        <Button disabled type="button">
                           {buttonText || "Enviar"}
                        </Button>
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
