import { useAppForm } from "@packages/ui/components/form";
import { type FormEvent, useCallback } from "react";
import { z } from "zod";

export const contentRequestFormSchema = z.object({
   topic: z.string().min(1, "Topic is required"),
   briefDescription: z.string().min(1, "Brief description is required"),
});

export type ContentRequestFormData = z.infer<typeof contentRequestFormSchema>;

export type ContentRequestFormProps = {
   defaultValues?: Partial<ContentRequestFormData>;
   onSubmit: (values: ContentRequestFormData) => Promise<void>;
};

export function useContentRequestForm({
   defaultValues,
   onSubmit,
}: ContentRequestFormProps) {
   const form = useAppForm({
      defaultValues: {
         topic: defaultValues?.topic || "",
         briefDescription: defaultValues?.briefDescription || "",
      } as ContentRequestFormData,
      onSubmit: async ({ value }) => {
         await onSubmit(value);
      },
      validators: {
         onBlur: contentRequestFormSchema,
      },
   });

   const handleSubmit = useCallback(
      (e: FormEvent) => {
         e.preventDefault();
         e.stopPropagation();
         form.handleSubmit();
      },
      [form],
   );

   return {
      form,
      handleSubmit,
   };
}

export type ContentRequestForm = ReturnType<
   typeof useContentRequestForm
>["form"];
