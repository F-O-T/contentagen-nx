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

const passwordSchema = z.object({
   currentPassword: z.string().min(1, "Current password is required"),
   newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export function UpdatePasswordForm({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const handleChangePassword = useCallback(
      async (
         value: { currentPassword: string; newPassword: string },
         formApi: any,
      ) => {
         await betterAuthClient.changePassword(
            {
               currentPassword: value.currentPassword,
               newPassword: value.newPassword,
               revokeOtherSessions: true,
            },
            {
               onError: ({ error }: any) => {
                  toast.error(error?.message || "Failed to change password.");
               },
               onRequest: () => {
                  toast.loading("Changing password...");
               },
               onSuccess: () => {
                  toast.success("Password changed successfully.");
                  formApi.reset();
                  onOpenChange(false);
               },
            },
         );
      },
      [onOpenChange],
   );
   const form = useAppForm({
      defaultValues: { currentPassword: "", newPassword: "" },
      validators: { onBlur: passwordSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleChangePassword(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Change Password</CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <form.AppField name="currentPassword">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>Current Password</field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="password"
                           autoComplete="current-password"
                           placeholder="Enter current password"
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
               <form.AppField name="newPassword">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>New Password</field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="password"
                           autoComplete="new-password"
                           placeholder="Enter new password"
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
                           Change Password
                        </Button>
                     )}
                  </form.Subscribe>{" "}
               </CredenzaFooter>
            </form>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
               <AlertDialogContent>
                  <AlertDialogHeader>
                     <AlertDialogTitle>
                        Confirm Password Change
                     </AlertDialogTitle>
                     <AlertDialogDescription>
                        Are you sure you want to change your password?
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
                        Yes, Change Password
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
         </CredenzaContent>
      </Credenza>
   );
}
