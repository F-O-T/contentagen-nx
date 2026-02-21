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

interface KeyRevealDialogProps {
   label: string;
   plaintextKey: string;
   onClose: () => void;
}

export function KeyRevealDialog({
   label,
   plaintextKey,
   onClose,
}: KeyRevealDialogProps) {
   const [lastCopied, copy] = useCopyToClipboard();
   const copied = lastCopied === plaintextKey;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Chave criada com sucesso</CredenzaTitle>
            <CredenzaDescription>
               A chave <strong>{label}</strong> foi criada. Copie-a agora pois
               ela não será exibida novamente.
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
               <Input
                  className="font-mono text-sm border-0 bg-transparent focus-visible:ring-0"
                  readOnly
                  value={plaintextKey}
               />
               <Button
                  onClick={() => copy(plaintextKey)}
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
                  Esta chave não será exibida novamente. Guarde-a em um local
                  seguro. Se você perdê-la, precisará criar uma nova.
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
