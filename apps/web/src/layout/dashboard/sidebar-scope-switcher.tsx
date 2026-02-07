import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
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
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { Separator } from "@packages/ui/components/separator";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useRouter } from "@tanstack/react-router";
import {
   Building2,
   Check,
   ChevronDown,
   CreditCard,
   Settings,
   Users,
   Plus,
} from "lucide-react";
import { Suspense, useCallback, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CreateTeamForm } from "@/features/organization/ui/create-team-form";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useActiveTeam } from "@/hooks/use-active-team";
import { useSheet } from "@/hooks/use-sheet";
import { useCredenza } from "@/hooks/use-credenza";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Button } from "@packages/ui/components/button";
import { authClient } from "@/integrations/better-auth/auth-client";
import { orpc } from "@/integrations/orpc/client";

type Organization = {
   id: string;
   name: string;
   slug: string;
};

type Team = {
   id: string;
   name: string;
};

function getInitials(value: string) {
   if (!value) return "?";
   return value.trim().charAt(0).toUpperCase();
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
   const { activeOrganization, projectLimit, projectCount } = useActiveOrganization();
   const { activeTeam, teams } = useActiveTeam();
   const { openSheet } = useSheet();
   const { openCredenza, closeCredenza } = useCredenza();
   const { setActiveOrganization, isPending } = useSetActiveOrganization();
   const queryClient = useQueryClient();
   const router = useRouter();
   const { pathname } = useLocation();
   const params = useParams({ strict: false }) as { slug?: string };
   const currentSlug = params.slug ?? activeOrganization.slug;
   const { data: organizations } = useSuspenseQuery(
      orpc.organization.getOrganizations.queryOptions({}),
   );

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
      () =>
         organizationList.filter((org) => org.id !== activeOrganization.id),
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
            : `/${org.slug}/home`;

         router.navigate({ to: nextPath });
         setOrgOpen(false);
      },
      [
         activeOrganization.id,
         currentSlug,
         isPending,
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

         setTeamOpen(false);
      },
      [activeTeam?.id, queryClient],
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
                        Você está usando {projectCount} de {projectLimit} projetos
                     </CredenzaDescription>
                  </CredenzaHeader>
                  <CredenzaBody>
                     <p className="text-sm text-muted-foreground">
                        Faça upgrade para o add-on Boost para criar projetos ilimitados
                     </p>
                  </CredenzaBody>
                  <CredenzaFooter className="flex gap-2">
                     <Button variant="outline" onClick={closeCredenza}>
                        Cancelar
                     </Button>
                     <Button asChild>
                        <Link
                           to={`/${currentSlug}/billing`}
                           onClick={closeCredenza}
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
   }, [openSheet, openCredenza, closeCredenza, projectLimit, projectCount, teams.length, currentSlug]);

   const handleNavigate = useCallback(
      (path: string) => {
         router.navigate({ to: path });
         setOrgOpen(false);
      },
      [router],
   );

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <div className="flex items-center gap-2">
               <Popover onOpenChange={setOrgOpen} open={orgOpen}>
                  <PopoverTrigger asChild>
                     <SidebarMenuButton
                        aria-label="Switch organization"
                        className="h-12 w-12 justify-center p-0"
                        size="lg"
                        tooltip="Switch organization"
                     >
                        <Avatar className="h-8 w-8 rounded-md">
                           <AvatarImage alt="Organization" src="" />
                           <AvatarFallback className="rounded-md text-xs font-semibold">
                              {getInitials(activeOrganization.name)}
                           </AvatarFallback>
                        </Avatar>
                     </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0" sideOffset={8}>
                     <Command>
                        <CommandInput placeholder="Search organizations..." />
                        <CommandList>
                           <CommandEmpty>No organizations found.</CommandEmpty>
                           {currentOrg && (
                              <CommandGroup heading="Current organization">
                                 <CommandItem
                                    disabled
                                    value={currentOrg.name}
                                 >
                                    <Building2 className="size-4" />
                                    <span>{currentOrg.name}</span>
                                    <Check className="ml-auto size-4" />
                                 </CommandItem>
                              </CommandGroup>
                           )}
                           {otherOrgs.length > 0 && (
                              <CommandGroup heading="Organizations">
                                 {otherOrgs.map((org, index) => (
                                    <CommandItem
                                       key={`org-${index + 1}`}
                                       onSelect={() =>
                                          handleOrganizationSwitch(org)
                                       }
                                       value={`${org.name} ${org.slug}`}
                                    >
                                       <Building2 className="size-4" />
                                       <span>{org.name}</span>
                                    </CommandItem>
                                 ))}
                              </CommandGroup>
                           )}
                           <CommandSeparator />
                           <CommandGroup heading="Actions">
                              <CommandItem
                                 onSelect={() =>
                                    handleNavigate(`/${currentSlug}/billing`)
                                 }
                                 value="Billing"
                              >
                                 <CreditCard className="size-4" />
                                 <span>Billing</span>
                              </CommandItem>
                              <CommandItem
                                 onSelect={() =>
                                    handleNavigate(
                                       `/${currentSlug}/settings/profile`,
                                    )
                                 }
                                 value="Settings"
                              >
                                 <Settings className="size-4" />
                                 <span>Settings</span>
                              </CommandItem>
                           </CommandGroup>
                        </CommandList>
                     </Command>
                  </PopoverContent>
               </Popover>

               <Separator
                  className="h-6 group-data-[collapsible=icon]:hidden"
                  orientation="vertical"
               />

               <Popover onOpenChange={setTeamOpen} open={teamOpen}>
                  <PopoverTrigger asChild>
                     <SidebarMenuButton
                        aria-label="Switch project"
                        className="flex-1 justify-between gap-3 group-data-[collapsible=icon]:hidden"
                        size="lg"
                     >
                        <div className="grid flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-semibold">
                              {activeTeam?.name ?? "No project"}
                           </span>
                           <span className="truncate text-xs text-muted-foreground">
                              {activeOrganization.name}
                           </span>
                        </div>
                        <ChevronDown className="size-4" />
                     </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0" sideOffset={8}>
                     <Command>
                        <CommandInput placeholder="Search projects..." />
                        <CommandList>
                           <CommandEmpty>No projects found.</CommandEmpty>
                           {activeTeam && (
                              <CommandGroup heading="Current project">
                                 <CommandItem disabled value={activeTeam.name}>
                                    <Users className="size-4" />
                                    <span>{activeTeam.name}</span>
                                    <Check className="ml-auto size-4" />
                                 </CommandItem>
                              </CommandGroup>
                           )}
                           {otherTeams.length > 0 && (
                              <CommandGroup heading="Projects">
                                 {otherTeams.map((team, index) => (
                                    <CommandItem
                                       key={`team-${index + 1}`}
                                       onSelect={() => handleTeamSwitch(team)}
                                       value={team.name}
                                    >
                                       <Users className="size-4" />
                                       <span>{team.name}</span>
                                    </CommandItem>
                                 ))}
                              </CommandGroup>
                           )}
                           <CommandSeparator />
                           <CommandGroup heading="Actions">
                              <CommandItem
                                 onSelect={handleNewProject}
                                 value="New project"
                              >
                                 <Plus className="size-4" />
                                 <span>
                                    {projectLimit !== null
                                       ? `Novo projeto (${projectCount}/${projectLimit})`
                                       : "Novo projeto"}
                                 </span>
                              </CommandItem>
                           </CommandGroup>
                        </CommandList>
                     </Command>
                  </PopoverContent>
               </Popover>
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
