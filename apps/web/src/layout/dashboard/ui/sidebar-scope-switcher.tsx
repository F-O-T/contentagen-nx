import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
   CommandSeparator,
} from "@packages/ui/components/command";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
   Link,
   useLocation,
   useParams,
   useRouter,
} from "@tanstack/react-router";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useCredenza } from "@/hooks/use-credenza";
import { useSheet } from "@/hooks/use-sheet";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

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
   let hash = 0;
   for (const char of name) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
   }
   return ORG_AVATAR_COLORS[Math.abs(hash) % ORG_AVATAR_COLORS.length];
}

function RoleBadge({ role }: { role: string }) {
   return (
      <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted">
         {role}
      </span>
   );
}

function SidebarScopeSwitcherSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" size="lg">
               <div className="size-8 rounded-md bg-muted" />
               <div className="h-4 w-24 rounded bg-muted" />
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
   const { setActiveOrganization, isPending } = useSetActiveOrganization();
   const queryClient = useQueryClient();
   const router = useRouter();
   const { pathname } = useLocation();
   const params = useParams({ strict: false }) as {
      slug?: string;
      teamId?: string;
   };
   const currentSlug = params.slug ?? activeOrganization.slug;
   const { data: organizations } = useSuspenseQuery(
      orpc.organization.getOrganizations.queryOptions({}),
   );
   const { state } = useSidebar();
   const isCollapsed = state === "collapsed";

   const [orgOpen, setOrgOpen] = useState(false);
   const [teamOpen, setTeamOpen] = useState(false);

   const organizationList = organizations ?? [];

   const currentOrg = useMemo(
      () =>
         organizationList.find((org) => org.id === activeOrganization.id) ??
         null,
      [organizationList, activeOrganization.id],
   );

   const otherOrgs = useMemo(
      () => organizationList.filter((org) => org.id !== activeOrganization.id),
      [organizationList, activeOrganization.id],
   );

   const otherTeams = useMemo(
      () => teams.filter((team) => team.id !== activeTeam?.id),
      [teams, activeTeam?.id],
   );

   const handleOrganizationSwitch = useCallback(
      async (org: Organization) => {
         if (org.id === activeOrganization.id || isPending) {
            setOrgOpen(false);
            return;
         }

         await setActiveOrganization({
            organizationId: org.id,
            organizationSlug: org.slug,
         });

         const nextPath = pathname.startsWith(`/${currentSlug}`)
            ? pathname.replace(`/${currentSlug}`, `/${org.slug}`)
            : `/${org.slug}/${params.teamId ?? ""}/home`;

         router.navigate({ to: nextPath });
         setOrgOpen(false);
      },
      [
         activeOrganization.id,
         currentSlug,
         isPending,
         params.teamId,
         pathname,
         router,
         setActiveOrganization,
      ],
   );

   const handleTeamSwitch = useCallback(
      async (team: Team) => {
         if (team.id === activeTeam?.id) {
            setTeamOpen(false);
            return;
         }

         await authClient.organization.setActiveTeam({
            teamId: team.id,
         });

         await queryClient.invalidateQueries({
            queryKey: orpc.session.getSession.queryKey({}),
         });

         if (currentSlug) {
            const prefix = `/${currentSlug}`;
            let nextPath = `/${currentSlug}/${team.id}/home`;

            if (pathname.startsWith(`${prefix}/`)) {
               nextPath = params.teamId
                  ? pathname.replace(
                       `${prefix}/${params.teamId}`,
                       `${prefix}/${team.id}`,
                    )
                  : `/${currentSlug}/${team.id}${pathname.slice(prefix.length)}`;
            }

            router.navigate({ to: nextPath });
         }

         setTeamOpen(false);
      },
      [
         activeTeam?.id,
         currentSlug,
         params.teamId,
         pathname,
         queryClient,
         router,
      ],
   );

   const handleNewProject = useCallback(() => {
      setTeamOpen(false);

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
                           params={{
                              slug: currentSlug,
                              teamId: params.teamId ?? "",
                           }}
                           to="/$slug/$teamId/billing"
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

      openSheet({
         children: <CreateTeamForm />,
      });
   }, [
      openSheet,
      openCredenza,
      closeCredenza,
      projectLimit,
      projectCount,
      teams.length,
      currentSlug,
   ]);

   const handleNewOrganization = useCallback(() => {
      setOrgOpen(false);
      openSheet({
         children: <ManageOrganizationForm />,
      });
   }, [openSheet]);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <div
               className={`flex items-center ${isCollapsed ? "justify-center" : "gap-1.5"}`}
            >
               <Popover onOpenChange={setOrgOpen} open={orgOpen}>
                  <PopoverTrigger asChild>
                     <button
                        aria-label="Organizacao"
                        className={`flex shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent ${isCollapsed ? "w-full p-0" : "p-1.5"}`}
                        type="button"
                     >
                        <Avatar
                           className={`${isCollapsed ? "size-6" : "size-8"} rounded-md`}
                        >
                           <AvatarImage
                              alt={activeOrganization.name}
                              src={activeOrganization.logo ?? undefined}
                           />
                           <AvatarFallback
                              className={`rounded-md text-xs font-bold text-white ${getOrgColor(activeOrganization.name)}`}
                           >
                              {getInitials(activeOrganization.name)}
                           </AvatarFallback>
                        </Avatar>
                     </button>
                  </PopoverTrigger>
                  <PopoverContent
                     align="start"
                     className="w-72 p-0"
                     sideOffset={8}
                  >
                     <Command>
                        <CommandInput placeholder="Filtrar organizacoes..." />
                        <CommandList>
                           <CommandEmpty>
                              Nenhum resultado encontrado.
                           </CommandEmpty>
                           {currentOrg && (
                              <CommandGroup heading="Organizacao atual">
                                 <CommandItem disabled value={currentOrg.name}>
                                    <Avatar className="size-5 rounded-md">
                                       <AvatarImage
                                          alt={currentOrg.name}
                                          src={currentOrg.logo ?? undefined}
                                       />
                                       <AvatarFallback
                                          className={`rounded-md text-[10px] font-bold text-white ${getOrgColor(currentOrg.name)}`}
                                       >
                                          {getInitials(currentOrg.name)}
                                       </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                       {currentOrg.name}
                                    </span>
                                    {currentOrg.role && (
                                       <RoleBadge role={currentOrg.role} />
                                    )}
                                    <Check className="ml-1 size-4 shrink-0" />
                                 </CommandItem>
                              </CommandGroup>
                           )}
                           {otherOrgs.length > 0 && (
                              <CommandGroup heading="Outras organizacoes">
                                 {otherOrgs.map((org, index) => (
                                    <CommandItem
                                       key={`org-${index + 1}`}
                                       onSelect={() =>
                                          handleOrganizationSwitch(org)
                                       }
                                       value={org.name}
                                    >
                                       <Avatar className="size-5 rounded-md">
                                          <AvatarImage
                                             alt={org.name}
                                             src={org.logo ?? undefined}
                                          />
                                          <AvatarFallback
                                             className={`rounded-md text-[10px] font-bold text-white ${getOrgColor(org.name)}`}
                                          >
                                             {getInitials(org.name)}
                                          </AvatarFallback>
                                       </Avatar>
                                       <span className="truncate">
                                          {org.name}
                                       </span>
                                       {org.role && (
                                          <RoleBadge role={org.role} />
                                       )}
                                    </CommandItem>
                                 ))}
                              </CommandGroup>
                           )}
                           <CommandSeparator />
                           <CommandGroup>
                              <CommandItem
                                 onSelect={handleNewOrganization}
                                 value="Nova organizacao"
                              >
                                 <Plus className="size-4" />
                                 <span>Nova organizacao</span>
                              </CommandItem>
                           </CommandGroup>
                        </CommandList>
                     </Command>
                  </PopoverContent>
               </Popover>

               {!isCollapsed && (
                  <Popover onOpenChange={setTeamOpen} open={teamOpen}>
                     <PopoverTrigger asChild>
                        <button
                           aria-label="Projeto"
                           className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                           type="button"
                        >
                           <span className="truncate font-medium flex-1">
                              {activeTeam?.name ?? "Sem projeto"}
                           </span>
                           <ChevronDown className="ml-auto size-4" />
                        </button>
                     </PopoverTrigger>
                     <PopoverContent
                        align="start"
                        className="w-72 p-0"
                        sideOffset={8}
                     >
                        <Command>
                           <CommandInput placeholder="Filtrar projetos..." />
                           <CommandList>
                              <CommandEmpty>
                                 Nenhum resultado encontrado.
                              </CommandEmpty>
                              <CommandGroup heading="Projetos">
                                 {activeTeam && (
                                    <CommandItem
                                       disabled
                                       value={activeTeam.name}
                                    >
                                       <Check className="size-4" />
                                       <span className="truncate">
                                          {activeTeam.name}
                                       </span>
                                    </CommandItem>
                                 )}
                                 {otherTeams.map((team, index) => (
                                    <CommandItem
                                       key={`team-${index + 1}`}
                                       onSelect={() => handleTeamSwitch(team)}
                                       value={team.name}
                                    >
                                       <span className="size-4" />
                                       <span className="truncate">
                                          {team.name}
                                       </span>
                                    </CommandItem>
                                 ))}
                                 <CommandItem
                                    onSelect={handleNewProject}
                                    value="Novo projeto"
                                 >
                                    <Plus className="size-4" />
                                    <span>
                                       {projectLimit !== null &&
                                       projectLimit !== Number.POSITIVE_INFINITY
                                          ? `Novo projeto (${projectCount}/${projectLimit})`
                                          : "Novo projeto"}
                                    </span>
                                 </CommandItem>
                              </CommandGroup>
                           </CommandList>
                        </Command>
                     </PopoverContent>
                  </Popover>
               )}
            </div>
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
