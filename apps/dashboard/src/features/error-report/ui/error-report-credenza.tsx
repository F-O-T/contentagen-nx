import { captureClientEvent } from "@packages/posthog/client";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { AlertCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";

export type ErrorReportData = {
   errorId: string;
   path: string;
   code: string;
   message: string;
   userId?: string;
   organizationId?: string;
};

type ErrorReportCredenzaProps = {
   error: ErrorReportData;
};

export function ErrorReportCredenza({ error }: ErrorReportCredenzaProps) {
   const { closeCredenza } = useCredenza();
   const [submitted, setSubmitted] = useState(false);

   const form = useForm({
      defaultValues: {
         userNotes: "",
      },
      onSubmit: async ({ value }) => {
         captureClientEvent("user_error_report", {
            code: error.code,
            errorId: error.errorId,
            message: error.message,
            organizationId: error.organizationId,
            path: error.path,
            userId: error.userId,
            userNotes: value.userNotes.trim() || undefined,
         });

         setSubmitted(true);
         setTimeout(() => {
            closeCredenza();
         }, 1500);
      },
   });

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
   };

   if (submitted) {
      return (
         <CredenzaHeader>
            <CredenzaTitle>{"Relatorio enviado"}</CredenzaTitle>
            <CredenzaDescription>
               {"Obrigado por nos ajudar a melhorar!"}
            </CredenzaDescription>
         </CredenzaHeader>
      );
   }

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Relatar erro"}</CredenzaTitle>
            <CredenzaDescription>
               {
                  "Ajude-nos a melhorar relatando este erro. Suas informacoes serao enviadas anonimamente."
               }
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody>
            <form className="grid gap-4" onSubmit={handleSubmit}>
               <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>{error.message}</AlertTitle>
                  <AlertDescription className="flex gap-2">
                     <span>{"ID do erro"}:</span>
                     <span>{error.errorId.slice(0, 8)}</span>
                  </AlertDescription>
               </Alert>

               <form.Field name="userNotes">
                  {(field) => (
                     <FieldGroup>
                        <Field>
                           <FieldLabel>{"Additional Details"}</FieldLabel>
                           <Textarea
                              id={field.name}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={"Additional Details Placeholder"}
                              rows={4}
                              value={field.state.value}
                           />
                        </Field>
                     </FieldGroup>
                  )}
               </form.Field>
            </form>
         </CredenzaBody>

         <CredenzaFooter>
            <Button onClick={() => closeCredenza()} variant="outline">
               {"Fechar"}
            </Button>
            <form.Subscribe>
               {(formState) => (
                  <Button
                     disabled={formState.isSubmitting}
                     onClick={() => form.handleSubmit()}
                  >
                     {formState.isSubmitting
                        ? "Enviando..."
                        : "Enviar relatorio"}
                  </Button>
               )}
            </form.Subscribe>
         </CredenzaFooter>
      </>
   );
}
