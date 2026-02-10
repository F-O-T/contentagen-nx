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
import {
   AlignLeft,
   Bot,
   GitBranch,
   Globe,
   History,
   Pencil,
   Type,
} from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/products/content",
)({
   component: ContentProductPage,
});

function ContentProductPage() {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Conteúdo</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Configurações padrão para criação de conteúdo neste projeto.
            </p>
         </div>

         <section className="space-y-3">
            <div>
               <h2 className="text-lg font-medium">Padrões de Conteúdo</h2>
               <p className="text-sm text-muted-foreground mt-1">
                  Configurações aplicadas a novos conteúdos
               </p>
            </div>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Globe className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Idioma padrão</ItemTitle>
                     <ItemDescription>Português (BR)</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button size="icon" variant="ghost">
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar idioma</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Bot className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Agente IA padrão</ItemTitle>
                     <ItemDescription>Nenhum selecionado</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button size="icon" variant="ghost">
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Selecionar agente</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <GitBranch className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Revisão obrigatória</ItemTitle>
                     <ItemDescription>
                        Exigir revisão antes de publicar
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Switch checked={false} />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <History className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Limite de versões</ItemTitle>
                     <ItemDescription>10</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button size="icon" variant="ghost">
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar limite</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>
            </ItemGroup>
         </section>

         <section className="space-y-3">
            <div>
               <h2 className="text-lg font-medium">SEO</h2>
               <p className="text-sm text-muted-foreground mt-1">
                  Templates de metadados para SEO
               </p>
            </div>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Type className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Template de meta title</ItemTitle>
                     <ItemDescription className="truncate">
                        {"{{title}} | {{brand}}"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button size="icon" variant="ghost">
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar template</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <AlignLeft className="size-4" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                     <ItemTitle>Template de meta description</ItemTitle>
                     <ItemDescription className="truncate">
                        {"{{description}}"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button size="icon" variant="ghost">
                              <Pencil className="size-4" />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar template</TooltipContent>
                     </Tooltip>
                  </ItemActions>
               </Item>
            </ItemGroup>
         </section>
      </div>
   );
}
