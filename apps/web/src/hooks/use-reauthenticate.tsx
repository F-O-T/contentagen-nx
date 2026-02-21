import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import { PasswordInput } from "@packages/ui/components/password-input";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { closeCredenza, openCredenza } from "./use-credenza";

interface ReauthContentProps {
   onSuccess: () => void;
   onCancel: () => void;
}

function ReauthContent({ onSuccess, onCancel }: ReauthContentProps) {
   const [password, setPassword] = useState("");

   const verifyMutation = useMutation({
      mutationFn: async () => {
         const result = await orpc.account.verifyPassword.call({ password });
         if (!result.valid) throw new Error("Senha incorreta");
      },
      onSuccess: () => {
         onSuccess();
      },
      onError: (error) => {
         toast.error(
            error instanceof Error ? error.message : "Senha incorreta",
         );
      },
   });

   return (
      <div className="p-6 space-y-4">
         <div>
            <h3 className="text-lg font-medium">Confirmar identidade</h3>
            <p className="text-sm text-muted-foreground">
               Digite sua senha para continuar.
            </p>
         </div>
         <div className="space-y-1.5">
            <Label htmlFor="reauth-password">Senha</Label>
            <PasswordInput
               autoFocus
               id="reauth-password"
               onChange={(e) => setPassword(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === "Enter" && password.length > 0)
                     verifyMutation.mutate();
               }}
               placeholder="••••••••"
               value={password}
            />
         </div>
         <div className="flex gap-2">
            <Button
               disabled={password.length === 0 || verifyMutation.isPending}
               onClick={() => verifyMutation.mutate()}
               size="sm"
            >
               {verifyMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Confirmar
            </Button>
            <Button onClick={onCancel} size="sm" variant="outline">
               Cancelar
            </Button>
         </div>
      </div>
   );
}

export function useReauthenticate() {
   const reauthenticate = useCallback(
      (onSuccess: () => void, onCancel?: () => void) => {
         openCredenza({
            children: (
               <ReauthContent
                  onCancel={() => {
                     closeCredenza();
                     onCancel?.();
                  }}
                  onSuccess={() => {
                     closeCredenza();
                     onSuccess();
                  }}
               />
            ),
         });
      },
      [],
   );

   return { reauthenticate };
}
