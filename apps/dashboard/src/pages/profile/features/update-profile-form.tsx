import { useAppForm } from "@packages/ui/components/form";
import { z } from "zod";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { Dropzone } from "@packages/ui/components/dropzone";
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

const profileSchema = z.object({
   name: z.string().min(1, "Name is required"),
   image: z.any().nullable(),
});

export function UpdateProfileForm({
   open,
   onOpenChange,
   currentName,
   currentImage,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentName: string;
   currentImage: string;
}) {
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [imageFile, setImageFile] = useState<File | null>(null);
   const handleUpdateProfile = useCallback(
      async (value: { name: string; image: any }, formApi: any) => {
         const imageUrl = currentImage;
         if (imageFile) {
            // TODO: implement image upload and return URL
            // Example: const uploaded = await uploadProfileImage(imageFile);
            // imageUrl = uploaded.url;
         }
         await betterAuthClient.updateUser(
            {
               name: value.name,
               image: imageUrl,
            },
            {
               onError: ({ error }: any) => {
                  toast.error(error?.message || "Failed to update profile.");
               },
               onRequest: () => {
                  toast.loading("Updating profile...");
               },
               onSuccess: () => {
                  toast.success("Profile updated successfully.");
                  formApi.reset();
                  onOpenChange(false);
               },
            },
         );
      },
      [currentImage, imageFile, onOpenChange],
   );
   const form = useAppForm({
      defaultValues: { name: currentName, image: null },
      validators: { onBlur: profileSchema },
      onSubmit: async ({ value, formApi }) => {
         await handleUpdateProfile(value, formApi);
      },
   });
   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Update Name & Photo</CredenzaTitle>
            </CredenzaHeader>
            <form
               onSubmit={form.handleSubmit}
               className="space-y-4 py-4"
               autoComplete="off"
            >
               <form.AppField name="name">
                  {(field) => (
                     <field.FieldContainer>
                        <field.FieldLabel>Name</field.FieldLabel>
                        <Input
                           id={field.name}
                           name={field.name}
                           type="text"
                           autoComplete="name"
                           placeholder="Enter your name"
                           value={field.state.value}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <field.FieldMessage />
                     </field.FieldContainer>
                  )}
               </form.AppField>{" "}
               <div>
                  <label className="text-sm font-medium">Profile Image</label>
                  <Dropzone
                     accept={{ "image/*": [] }}
                     maxFiles={1}
                     maxSize={2 * 1024 * 1024}
                     onDrop={(files) => setImageFile(files[0] || null)}
                  >
                     {imageFile ? (
                        <img
                           src={URL.createObjectURL(imageFile)}
                           alt="Preview"
                           className="h-20 w-20 rounded-full object-cover mx-auto"
                        />
                     ) : (
                        currentImage && (
                           <img
                              src={currentImage}
                              alt="Current"
                              className="h-20 w-20 rounded-full object-cover mx-auto"
                           />
                        )
                     )}
                  </Dropzone>
               </div>
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
                           Save Changes
                        </Button>
                     )}
                  </form.Subscribe>{" "}
               </CredenzaFooter>
            </form>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
               <AlertDialogContent>
                  <AlertDialogHeader>
                     <AlertDialogTitle>Confirm Profile Update</AlertDialogTitle>
                     <AlertDialogDescription>
                        Are you sure you want to update your profile
                        information?
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
                        Yes, Update Profile
                     </AlertDialogAction>
                  </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
         </CredenzaContent>
      </Credenza>
   );
}
