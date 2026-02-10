import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
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
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { createFileRoute } from "@tanstack/react-router";
import {
   Building2,
   Copy,
   Globe,
   Hash,
   ImageIcon,
   Pencil,
   Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamId/_dashboard/settings/organization/general",
)({
   component: OrganizationGeneralPage,
});

// ============================================
// Mock Data
// ============================================

const mockOrganization = {
   name: "Minha Organização",
   slug: "minha-organizacao",
   logo: null as string | null,
   domain: "exemplo.com.br",
   memberCount: 5,
};

// ============================================
// Main Page Component
// ============================================

function OrganizationGeneralPage() {
   const handleCopySlug = () => {
      navigator.clipboard.writeText(mockOrganization.slug);
      toast.success("Slug copiado para a área de transferência!");
   };

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold font-serif">Geral</h1>
            <p className="text-sm text-muted-foreground mt-1">
               Gerencie as informações da sua organização.
            </p>
         </div>

         <TooltipProvider>
            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Informações da Organização</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Gerencie o nome, logo e slug da organização
                  </p>
               </div>
               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Building2 className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Nome da organização</ItemTitle>
                        <ItemDescription className="truncate">
                           {mockOrganization.name}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost">
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar nome</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Hash className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Slug</ItemTitle>
                        <ItemDescription className="truncate font-mono">
                           {mockOrganization.slug}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button
                                 onClick={handleCopySlug}
                                 size="icon"
                                 variant="ghost"
                              >
                                 <Copy className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Copiar slug</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <ImageIcon className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Logo</ItemTitle>
                        <ItemDescription>
                           {mockOrganization.logo
                              ? "Logo configurado"
                              : "Nenhum logo definido"}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost">
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar logo</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>

                  <ItemSeparator />

                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Globe className="size-4" />
                     </ItemMedia>
                     <ItemContent className="min-w-0">
                        <ItemTitle>Domínio</ItemTitle>
                        <ItemDescription className="truncate">
                           {mockOrganization.domain}
                        </ItemDescription>
                     </ItemContent>
                     <ItemActions>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost">
                                 <Pencil className="size-4" />
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent>Editar domínio</TooltipContent>
                        </Tooltip>
                     </ItemActions>
                  </Item>
               </ItemGroup>
            </section>

            <section className="space-y-3">
               <div>
                  <h2 className="text-lg font-medium">Resumo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Visão geral da organização
                  </p>
               </div>
               <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                     <AvatarImage
                        alt={mockOrganization.name}
                        src={mockOrganization.logo || undefined}
                     />
                     <AvatarFallback className="text-lg">
                        <Building2 className="size-6" />
                     </AvatarFallback>
                  </Avatar>
                  <div>
                     <h3 className="font-semibold">{mockOrganization.name}</h3>
                     <p className="text-sm text-muted-foreground font-mono">
                        {mockOrganization.slug}
                     </p>
                  </div>
               </div>

               <ItemGroup>
                  <Item variant="muted">
                     <ItemMedia variant="icon">
                        <Users className="size-4" />
                     </ItemMedia>
                     <ItemContent>
                        <ItemTitle>Membros</ItemTitle>
                        <ItemDescription>
                           {mockOrganization.memberCount}{" "}
                           {mockOrganization.memberCount === 1
                              ? "membro"
                              : "membros"}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </section>
         </TooltipProvider>
      </div>
   );
}
