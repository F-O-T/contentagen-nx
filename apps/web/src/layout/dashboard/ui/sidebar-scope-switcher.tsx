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
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
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
import {
   Link,
   useLocation,
   useParams,
   useRouter,
} from "@tanstack/react-router";
import {
   Check,
   ChevronsUpDown,
   CreditCard,
   LogOut,
   Plus,
   Settings,
   UserPlus,
} from "lucide-react";
import { Suspense, useCallback, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";
import { ThemeSwitcher } from "./theme-switcher";

type Organization = {
   id: string;
   name: string;
   slug: string;
   logo?: string | null;
   role?: string;
};

type Team = {
   id: string;
   name: string;
   slug: string;
};

const ORG_AVATAR_COLORS = [
   "bg-blue-600",
   "bg-emerald-600",
   "bg-violet-600",
   "bg-amber-600",
   "bg-rose-600",
   "bg-cyan-600",
   "bg-pink-600",
   "bg-indigo-600",
];

function getInitials(value: string) {
   if (!value) return "?";
   return value.trim().charAt(0).toUpperCase();
}

function getOrgColor(name: string): string {
   if (!name) return ORG_AVATAR_COLORS[0] ?? "";
   let hash = 0;
   for (const char of name) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
   }
   return ORG_AVATAR_COLORS[Math.abs(hash) % ORG_AVATAR_COLORS.length] ?? "";
}

function OrgAvatar({
   name,
   logo,
   size = "sm",
}: {
   name: string;
   logo?: string | null;
   size?: "sm" | "md";
}) {
   const sizeClass = size === "md" ? "size-5 rounded-md" : "size-4 rounded-sm";
   return (
      <Avatar className={`${sizeClass} shrink-0`}>
         <AvatarImage alt={name} src={logo ?? undefined} />
         <AvatarFallback
            className={`${sizeClass} text-[9px] font-bold text-white ${getOrgColor(name)}`}
         >
            {getInitials(name)}
         </AvatarFallback>
      </Avatar>
   );
}

function SidebarScopeSwitcherSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" size="lg">
               <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted" />
               <div className="grid flex-1 gap-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
               </div>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

