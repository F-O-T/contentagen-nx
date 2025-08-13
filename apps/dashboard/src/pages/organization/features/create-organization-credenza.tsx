import { betterAuthClient } from "@/integrations/clients";
import { Building2 } from "lucide-react";
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
import { InfoItem } from "@packages/ui/components/info-item";
import { Input } from "@packages/ui/components/input";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function CreateOrganizationCredenza({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const [newOrg, setNewOrg] = useState<string>("");
   const [alertOpen, setAlertOpen] = useState(false);
   const schema = z.object({
      name: z.string().min(1, "Please enter a name"),
   });
   const queryClient = useQueryClient();
   const createOrganization = useCallback(
      async (values: z.infer<typeof schema>) => {
         // Generate slug from name
         const slugify = (await import("slugify")).default;
         const slug = slugify(values.name, { lower: true, strict: true });
         await betterAuthClient.organization.create(
            {
               name: values.name,
               slug,
            },
            {
               onSuccess: async ({ data }) => {
                  toast.success(`Organization created successfully`);
                  if (data?.name) setNewOrg(data.name);
                  setAlertOpen(true);
                  // Set the new org as active
                  await betterAuthClient.organization.setActive({
                     organizationId: data.id,
                     organizationSlug: data.slug,
                  });
                  // Invalidate queries for org and members
                  queryClient.invalidateQueries({
                     queryKey: ["organizations"],
                  });
                  queryClient.invalidateQueries({
                     queryKey: ["activeOrganization"],
                  });
                  queryClient.invalidateQueries({
                     queryKey: ["organizationMembers"],
                  });
               },
               onError: (e) => {
                  console.error("Error creating organization:", e);
                  toast.error(`Failed to create organization`);
               },
            },
         );
      },
      [queryClient],
   );

   const form = useAppForm({
      defaultValues: { name: "" },
      validators: {
         onBlur: schema,
      },
      onSubmit: async ({ value, formApi }) => {
         await createOrganization(value);
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

   const handleCopyOrgName = useCallback(() => {
      if (newOrg) {
         navigator.clipboard.writeText(newOrg);
      }
      setAlertOpen(false);
      setNewOrg("");
   }, [newOrg]);

   return (
      <>
         <Credenza open={open} onOpenChange={onOpenChange}>
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>Create organization</CredenzaTitle>
               </CredenzaHeader>
               <form onSubmit={(e) => handleSubmit(e)}>
                  <CredenzaBody>
                     <form.AppField name="name">
                        {(field) => (
                           <field.FieldContainer>
                              <field.FieldLabel>Name</field.FieldLabel>
                              <Input
                                 id={field.name}
                                 name={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Enter a name for your organization"
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
                              Create Organization
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
               if (!isOpen) setNewOrg("");
            }}
         >
            <CredenzaContent>
               <CredenzaHeader>
                  <CredenzaTitle>This is your organization name</CredenzaTitle>
                  <CredenzaDescription>
                     Please copy and store this organization name securely.
                     <br />
                     <strong>You will not be able to see it again.</strong>
                  </CredenzaDescription>
               </CredenzaHeader>
               <CredenzaBody className="grid grid-cols-1 pb-0">
                  <InfoItem
                     icon={<Building2 />}
                     label="Organization Name"
                     value={newOrg}
                     key={"org-name"}
                  />
               </CredenzaBody>
               <CredenzaFooter>
                  <Button onClick={handleCopyOrgName}>Copy to clipboard</Button>
               </CredenzaFooter>
            </CredenzaContent>
         </Credenza>
      </>
   );
}
