import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Switch } from "@packages/ui/components/switch";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, Clock, Mail, MessageSquare, Pencil, Shield } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/products/forms",
)({
   component: ProductsFormsPage,
});

function ProductsFormsPage() {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Formulários</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos formulários.
            </p>
         </div>

         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <MessageSquare className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Mensagem de sucesso padrão</ItemTitle>
                  <ItemDescription className="truncate">
                     Obrigado por enviar o formulário!
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar mensagem</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Mail className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Email de notificação</ItemTitle>
                  <ItemDescription className="truncate">
                     notificacoes@empresa.com
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar email</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Shield className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Proteção anti-spam</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                     Ativar proteção contra envios automatizados
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Switch
                     aria-label="Proteção anti-spam"
                     checked={true}
                  />
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <CheckCheck className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Double opt-in</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                     Exigir confirmação por email antes de registrar o envio
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Switch
                     aria-label="Double opt-in"
                     checked={false}
                  />
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Clock className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Retenção de dados</ItemTitle>
                  <ItemDescription className="truncate">
                     90 dias
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar retenção</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>
         </ItemGroup>
      </div>
   );
}
