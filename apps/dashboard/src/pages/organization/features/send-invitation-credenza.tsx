import { betterAuthClient } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaContent,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaFooter,
   CredenzaBody,
   CredenzaDescription,
} from "@packages/ui/components/credenza";
import { useAppForm } from "@packages/ui/components/form";
import { Input } from "@packages/ui/components/input";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function SendInvitationCredenza({
   open,
   onOpenChange,
   organizationId,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   organizationId: string;
}) {
   const [alertOpen, setAlertOpen] = useState(false);
   const [inviteeEmail, setInviteeEmail] = useState("");
   const schema = z.object({
      email: z.email("Please enter a valid email"),
   });
   const queryClient = useQueryClient();

   const sendInvitation = useCallback(
      async (values: z.infer<typeof schema>) => {
         await betterAuthClient.organization.inviteMember(
            {
               email: values.email,
               role: "member",
               organizationId,
            },
            {
               onSuccess: async () => {
                  toast.success(`Invitation sent to ${values.email}`);
                  setInviteeEmail(values.email);
                  setAlertOpen(true);
                  queryClient.invalidateQueries({
                     queryKey: ["organizationInvitations"],
                  });
               },
               onError: (e) => {
                  console.error("Error sending invitation:", e);
                  toast.error(`Failed to send invitation`);
               },
            },
         );
      },
      [organizationId, queryClient],
   );

   const form = useAppForm({
      defaultValues: { email: "" },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await sendInvitation(value);
         formApi.reset();
         onOpenChange(false);
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

   return (
      <>
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Invite Member</CredenzaTitle>
                  <CredenzaDescription>
                     Enter the email address of the person you want to invite as
                     a member.
                  </CredenzaDescription>
               </CredenzaHeader>
               <form onSubmit={handleSubmit}>
                  <CredenzaBody>
                     <form.AppField name="email">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Email</field.FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Enter email address"
                                 value={field.state.value}
                              />
                              <field.FieldMessage />
                           </field.FieldContainer>
                        )}
                     </form.AppField>
                  </CredenzaBody>
                  <CredenzaFooter>
                     <form.Subscribe>
                        {(formState) => (
                           <Button
                              className="w-full shadow-lg transition-all duration-300 group bg-primary shadow-primary/20 hover:bg-primary/90 flex gap-2 items-center justify-center"
                              disabled={
                                 !formState.canSubmit || formState.isSubmitting
                              }
                              type="submit"
                              variant="default"
                           >
                              Send Invitation
                           </Button>
                        )}
                     </form.Subscribe>
                  </CredenzaFooter>
               </form>
            </CredenzaContent>
         </Credenza>
         <Credenza
            open={alertOpen}
            onOpenChange={(isOpen) => {
               setAlertOpen(isOpen);
               if (!isOpen) setInviteeEmail("");
            }}
         >
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Invitation Sent</CredenzaTitle>
                  <CredenzaDescription>
                     An invitation has been sent to {inviteeEmail}. They will
                     receive an email with a link to join your organization.
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaFooter>
                  <Button onClick={() => setAlertOpen(false)}>Close</Button>
               </CredenzaFooter>
            </CredenzaContent>
         </Credenza>
      </>
   );
}