function SidebarScopeSwitcherContent() {
   const { activeOrganization, projectLimit, projectCount } =
      useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { openSheet } = useSheet();
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const { setActiveOrganization } = useSetActiveOrganization();
   const [isPending, startTransition] = useTransition();
   const queryClient = useQueryClient();
   const router = useRouter();
   const { pathname } = useLocation();
   const { isMobile, setOpenMobile } = useSidebar();
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const currentSlug = params.slug ?? activeOrganization.slug;
   const slug = params.slug ?? "";
   const teamSlug = params.teamSlug ?? "";

   const { data: organizations } = useSuspenseQuery(
      orpc.organization.getOrganizations.queryOptions({}),
   );
   const { data: session } = useSuspenseQuery(
      orpc.session.getSession.queryOptions({}),
   );

   const organizationList = organizations ?? [];

   const handleOrganizationSwitch = useCallback(
      (org: Organization) => {
         if (org.id === activeOrganization.id || isPending) return;

         startTransition(async () => {
            await setActiveOrganization({
               organizationId: org.id,
               organizationSlug: org.slug,
            });

            const nextPath = pathname.startsWith(`/${currentSlug}`)
               ? pathname.replace(`/${currentSlug}`, `/${org.slug}`)
               : `/${org.slug}/${params.teamSlug ?? ""}/home`;

            router.navigate({ to: nextPath });
         });
      },
      [
         activeOrganization.id,
         currentSlug,
         isPending,
         params.teamSlug,
         pathname,
         router,
         setActiveOrganization,
         startTransition,
      ],
   );

   const handleTeamSwitch = useCallback(
      async (team: Team) => {
         if (team.id === activeTeam?.id) return;

         await authClient.organization.setActiveTeam({ teamId: team.id });

         await queryClient.invalidateQueries({
            queryKey: orpc.session.getSession.queryKey({}),
         });

         if (currentSlug) {
            const teamParam = team.slug;
            const prefix = `/${currentSlug}`;
            let nextPath = `/${currentSlug}/${teamParam}/home`;

            if (pathname.startsWith(`${prefix}/`)) {
               nextPath = params.teamSlug
                  ? pathname.replace(
                       `${prefix}/${params.teamSlug}`,
                       `${prefix}/${teamParam}`,
                    )
                  : `/${currentSlug}/${teamParam}${pathname.slice(prefix.length)}`;
            }

            router.navigate({ to: nextPath });
         }
      },
      [
         activeTeam?.id,
         currentSlug,
         params.teamSlug,
         pathname,
         queryClient,
         router,
      ],
   );

   const handleNewProject = useCallback(
      (e?: React.MouseEvent) => {
         e?.stopPropagation();

         if (projectLimit !== null && teams.length >= projectLimit) {
            openCredenza({
               children: (
                  <>
                     <CredenzaHeader>
                        <CredenzaTitle>Limite de projetos</CredenzaTitle>
                        <CredenzaDescription>
                           Voce esta usando {projectCount} de {projectLimit}{" "}
                           projetos
                        </CredenzaDescription>
                     </CredenzaHeader>
                     <CredenzaBody>
                        <p className="text-sm text-muted-foreground">
                           Faca upgrade para o add-on Boost para criar projetos
                           ilimitados
                        </p>
                     </CredenzaBody>
                     <CredenzaFooter className="flex gap-2">
                        <Button onClick={closeCredenza} variant="outline">
                           Cancelar
                        </Button>
                        <Button asChild>
                           <Link
                              onClick={closeCredenza}
                              params={{ slug, teamSlug }}
                              to="/$slug/$teamSlug/billing"
                           >
                              Ver planos
                           </Link>
                        </Button>
                     </CredenzaFooter>
                  </>
               ),
            });
            return;
         }

         openSheet({ children: <CreateTeamForm /> });
      },
      [
         openSheet,
         openCredenza,
         closeCredenza,
         projectLimit,
         projectCount,
         teams.length,
         slug,
         teamSlug,
      ],
   );

   const handleNewOrganization = useCallback(
      (e?: React.MouseEvent) => {
         e?.stopPropagation();
         openSheet({ children: <ManageOrganizationForm /> });
      },
      [openSheet],
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
      openAlertDialog({
         actionLabel: "Sair",
         cancelLabel: "Cancelar",
         description: "Tem certeza que deseja sair da sua conta?",
         onAction: handleLogout,
         title: "Sair da Conta",
         variant: "destructive",
      });
   }, [openAlertDialog, handleLogout]);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <Avatar className="aspect-square size-8 shrink-0 rounded-lg">
                        <AvatarImage
                           alt={activeOrganization.name}
                           src={activeOrganization.logo ?? undefined}
                        />
                        <AvatarFallback
                           className={`rounded-lg text-xs font-bold text-white ${getOrgColor(activeOrganization.name)}`}
                        >
                           {getInitials(activeOrganization.name)}
                        </AvatarFallback>
                     </Avatar>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                           {activeTeam?.name ?? "Sem projeto"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                           {activeOrganization.name}
                        </span>
                     </div>
                     <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>

               <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-72 rounded-lg"
                  side={isMobile ? "bottom" : "bottom"}
                  sideOffset={4}
               >
                  {/* ── PROJECT ── */}
                  <DropdownMenuLabel className="flex items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                     Projeto
                     <button
                        className="rounded p-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={handleNewProject}
                        title="Novo projeto"
                        type="button"
                     >
                        <Plus className="size-3.5" />
                     </button>
                  </DropdownMenuLabel>

                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger className="gap-2">
                        <span className="truncate font-medium">
                           {activeTeam?.name ?? "Sem projeto"}
                        </span>
                     </DropdownMenuSubTrigger>
                     <DropdownMenuSubContent className="min-w-52">
                        {teams.map((team, index) => (
                           <DropdownMenuItem
                              key={`team-${index + 1}`}
                              onSelect={() => handleTeamSwitch(team)}
                           >
                              {team.id === activeTeam?.id ? (
                                 <Check className="size-4 shrink-0" />
                              ) : (
                                 <span className="size-4 shrink-0" />
                              )}
                              <span className="truncate">{team.name}</span>
                           </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleNewProject()}>
                           <Plus className="size-4" />
                           <span>
                              {projectLimit !== null &&
                              projectLimit !== Number.POSITIVE_INFINITY
                                 ? `Novo projeto (${projectCount}/${projectLimit})`
                                 : "Novo projeto"}
                           </span>
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem asChild>
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/settings/organization/members"
                     >
                        <UserPlus className="size-4" />
                        Convidar membros
                     </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/settings/project/general"
                     >
                        <Settings className="size-4" />
                        Configurações do projeto
                     </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* ── ORGANIZATION ── */}
                  <DropdownMenuLabel className="flex items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                     Organização
                     <button
                        className="rounded p-0.5 transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={handleNewOrganization}
                        title="Nova organização"
                        type="button"
                     >
                        <Plus className="size-3.5" />
                     </button>
                  </DropdownMenuLabel>

                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger className="gap-2">
                        <OrgAvatar
                           logo={activeOrganization.logo}
                           name={activeOrganization.name}
                        />
                        <span className="truncate font-medium">
                           {activeOrganization.name}
                        </span>
                     </DropdownMenuSubTrigger>
                     <DropdownMenuSubContent className="min-w-52">
                        {organizationList.map((org, index) => (
                           <DropdownMenuItem
                              key={`org-${index + 1}`}
                              onSelect={() => handleOrganizationSwitch(org)}
                           >
                              {org.id === activeOrganization.id ? (
                                 <Check className="size-4 shrink-0" />
                              ) : (
                                 <span className="size-4 shrink-0" />
                              )}
                              <OrgAvatar
                                 logo={org.logo}
                                 name={org.name}
                                 size="md"
                              />
                              <span className="truncate">{org.name}</span>
                              {org.role && (
                                 <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                                    {org.role}
                                 </span>
                              )}
                           </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           onSelect={() => handleNewOrganization()}
                        >
                           <Plus className="size-4" />
                           Nova organização
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem asChild>
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/billing"
                     >
                        <CreditCard className="size-4" />
                        Cobrança & uso
                     </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/settings/organization/general"
                     >
                        <Settings className="size-4" />
                        Configurações da organização
                     </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* ── ACCOUNT ── */}
                  <DropdownMenuLabel className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                     Conta
                  </DropdownMenuLabel>

                  <div className="flex items-center justify-between px-2 py-1.5">
                     <span className="text-sm text-muted-foreground">Tema</span>
                     <ThemeSwitcher />
                  </div>

                  <DropdownMenuItem asChild className="py-2">
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/settings/profile"
                     >
                        <Avatar className="size-6 shrink-0 rounded-full">
                           <AvatarImage
                              alt={session?.user.name ?? ""}
                              src={session?.user.image ?? undefined}
                           />
                           <AvatarFallback className="rounded-full text-[10px]">
                              {session?.user.name?.charAt(0) ?? "?"}
                           </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 leading-tight">
                           <span className="truncate text-sm font-medium">
                              {session?.user.name}
                           </span>
                           <span className="truncate text-xs text-muted-foreground">
                              {session?.user.email}
                           </span>
                        </div>
                     </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={handleLogoutClick}>
                     <LogOut className="size-4" />
                     Sair
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function SidebarScopeSwitcher() {
   return (
      <ErrorBoundary fallbackRender={() => <SidebarScopeSwitcherSkeleton />}>
         <Suspense fallback={<SidebarScopeSwitcherSkeleton />}>
            <SidebarScopeSwitcherContent />
         </Suspense>
      </ErrorBoundary>
   );
}
