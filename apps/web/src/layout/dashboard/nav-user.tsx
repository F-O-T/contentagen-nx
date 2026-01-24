import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, LogOut, Sparkles } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { LanguageCommand } from "./language-command";
import { ThemeSwitcher } from "./theme-switcher";

type Session = {
   user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
   };
};

function NavUserCredenza({
   session,
   activeOrganization,
   onNavigate,
   onLogout,
}: {
   session: Session;
   activeOrganization: { slug: string };
   onNavigate: () => void;
   onLogout: () => void;
}) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{"Olá, {{name}}"}</CredenzaTitle>
            <CredenzaDescription className="truncate">
               {session.user.email}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <Button
               asChild
               className="w-full justify-start gap-2"
               onClick={onNavigate}
               variant="outline"
            >
               <a href={`/${activeOrganization.slug}/settings/billing`}>
                  <Sparkles className="size-4" />
                  {"Atualizar para Pro"}
               </a>
            </Button>

            <div className="space-y-2">
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <a href={`/${activeOrganization.slug}/settings/profile`}>
                     <BadgeCheck className="size-4" />
                     {"Conta"}
                  </a>
               </Button>
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  onClick={onNavigate}
                  variant="outline"
               >
                  <a href={`/${activeOrganization.slug}/settings/billing`}>
                     <CreditCard className="size-4" />
                     {"Cobrança"}
                  </a>
               </Button>
            </div>

            <div className="space-y-3">
               <span className="text-sm font-medium text-muted-foreground">
                  {"Preferencias"}
               </span>
               <div className="flex items-center justify-between">
                  <span className="text-sm">{"Tema"}</span>
                  <ThemeSwitcher />
               </div>
               <div className="flex items-center justify-between gap-8">
                  <span className="text-sm">{"Idioma"}</span>
                  <LanguageCommand />
               </div>
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <Button
               className="w-full gap-2"
               onClick={onLogout}
               variant="destructive"
            >
               <LogOut className="size-4" />
               {"Sair"}
            </Button>
         </CredenzaFooter>
      </>
   );
}

function NavUserErrorFallback() {
   return (
      <div className="p-4 text-center text-destructive">
         Erro ao carregar informações do usuário.
      </div>
   );
}

function NavUserSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" size="lg">
               <Skeleton className="h-8 w-8 rounded-lg mr-3" />
               <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
               </div>
               <Skeleton className="ml-auto size-4" />
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

function NavUserContent() {
   const { activeOrganization } = useActiveOrganization();
   const { isMobile, setOpenMobile } = useSidebar();
   const router = useRouter();
   const queryClient = useQueryClient();
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const handleLogout = useCallback(async () => {
      await authClient.signOut({
         fetchOptions: {
            onError: ({ error }) => {
               toast.error(error.message, { id: "logout" });
            },
            onRequest: () => {
               toast.loading("Saindo...", { id: "logout" });
            },
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: orpc.session.getSession.queryKey({}),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
               toast.success("Você saiu com sucesso", { id: "logout" });
            },
         },
      });
      setOpenMobile(false);
   }, [queryClient, router, setOpenMobile]);

   const handleLogoutClick = useCallback(() => {
      closeCredenza();
      openAlertDialog({
         actionLabel: "Sair",
         cancelLabel: "Cancelar",
         description: "Tem certeza que deseja sair da sua conta?",
         onAction: handleLogout,
         title: "Sair da Conta",
         variant: "destructive",
      });
   }, [closeCredenza, openAlertDialog, handleLogout]);

   const handleNavigate = useCallback(() => {
      closeCredenza();
      setOpenMobile(false);
   }, [closeCredenza, setOpenMobile]);

   const handleOpenCredenza = useCallback(() => {
      if (!session) return;
      const currentSession = session;
      openCredenza({
         children: (
            <NavUserCredenza
               activeOrganization={activeOrganization}
               onLogout={handleLogoutClick}
               onNavigate={handleNavigate}
               session={currentSession}
            />
         ),
      });
   }, [
      openCredenza,
      session,
      activeOrganization,
      handleNavigate,
      handleLogoutClick,
   ]);

   // Mobile: Use Credenza
   if (isMobile) {
      return (
         <SidebarMenu>
            <SidebarMenuItem>
               <Avatar
                  className="border-border border-2 cursor-pointer"
                  onClick={handleOpenCredenza}
               >
                  <AvatarImage
                     alt={session?.user.name}
                     src={session?.user.image ?? ""}
                  />
                  <AvatarFallback className="rounded-lg">
                     {session?.user.name?.charAt(0) || "?"}
                  </AvatarFallback>
               </Avatar>
            </SidebarMenuItem>
         </SidebarMenu>
      );
   }

   // Desktop: Use DropdownMenu
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Avatar className="border-border border-2 cursor-pointer">
                     <AvatarImage
                        alt={session?.user.name}
                        src={session?.user.image ?? ""}
                     />
                     <AvatarFallback className="rounded-lg">
                        {session?.user.name?.charAt(0) || "?"}
                     </AvatarFallback>
                  </Avatar>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="end"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  sideOffset={4}
               >
                  {/* Header */}
                  <DropdownMenuLabel className="p-0 font-normal">
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                           <AvatarImage
                              alt={session?.user.name}
                              src={session?.user.image ?? ""}
                           />
                           <AvatarFallback className="rounded-lg">
                              {session?.user.name?.charAt(0) || "?"}
                           </AvatarFallback>
                        </Avatar>
                        <div className="grid  flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-medium">
                              {session?.user.name}
                           </span>
                           <span className="max-w-52 truncate text-xs text-muted-foreground">
                              {session?.user.email}
                           </span>
                        </div>
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Upgrade */}
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <a href={`/${activeOrganization.slug}/settings/billing`}>
                           <Sparkles />
                           {"Atualizar para Pro"}
                        </a>
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* Navigation */}
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <a href={`/${activeOrganization.slug}/settings/profile`}>
                           <BadgeCheck />
                           {"Conta"}
                        </a>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <a href={`/${activeOrganization.slug}/settings/billing`}>
                           <CreditCard />
                           {"Cobrança"}
                        </a>
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* Preferences */}
                  <DropdownMenuLabel>{"Preferencias"}</DropdownMenuLabel>
                  <div className="px-2 py-1.5 space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm">{"Tema"}</span>
                        <ThemeSwitcher />
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm">{"Idioma"}</span>
                        <LanguageCommand />
                     </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem onClick={handleLogoutClick}>
                     <LogOut />
                     {"Sair"}
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function NavUser() {
   return (
      <ErrorBoundary FallbackComponent={NavUserErrorFallback}>
         <Suspense fallback={<NavUserSkeleton />}>
            <NavUserContent />
         </Suspense>
      </ErrorBoundary>
   );
}
