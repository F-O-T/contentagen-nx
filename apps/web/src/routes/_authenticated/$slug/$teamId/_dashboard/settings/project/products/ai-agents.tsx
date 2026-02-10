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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Hash, Pencil, Search, Thermometer } from "lucide-react";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/project/products/ai-agents",
)({
   component: ProductsAiAgentsPage,
});

function ProductsAiAgentsPage() {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Agentes IA</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as configurações padrão dos agentes IA.
            </p>
         </div>

         <ItemGroup>
            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Cpu className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Modelo padrão</ItemTitle>
                  <ItemDescription className="truncate">
                     GPT-4o
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar modelo</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Thermometer className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Nível de criatividade</ItemTitle>
                  <ItemDescription className="truncate">
                     Balanceado
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar criatividade</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Search className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Provedores de pesquisa</ItemTitle>
                  <ItemDescription className="truncate">
                     Tavily, Exa
                  </ItemDescription>
               </ItemContent>
               <ItemActions>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                           <Pencil className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Editar provedores</TooltipContent>
                  </Tooltip>
               </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="muted">
               <ItemMedia variant="icon">
                  <Hash className="size-4" />
               </ItemMedia>
               <ItemContent className="min-w-0">
                  <ItemTitle>Limite de tokens por requisição</ItemTitle>
                  <ItemDescription className="truncate">
                     4.096
                  </ItemDescription>
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
      </div>
   );
}
