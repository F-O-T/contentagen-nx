import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Input } from "@packages/ui/components/input";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { AlertTriangle, Check, Copy } from "lucide-react";

interface WebhookSecretDialogProps {
   url: string;
   plaintextSecret: string;
   onClose: () => void;
}

export function WebhookSecretDialog({
   url,
   plaintextSecret,
   onClose,
}: WebhookSecretDialogProps) {
   const [lastCopied, copy] = useCopyToClipboard();
   const copied = lastCopied === plaintextSecret;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Segredo do webhook criado</CredenzaTitle>
            <CredenzaDescription>
               Copie o segredo de assinatura do endpoint <strong>{url}</strong>.
               Ele só será exibido uma vez.
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
               <Input
                  className="font-mono text-sm border-0 bg-transparent focus-visible:ring-0"
                  readOnly
                  value={plaintextSecret}
               />
               <Button
                  onClick={() => copy(plaintextSecret)}
                  size="icon"
                  variant="outline"
               >
                  {copied ? (
                     <Check className="size-4 text-green-600" />
                  ) : (
                     <Copy className="size-4" />
                  )}
               </Button>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
               <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
               <p className="text-xs text-amber-700 dark:text-amber-400">
                  Este segredo não será exibido novamente. Armazene-o com
                  segurança para assinar eventos enviados pelo Contentta.
               </p>
            </div>
         </CredenzaBody>
         <CredenzaFooter>
            <Button className="w-full" onClick={onClose}>
               Entendi, fechar
            </Button>
         </CredenzaFooter>
      </>
   );
}
