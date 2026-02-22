import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FormEmbedPanelProps {
   formId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Embed Panel
// ─────────────────────────────────────────────────────────────────────────────

export function FormEmbedPanel({ formId }: FormEmbedPanelProps) {
   const [copiedSnippet, setCopiedSnippet] = useState(false);
   const [copiedId, setCopiedId] = useState(false);

   const snippet = `// 1. Instale o SDK:
// npm install @contentta/sdk

// 2. Inicialize:
const sdk = createBrowserSdk({
  apiKey: "SUA_API_KEY",
  organizationId: "SUA_ORG_ID"
})

// 3. Incorpore o formulário:
<div id="meu-form"></div>
sdk.forms.embedForm("${formId}", "meu-form")`;

   const handleCopySnippet = () => {
      navigator.clipboard.writeText(snippet);
      setCopiedSnippet(true);
      toast.success("Snippet copiado!");
      setTimeout(() => setCopiedSnippet(false), 2000);
   };

   const handleCopyId = () => {
      navigator.clipboard.writeText(formId);
      setCopiedId(true);
      toast.success("ID copiado!");
      setTimeout(() => setCopiedId(false), 2000);
   };

   if (formId === "new") {
      return (
         <div className="max-w-2xl mx-auto text-center py-16">
            <p className="text-muted-foreground">
               Salve o formulário primeiro para obter o snippet de incorporação.
            </p>
         </div>
      );
   }

   return (
      <div className="max-w-2xl mx-auto space-y-6">
         <div>
            <h2 className="text-lg font-semibold">Como incorporar</h2>
            <p className="text-sm text-muted-foreground mt-1">
               Cole este código na sua página para exibir o formulário.
            </p>
         </div>

         <Card>
            <CardContent className="p-4">
               <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-medium">Snippet de incorporação</p>
                  <Button
                     className="shrink-0"
                     onClick={handleCopySnippet}
                     size="sm"
                     variant="outline"
                  >
                     {copiedSnippet ? (
                        <Check className="size-4 mr-1.5" />
                     ) : (
                        <Copy className="size-4 mr-1.5" />
                     )}
                     {copiedSnippet ? "Copiado!" : "Copiar snippet"}
                  </Button>
               </div>
               <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                  {snippet}
               </pre>
            </CardContent>
         </Card>

         <Card>
            <CardContent className="p-4 flex items-center justify-between gap-3">
               <div>
                  <p className="text-sm font-medium">ID do formulário</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                     {formId}
                  </p>
               </div>
               <Button onClick={handleCopyId} size="sm" variant="outline">
                  {copiedId ? (
                     <Check className="size-4 mr-1.5" />
                  ) : (
                     <Copy className="size-4 mr-1.5" />
                  )}
                  {copiedId ? "Copiado!" : "Copiar ID"}
               </Button>
            </CardContent>
         </Card>
      </div>
   );
}
