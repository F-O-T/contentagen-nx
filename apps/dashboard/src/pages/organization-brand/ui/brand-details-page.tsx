import { useTRPC } from "@/integrations/clients";
import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateEditBrandDialog } from "../features/create-edit-brand-dialog";
import { useState } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import { createToast } from "@/features/error-modal/lib/create-toast";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";

export function BrandDetailsPage() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [showCreateDialog, setShowCreateDialog] = useState(false);

   const { data: brand, error: brandError } = useQuery(
      trpc.brand.getByOrganization.queryOptions(),
   );
   useIsomorphicLayoutEffect(() => {
      if (!brand) {
         setShowCreateDialog(true);
      }
   }, []);
   const isGenerating =
      brand?.status &&
      ["pending", "analyzing", "chunking"].includes(brand.status);

   useSubscription(
      trpc.brand.onStatusChange.subscriptionOptions(
         {
            brandId: brand?.id || "",
         },
         {
            async onData(data) {
               createToast({
                  type: "success",
                  message: `Brand features status updated to: ${data.status}`,
               });
               await queryClient.invalidateQueries({
                  queryKey: trpc.brand.getByOrganization.queryKey(),
               });
            },
            enabled: Boolean(brand && isGenerating),
         },
      ),
   );

   if (!brand || brandError) {
      return (
         <main className="h-full w-full flex flex-col gap-4">
            <Card>
               <CardHeader>
                  <CardTitle>Create Your Brand</CardTitle>
                  <CardDescription>
                     Set up your brand to start generating content and managing
                     your brand assets.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <CreateEditBrandDialog
                     open={showCreateDialog}
                     onOpenChange={setShowCreateDialog}
                  />
               </CardContent>
            </Card>
         </main>
      );
   }

   return (
      <>
         <main className="h-full w-full flex flex-col gap-4">
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     Brand Description
                  </CardTitle>
                  <CardDescription>
                     This is how your brand describes itself and what makes it
                     unique.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <p>{brand.summary || "No brand description available."}</p>
               </CardContent>
            </Card>
         </main>

         <CreateEditBrandDialog
            brand={brand}
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
         />
      </>
   );
}
