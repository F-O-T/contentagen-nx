"use client";

import { Button } from "@packages/ui/components/button";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { Textarea } from "@packages/ui/components/textarea";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { KeywordsInput } from "./keywords-input";

type ContentMeta = {
   title: string;
   description: string;
   slug: string;
   keywords?: string[];
   sources?: string[];
};

type ContentFrontmatterPanelProps = {
   contentId: string;
   meta: ContentMeta;
   body: string;
   onMetaChange: (meta: Partial<ContentMeta>) => void;
   isSaving?: boolean;
   disabled?: boolean;
   className?: string;
};

const metaSchema = z.object({
   title: z.string().min(1, "Title is required").max(200, "Title is too long"),
   description: z.string().max(500, "Description is too long"),
   slug: z
      .string()
      .min(1, "Slug is required")
      .regex(
         /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
         "Slug must be lowercase with hyphens only",
      ),
   keywords: z.array(z.string()).max(10, "Maximum 10 keywords allowed"),
});

function generateSlugFromTitle(title: string): string {
   return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Collapse multiple hyphens
}

export function ContentFrontmatterPanel({
   contentId: _contentId,
   meta,
   body: _body,
   onMetaChange,
   isSaving = false,
   disabled = false,
   className,
}: ContentFrontmatterPanelProps) {
   const [isOpen, setIsOpen] = useState(true);
   // Track if we're currently updating from external props to avoid loops
   const isExternalUpdate = useRef(false);
   // Track the last external meta values to detect external changes
   const lastExternalMeta = useRef({
      title: meta.title,
      description: meta.description,
      slug: meta.slug,
      keywords: meta.keywords,
   });

   const form = useForm({
      defaultValues: {
         title: meta.title ?? "",
         description: meta.description ?? "",
         slug: meta.slug ?? "",
         keywords: meta.keywords ?? [],
      },
      validators: {
         onBlur: metaSchema as unknown as undefined,
      },
   });

   // Stable reference for keywords comparison
   const keywordsKey = JSON.stringify(meta.keywords ?? []);

   // Sync form with external meta changes (e.g., from agent tool calls)
   useEffect(() => {
      // Check if any external values have changed
      const titleChanged = meta.title !== lastExternalMeta.current.title;
      const descriptionChanged =
         meta.description !== lastExternalMeta.current.description;
      const slugChanged = meta.slug !== lastExternalMeta.current.slug;
      const keywordsChanged =
         keywordsKey !==
         JSON.stringify(lastExternalMeta.current.keywords ?? []);

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      if (
         titleChanged ||
         descriptionChanged ||
         slugChanged ||
         keywordsChanged
      ) {
         // Mark as external update to prevent save loop
         isExternalUpdate.current = true;

         // Update form values
         if (titleChanged) form.setFieldValue("title", meta.title ?? "");
         if (descriptionChanged)
            form.setFieldValue("description", meta.description ?? "");
         if (slugChanged) form.setFieldValue("slug", meta.slug ?? "");
         if (keywordsChanged)
            form.setFieldValue("keywords", [...(meta.keywords ?? [])]);

         // Update the ref to track new external values
         lastExternalMeta.current = {
            title: meta.title,
            description: meta.description,
            slug: meta.slug,
            keywords: meta.keywords,
         };

         // Reset external update flag after a short delay
         timeoutId = setTimeout(() => {
            isExternalUpdate.current = false;
         }, 100);
      }

      // Cleanup timeout on unmount or when dependencies change
      return () => {
         if (timeoutId) {
            clearTimeout(timeoutId);
         }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [
      meta.title,
      meta.description,
      meta.slug,
      keywordsKey,
      form.setFieldValue,
      meta.keywords,
   ]);

   // Debounced save callback - skip if it's an external update
   const { call: debouncedSave } = useDebouncedCallback(
      (updates: Partial<ContentMeta>) => {
         if (!isExternalUpdate.current) {
            // Update our ref to the new values we're saving
            lastExternalMeta.current = {
               ...lastExternalMeta.current,
               ...updates,
            };
            onMetaChange(updates);
         }
      },
      1000,
   );

   // Handle field changes with auto-save
   const handleFieldChange = useCallback(
      (
         field: "title" | "description" | "slug" | "keywords",
         value: string | string[],
      ) => {
         form.setFieldValue(field, value as never);
         debouncedSave({ [field]: value });
      },
      [form, debouncedSave],
   );

   // Auto-generate slug from title
   const handleTitleChange = useCallback(
      (title: string) => {
         form.setFieldValue("title", title);
         const currentSlug = form.getFieldValue("slug");
         const expectedSlug = generateSlugFromTitle(
            form.getFieldValue("title") ?? "",
         );

         // Only auto-generate if slug is empty or was auto-generated
         if (!currentSlug || currentSlug === expectedSlug) {
            const newSlug = generateSlugFromTitle(title);
            form.setFieldValue("slug", newSlug);
            debouncedSave({ title, slug: newSlug });
         } else {
            debouncedSave({ title });
         }
      },
      [form, debouncedSave],
   );

   // Regenerate slug from current title
   const handleRegenerateSlug = useCallback(() => {
      const title = form.getFieldValue("title") ?? "";
      const newSlug = generateSlugFromTitle(title);
      form.setFieldValue("slug", newSlug);
      debouncedSave({ slug: newSlug });
   }, [form, debouncedSave]);

   return (
      <Collapsible
         className={cn("border rounded-md bg-muted/30", className)}
         onOpenChange={setIsOpen}
         open={isOpen}
      >
         <CollapsibleTrigger asChild>
            <button
               className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
               type="button"
            >
               <div className="flex items-center gap-2">
                  <span>Frontmatter</span>
                  {isSaving && (
                     <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        {"Salvando..."}
                     </span>
                  )}
               </div>
               {isOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
               ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
               )}
            </button>
         </CollapsibleTrigger>

         <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* Title Field */}
            <form.Field name="title">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>{"Título"}</FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           disabled={disabled}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => handleTitleChange(e.target.value)}
                           placeholder={"Title Placeholder"}
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

            {/* Slug Field */}
            <form.Field name="slug">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>{"Slug"}</FieldLabel>
                        <div className="flex gap-2">
                           <Input
                              aria-invalid={isInvalid}
                              className="flex-1 font-mono text-sm"
                              disabled={disabled}
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 handleFieldChange("slug", e.target.value)
                              }
                              placeholder={"Slug Placeholder"}
                              type="text"
                              value={field.state.value}
                           />
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                    disabled={disabled}
                                    onClick={handleRegenerateSlug}
                                    size="icon"
                                    type="button"
                                    variant="outline"
                                 >
                                    <RefreshCw className="size-4" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                 Regenerate from title
                              </TooltipContent>
                           </Tooltip>
                        </div>
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            {/* Description Field */}
            <form.Field name="description">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           {"Descrição"}
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           disabled={disabled}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) =>
                              handleFieldChange("description", e.target.value)
                           }
                           placeholder={"Description Placeholder"}
                           rows={2}
                           value={field.state.value}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                           <span>SEO meta description</span>
                           <span>{field.state.value?.length ?? 0}/160</span>
                        </div>
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            {/* Keywords Field */}
            <form.Field name="keywords">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel>Keywords</FieldLabel>
                        <KeywordsInput
                           disabled={disabled}
                           onChange={(keywords) =>
                              handleFieldChange("keywords", keywords)
                           }
                           placeholder="Add keyword..."
                           value={field.state.value ?? []}
                        />
                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </CollapsibleContent>
      </Collapsible>
   );
}
