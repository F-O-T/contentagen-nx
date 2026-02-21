import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/integrations/better-auth/auth-client";

interface SetActiveOrganizationParams {
   organizationId?: string | null;
   organizationSlug?: string;
}

interface UseSetActiveOrganizationOptions {
   onSuccess?: () => void;
   onError?: (error: Error) => void;
   showToast?: boolean;
}

export function useSetActiveOrganization(
   options?: UseSetActiveOrganizationOptions,
) {
   const [isPending, startTransition] = useTransition();
   const showToast = options?.showToast ?? true;

   const setActiveOrganization = useCallback(
      (params: SetActiveOrganizationParams) => {
         const toastId = showToast
            ? toast.loading("Switching organization...")
            : undefined;

         return new Promise<Awaited<ReturnType<typeof authClient.organization.setActive>>["data"]>((resolve, reject) => {
            startTransition(async () => {
               try {
                  const result = await authClient.organization.setActive({
                     organizationId: params.organizationId,
                     organizationSlug: params.organizationSlug,
                  });

                  if (result.error) {
                     throw new Error(result.error.message);
                  }

                  if (showToast && toastId) {
                     toast.success("Organization switched successfully", {
                        id: toastId,
                     });
                  }

                  options?.onSuccess?.();
                  resolve(result.data);
               } catch (error) {
                  const errorMessage =
                     error instanceof Error
                        ? error.message
                        : "Failed to switch organization";
                  if (showToast && toastId) {
                     toast.error(errorMessage, { id: toastId });
                  }
                  options?.onError?.(
                     error instanceof Error ? error : new Error(errorMessage),
                  );
                  reject(error);
               }
            });
         });
      },
      [options, showToast, startTransition],
   );

   return { isPending, setActiveOrganization };
}
