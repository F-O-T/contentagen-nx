import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@packages/ui/components/dialog";
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
   ChevronRightIcon,
   CrownIcon,
   ShieldIcon,
   UserIcon,
} from "lucide-react";
import * as React from "react";

export function OrganizationRoles() {
   const organizationRoles = [
      {
         icon: CrownIcon,
         id: "owner",
      },
      {
         icon: ShieldIcon,
         id: "admin",
      },
      {
         icon: UserIcon,
         id: "member",
      },
   ];

   type RoleId = "owner" | "admin" | "member";

   const roleData: Record<
      RoleId,
      { title: string; description: string; permissions: string[] }
   > = {
      owner: {
         title: "Proprietário",
         description:
            "Acesso total à organização, incluindo configurações de faturamento e exclusão.",
         permissions: [
            "Gerenciar membros e funções",
            "Acessar configurações de faturamento",
            "Excluir organização",
            "Todas as permissões de administrador",
         ],
      },
      admin: {
         title: "Administrador",
         description: "Pode gerenciar membros e configurações da organização.",
         permissions: [
            "Convidar e remover membros",
            "Gerenciar configurações da organização",
            "Acessar todos os projetos",
            "Criar e excluir projetos",
         ],
      },
      member: {
         title: "Membro",
         description: "Acesso padrão aos recursos da organização.",
         permissions: [
            "Visualizar projetos atribuídos",
            "Criar conteúdo",
            "Colaborar com a equipe",
         ],
      },
   };

   function getLocalizedRoleData(roleId: string) {
      if (roleId === "owner" || roleId === "admin" || roleId === "member") {
         return roleData[roleId];
      }
      return roleData.member;
   }

   function RolePermissionsDialog({
      role,
   }: {
      role: (typeof organizationRoles)[0];
   }) {
      const localizedRole = getLocalizedRoleData(role.id);

      return (
         <DialogContent>
            <DialogHeader>
               <DialogTitle className="flex items-center gap-3">
                  {localizedRole.title}
               </DialogTitle>
               <DialogDescription>
                  Permissões e capacidades desta função
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground">
                  {localizedRole.description}
               </p>
               <div>
                  <p className="text-sm font-medium mb-3">Permissões:</p>
                  <ul className="text-sm space-y-2">
                     {localizedRole.permissions.map((permission, index) => (
                        <li
                           className="flex items-start gap-3"
                           key={`permission-${index + 1}`}
                        >
                           <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                           <span>{permission}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </DialogContent>
      );
   }
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Cargos da Organização</CardTitle>
            <CardDescription>
               Entenda as funções e permissões disponíveis
            </CardDescription>
         </CardHeader>
         <CardContent className="w-full">
            <ItemGroup>
               {organizationRoles.map((role, index) => {
                  const localizedRole = getLocalizedRoleData(role.id);
                  return (
                     <React.Fragment key={role.id}>
                        <Dialog>
                           <DialogTrigger asChild>
                              <Item className="cursor-pointer hover:bg-accent/50 transition-colors">
                                 <ItemMedia className="size-10 " variant="icon">
                                    <role.icon className="size-4 " />
                                 </ItemMedia>
                                 <ItemContent className="gap-1">
                                    <ItemTitle>{localizedRole.title}</ItemTitle>
                                    <ItemDescription>
                                       {localizedRole.description}
                                    </ItemDescription>
                                 </ItemContent>
                                 <ItemActions>
                                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                                 </ItemActions>
                              </Item>
                           </DialogTrigger>
                           <RolePermissionsDialog role={role} />
                        </Dialog>
                        {index !== organizationRoles.length - 1 && (
                           <ItemSeparator />
                        )}
                     </React.Fragment>
                  );
               })}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}
