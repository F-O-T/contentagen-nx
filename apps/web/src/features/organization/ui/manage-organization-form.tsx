import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { Building } from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";

type Organization = {
   id: string;
   name: string;
   slug: string;
   description?: string | null;
};

type ManageOrganizationFormProps = {
   organization?: Organization;
};

export function ManageOrganizationForm({
   organization,
}: ManageOrganizationFormProps) {
   const { closeSheet } = useSheet();
   const isEditMode = !!organization;
   const [isPending, startTransition] = useTransition();

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: "Create your first organization to start collaborating",
         title: "Create Organization",
      };

      const editTexts = {
         description: "Update your organization information and logo",
         title: "Edit Organization",
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const { setActiveOrganization } = useSetActiveOrganization({
      showToast: false,
   });

   const createOrganization = useCallback(
      async (data: { name: string; slug: string; description?: string }) => {
         toast.loading("Creating organization...");
         const result = await authClient.organization.create({
            name: data.name,
            slug: data.slug,
         });

         if (result.error) {
            toast.error(
               result.error.message || "Failed to create organization",
            );
            return;
         }

         toast.success("Organization created successfully");
         if (result.data?.id) {
            await setActiveOrganization({
               organizationId: result.data.id,
            });
            await authClient.organization.createTeam({
               name: "Default",
               organizationId: result.data.id,
               slug: createSlug("Default"),
            });
         }
         fileUpload.clearFile();
         closeSheet();
      },
      [closeSheet, fileUpload, setActiveOrganization],
   );

   const updateOrganization = useCallback(
      async (data: { organizationId: string; name?: string }) => {
         toast.loading("Updating organization...");
         const result = await authClient.organization.update({
            data: { name: data.name },
            organizationId: data.organizationId,
         });

         if (result.error) {
            toast.error(
               result.error.message || "Failed to update organization",
            );
            return;
         }
         toast.success("Organization updated successfully");
         fileUpload.clearFile();
         closeSheet();
      },
      [closeSheet, fileUpload],
   );

   const handleFileSelect = (acceptedFiles: File[]) => {
      fileUpload.handleFileSelect(acceptedFiles, (file) => {
         form.setFieldValue("logo", file);
      });
   };

   const form = useForm({
      defaultValues: {
         description: organization?.description || "",
         logo: null as File | null,
         name: organization?.name || "",
      },
      onSubmit: async ({ value, formApi }) => {
         try {
            if (isEditMode && organization) {
               await updateOrganization({
                  organizationId: organization.id,
                  name: value.name,
               });
            } else {
               await createOrganization({
                  description: value.description,
                  name: value.name,
                  slug: createSlug(value.name),
               });
            }
            formApi.reset();
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} organization:`,
               error,
            );
         }
      },
   });

   return (
      <form
         className="h-full flex flex-col"
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startTransition(async () => {
               await form.handleSubmit();
            });
         }}
      >
         <SheetHeader>
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4">
            <form.Field name="logo">
               {(field) => {
                  const currentLogoFile = field.state.value;
                  const displayImage = fileUpload.filePreview;

                  return (
                     <Field
                        data-invalid={
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid
                        }
                     >
                        <FieldLabel>Organization Logo</FieldLabel>
                        <Dropzone
                           accept={{
                              "image/*": [
                                 ".png",
                                 ".jpg",
                                 ".jpeg",
                                 ".gif",
                                 ".webp",
                              ],
                           }}
                           className="h-44"
                           disabled={fileUpload.isUploading}
                           maxFiles={1}
                           maxSize={5 * 1024 * 1024}
                           onDrop={handleFileSelect}
                           src={currentLogoFile ? [currentLogoFile] : undefined}
                        >
                           <DropzoneEmptyState>
                              <Building className="size-8 text-muted-foreground" />
                           </DropzoneEmptyState>
                           <DropzoneContent>
                              {displayImage && (
                                 <img
                                    alt="Logo preview"
                                    className="h-full w-full object-contain rounded-md"
                                    src={displayImage}
                                 />
                              )}
                           </DropzoneContent>
                        </Dropzone>
                        {currentLogoFile && (
                           <p className="text-sm text-muted-foreground">
                              Logo will be uploaded when you{" "}
                              {isEditMode ? "save" : "create"} the organization
                           </p>
                        )}
                        {fileUpload.error && (
                           <p className="text-sm text-destructive">
                              {fileUpload.error}
                           </p>
                        )}
                        {field.state.meta.isTouched &&
                           !field.state.meta.isValid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Organization Name
                        </FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="description">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Description
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           className="w-full"
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           rows={3}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </div>

         <SheetFooter>
            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit || state.isSubmitting || isPending
                     }
                     type="submit"
                  >
                     {state.isSubmitting || isPending
                        ? isEditMode
                           ? "Saving..."
                           : "Creating..."
                        : modeTexts.title}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}
