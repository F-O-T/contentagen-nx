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
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, CreditCard, LogOut, Sparkles } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { authClient } from "@/integrations/better-auth/auth-client";
import { type Outputs, orpc } from "@/integrations/orpc/client";
import { LanguageCommand } from "./language-command";
import { ThemeSwitcher } from "./theme-switcher";

type NavLinkItem = {
   to: string;
   icon: LucideIcon;
   label: string;
};

const UPGRADE_LINKS: NavLinkItem[] = [
   {
      to: "/$slug/$teamSlug/billing",
      icon: Sparkles,
      label: "Atualizar para Pro",
   },
];

const ACCOUNT_LINKS: NavLinkItem[] = [
   {
      to: "/$slug/$teamSlug/settings/profile",
      icon: BadgeCheck,
      label: "Conta",
   },
   {
      to: "/$slug/$teamSlug/billing",
      icon: CreditCard,
      label: "Cobrança",
   },
];

function UserAvatar({
   name,
   image,
   size = "sm",
}: {
   name: string;
   image?: string | null;
   size?: "sm" | "lg";
}) {
   return (
      <Avatar className={size === "lg" ? "h-8 w-8 rounded-lg" : "size-4"}>
         <AvatarImage alt={name} src={image ?? ""} />
         <AvatarFallback
            className={`rounded-lg ${size === "sm" ? "text-[10px]" : ""}`}
         >
            {name.charAt(0) || "?"}
         </AvatarFallback>
      </Avatar>
   );
}

function NavUserCredenza({
   session,
   params,
   onNavigate,
   onLogout,
}: {
   session: Outputs["session"]["getSession"];
   params: { slug: string; teamSlug: string };
   onNavigate: () => void;
   onLogout: () => void;
}) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>{session?.user.name ?? ""}</CredenzaTitle>
            <CredenzaDescription className="truncate">
               {session?.user.email ?? ""}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {UPGRADE_LINKS.map((link) => (
               <Button
                  asChild
                  className="w-full justify-start gap-2"
                  key={link.label}
                  onClick={onNavigate}
                  variant="outline"
               >
                  <Link params={params} to={link.to}>
                     <link.icon className="size-4" />
                     {link.label}
                  </Link>
               </Button>
            ))}

            <div className="space-y-2">
               {ACCOUNT_LINKS.map((link) => (
                  <Button
                     asChild
                     className="w-full justify-start gap-2"
                     key={link.label}
                     onClick={onNavigate}
                     variant="outline"
                  >
                     <Link params={params} to={link.to}>
                        <link.icon className="size-4" />
                        {link.label}
                     </Link>
                  </Button>
               ))}
            </div>

            <div className="space-y-3">
               <span className="text-sm font-medium text-muted-foreground">
                  Preferencias
               </span>
               <div className="flex items-center justify-between">
                  <span className="text-sm">Tema</span>
                  <ThemeSwitcher />
               </div>
               <div className="flex items-center justify-between gap-8">
                  <span className="text-sm">Idioma</span>
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
               Sair
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
      <SidebarMenuItem>
         <SidebarMenuButton className="pointer-events-none" size="lg">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
               <Skeleton className="h-4 w-24 mb-1" />
               <Skeleton className="h-3 w-32" />
            </div>
         </SidebarMenuButton>
      </SidebarMenuItem>
   );
}

function NavUserContent() {
   const { isMobile, setOpenMobile } = useSidebar();
   const router = useRouter();
   const queryClient = useQueryClient();
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
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
               router.navigate({ to: "/auth/sign-in" });
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
      openCredenza({
         children: (
            <NavUserCredenza
               onLogout={handleLogoutClick}
               onNavigate={handleNavigate}
               params={params}
               session={session}
            />
         ),
      });
   }, [openCredenza, session, params, handleNavigate, handleLogoutClick]);

   if (isMobile) {
      return (
         <SidebarMenuItem>
            <SidebarMenuButton onClick={handleOpenCredenza} tooltip="Account">
               <UserAvatar
                  image={session?.user.image}
                  name={session?.user.name ?? ""}
               />
               <span className="truncate">{session?.user.name}</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
      );
   }

   return (
      <SidebarMenuItem>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <SidebarMenuButton tooltip="Account">
                  <UserAvatar
                     image={session?.user.image}
                     name={session?.user.name ?? ""}
                  />
                  <span className="truncate">{session?.user.name}</span>
               </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               align="start"
               className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
               side="right"
               sideOffset={8}
            >
               <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                     <UserAvatar
                        image={session?.user.image}
                        name={session?.user.name ?? ""}
                        size="lg"
                     />
                     <div className="grid flex-1 text-left text-sm leading-tight">
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

               <DropdownMenuGroup>
                  {UPGRADE_LINKS.map((link) => (
                     <DropdownMenuItem asChild key={link.label}>
                        <Link params={params} to={link.to}>
                           <link.icon />
                           {link.label}
                        </Link>
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuGroup>
               <DropdownMenuSeparator />

               <DropdownMenuGroup>
                  {ACCOUNT_LINKS.map((link) => (
                     <DropdownMenuItem asChild key={link.label}>
                        <Link params={params} to={link.to}>
                           <link.icon />
                           {link.label}
                        </Link>
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuGroup>
               <DropdownMenuSeparator />

               <DropdownMenuLabel>Preferencias</DropdownMenuLabel>
               <div className="px-2 py-1.5 space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="text-sm">Tema</span>
                     <ThemeSwitcher />
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm">Idioma</span>
                     <LanguageCommand />
                  </div>
               </div>
               <DropdownMenuSeparator />

               <DropdownMenuItem onClick={handleLogoutClick}>
                  <LogOut />
                  Sair
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </SidebarMenuItem>
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
