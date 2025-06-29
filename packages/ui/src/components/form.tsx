import * as LabelPrimitive from "@radix-ui/react-label";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import React from "react";
import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";

const { fieldContext, formContext, useFieldContext, useFormContext } =
   createFormHookContexts();

export const FieldContainer = React.forwardRef<
   React.ElementRef<"div">,
   React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
   return <div className={cn("space-y-2", className)} ref={ref} {...props} />;
});
FieldContainer.displayName = "FieldContainer";

export const FieldLabel = React.forwardRef<
   React.ElementRef<typeof LabelPrimitive.Root>,
   React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
   const field = useFieldContext();

   const isTouched = field.state.meta.isTouched;
   const hasErrors = field.state.meta.errors.length > 0;

   return (
      <LabelPrimitive.Label
         className={cn(isTouched && hasErrors && "text-destructive", className)}
         htmlFor={field.name}
         ref={ref}
         {...props}
      />
   );
});
FieldLabel.displayName = "FieldLabel";

export const FieldDescription = React.forwardRef<
   HTMLParagraphElement,
   React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
   const field = useFieldContext();

   return (
      <p
         className={cn("text-[0.8rem] text-muted-foreground", className)}
         id={`${field.name}-description`}
         ref={ref}
         {...props}
      />
   );
});
FieldDescription.displayName = "FieldDescription";

export const FieldMessage = React.forwardRef<
   HTMLParagraphElement,
   React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
   const field = useFieldContext();

   const isTouched = field.state.meta.isTouched;
   const hasErrors = field.state.meta.errors.length > 0;

   const formatErrorMessage = (error: unknown) => {
      if (typeof error === "string") return error;
      if (error instanceof Error) return error.message;
      if (Array.isArray(error) && error.length > 0) {
         const firstError = error[0];
         if (
            typeof firstError === "object" &&
            firstError !== null &&
            "message" in firstError
         ) {
            return String(firstError.message);
         }
      }
      if (typeof error === "object" && error !== null && "message" in error) {
         return String(error.message);
      }
      return String(`Unhandled error format: ${JSON.stringify(error)}`);
   };

   const formattedErrorMessages = field.state.meta.errors
      .map(formatErrorMessage)
      .join(", ");

   const body = isTouched && hasErrors ? formattedErrorMessages : children;

   if (!body) {
      return null;
   }

   return (
      <p
         className={cn(
            "from-muted-foreground text-sm font-medium",
            isTouched && hasErrors && "text-destructive",
            className,
         )}
         id={`${field.name}-message`}
         ref={ref}
         {...props}
      >
         {body}
      </p>
   );
});
FieldMessage.displayName = "FieldMessage";

export const FormSubmit = React.forwardRef<
   React.ElementRef<"button">,
   React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => {
   const form = useFormContext();

   return (
      <form.Subscribe
         selector={(state) => [
            state.canSubmit,
            state.isSubmitting,
            state.isTouched,
         ]}
      >
         {([canSubmit, isSubmitting, isTouched]) => (
            <Button
               className={cn("w-full", className)}
               disabled={isSubmitting || !canSubmit || !isTouched}
               ref={ref}
               type="submit"
               {...props}
            >
               {isSubmitting && (
                  <LoaderCircle className="size-4 animate-spin" />
               )}
               {children}
            </Button>
         )}
      </form.Subscribe>
   );
});
FormSubmit.displayName = "FormSubmit";

export const { useAppForm, withForm } = createFormHook({
   fieldComponents: {
      FieldContainer,
      FieldDescription,
      FieldLabel,
      FieldMessage,
   },
   fieldContext,
   formComponents: {
      FormSubmit,
   },
   formContext,
});
