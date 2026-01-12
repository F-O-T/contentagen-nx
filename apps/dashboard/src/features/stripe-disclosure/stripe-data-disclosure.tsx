import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { ShieldCheck } from "lucide-react";

export function StripeDataDisclosure() {
   return (
      <Alert className="bg-muted/50 border-primary/20">
         <ShieldCheck className="size-4 text-primary" />
         <AlertTitle>{"Pagamentos Seguros com Stripe"}</AlertTitle>
         <AlertDescription className="space-y-2 mt-2">
            <p className="text-sm">
               {
                  "Seus dados de pagamento são processados com segurança pela Stripe, nossa provedora de pagamentos."
               }
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
               <p>
                  •{" "}
                  {
                     "Certificado PCI-DSS Nível 1 (mais alto padrão de segurança)"
                  }
               </p>
               <p>• {"Contentta não armazena números de cartão de crédito"}</p>
               <p>• {"Todos os dados de pagamento são criptografados"}</p>
               <p>
                  {"Consulte a"}{" "}
                  <a
                     className="underline hover:text-foreground transition-colors"
                     href="https://stripe.com/privacy"
                     rel="noopener noreferrer"
                     target="_blank"
                  >
                     {"Política de Privacidade da Stripe"}
                  </a>
               </p>
            </div>
         </AlertDescription>
      </Alert>
   );
}
