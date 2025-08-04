import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
} from "@packages/ui/components/credenza";
import {
   AlertDialog,
   AlertDialogContent,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogAction,
   AlertDialogCancel,
} from "@packages/ui/components/alert-dialog";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

const emailSchema = z.object({
   email: z.string().email("Please enter a valid email address"),
});

export function UpdateEmailForm({
   open,
   onOpenChange,
   currentEmail,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentEmail: string;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const handleChangeEmail = useCallback(
      async (value: { email: string }, formApi: any) => {
         await betterAuthClient.changeEmail(
            {
               newEmail: value.email,
               callbackURL: "/profile?emailChanged=1",
            },
            {
               onError: ({ error }: any) => {
                  toast.error(error?.message || "Failed to change email.");
               },
               onRequest: () => {
                  toast.loading("Sending verification email...");
               },
               onSuccess: () => {
                  toast.success(
                     "Verification email sent. Please check your inbox.",
                  );
                  formApi.reset();
                  onOpenChange(false);
               },
            },
         );
      },
      [onOpenChange],
   );
   const form = useAppForm({
      defaultValues: { email: currentEmail || "" },
      validators: { onBlur: emailSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleChangeEmail(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Change Email Address</CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <div>
                  <label className="text-sm font-medium">Current Email</label>
                  <Input value={currentEmail} disabled className="bg-muted" />
               </div>
               <form.AppField name="email">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>New Email</field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="email"
                           autoComplete="email"
                           placeholder="Enter new email address"
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
               <CredenzaFooter>
                  <Button
                     type="button"
                     variant="outline"
                     onClick={() => onOpenChange(false)}
                  >
                     Cancel
                  </Button>
                  <form.Subscribe>
                     {(formState) => (
                        <Button
                           type="button"
                           onClick={() => setConfirmOpen(true)}
                           disabled={!formState.canSubmit}
                        >
                           Send Verification
                        </Button>
                     )}
                  </form.Subscribe>{" "}
               </CredenzaFooter>
            </form>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
               <AlertDialogContent>
                  <AlertDialogHeader>
                     <AlertDialogTitle>Confirm Email Change</AlertDialogTitle>
                     <AlertDialogDescription>
                        Are you sure you want to change your email address?
                     </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
                        Cancel
                     </AlertDialogCancel>
                     <AlertDialogAction
                        onClick={() => {
                           setConfirmOpen(false);
                           form.handleSubmit();
                        }}
                     >
                        Yes, Change Email
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
         </CredenzaContent>
      </Credenza>
   );
}
