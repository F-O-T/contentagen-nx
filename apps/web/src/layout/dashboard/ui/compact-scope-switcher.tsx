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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useParams, useRouter } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { Suspense, useCallback, useMemo, useState, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { orpc } from "@/integrations/orpc/client";

type Organization = {
   id: string;
   name: string;
   slug: string;
   logo?: string | null;
   role?: string;
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

function RoleBadge({ role }: { role: string }) {
   return (
      <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted">
         {role}
      </span>
   );
}

function CompactScopeSwitcherSkeleton() {
   return <div className="size-7 rounded-md bg-muted animate-pulse" />;
}

function CompactScopeSwitcherContent() {
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { setActiveOrganization } = useSetActiveOrganization();
   const [isPending, startTransition] = useTransition();
   const router = useRouter();
   const { pathname } = useLocation();
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const currentSlug = params.slug ?? activeOrganization.slug;
   const { data: organizations } = useSuspenseQuery(
      orpc.organization.getOrganizations.queryOptions({}),
   );

   const [open, setOpen] = useState(false);

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

   const handleOrganizationSwitch = useCallback(
      (org: Organization) => {
         if (org.id === activeOrganization.id || isPending) {
            setOpen(false);
            return;
         }

         startTransition(async () => {
            await setActiveOrganization({
               organizationId: org.id,
               organizationSlug: org.slug,
            });

            const nextPath = pathname.startsWith(`/${currentSlug}`)
               ? pathname.replace(`/${currentSlug}`, `/${org.slug}`)
               : `/${org.slug}/${params.teamSlug ?? ""}/home`;

            router.navigate({ to: nextPath });
            setOpen(false);
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

   const handleNewOrganization = useCallback(() => {
      setOpen(false);
      openSheet({
         children: <ManageOrganizationForm />,
      });
   }, [openSheet]);

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <Tooltip>
            <TooltipTrigger asChild>
               <PopoverTrigger asChild>
                  <button
                     aria-label={`${activeOrganization.name} - Trocar organização`}
                     className="flex items-center justify-center rounded-md p-1 hover:bg-accent transition-colors"
                     type="button"
                  >
                     <Avatar className="size-7 rounded-md">
                        <AvatarImage
                           alt={activeOrganization.name}
                           src={activeOrganization.logo ?? undefined}
                        />
                        <AvatarFallback
                           className={cn(
                              "rounded-md text-xs font-bold text-white",
                              getOrgColor(activeOrganization.name),
                           )}
                        >
                           {getInitials(activeOrganization.name)}
                        </AvatarFallback>
                     </Avatar>
                  </button>
               </PopoverTrigger>
            </TooltipTrigger>
            {!open && (
               <TooltipContent side="right" sideOffset={8}>
                  {activeOrganization.name}
               </TooltipContent>
            )}
         </Tooltip>
         <PopoverContent
            align="start"
            className="w-72 p-0"
            side="right"
            sideOffset={8}
         >
            <Command>
               <CommandInput placeholder="Filtrar organizações..." />
               <CommandList>
                  <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
                  {currentOrg && (
                     <CommandGroup heading="Organização atual">
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
                           <span className="truncate">{currentOrg.name}</span>
                           {currentOrg.role && (
                              <RoleBadge role={currentOrg.role} />
                           )}
                           <Check className="ml-1 size-4 shrink-0" />
                        </CommandItem>
                     </CommandGroup>
                  )}
                  {otherOrgs.length > 0 && (
                     <CommandGroup heading="Outras organizações">
                        {otherOrgs.map((org, index) => (
                           <CommandItem
                              key={`org-${index + 1}`}
                              onSelect={() => handleOrganizationSwitch(org)}
                              value={`${org.name} ${org.slug}`}
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
                              <span className="truncate">{org.name}</span>
                              {org.role && <RoleBadge role={org.role} />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  )}
                  <CommandSeparator />
                  <CommandGroup>
                     <CommandItem
                        onSelect={handleNewOrganization}
                        value="Nova organização"
                     >
                        <Plus className="size-4" />
                        <span>Nova organização</span>
                     </CommandItem>
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}

export function CompactScopeSwitcher() {
   return (
      <ErrorBoundary fallbackRender={() => <CompactScopeSwitcherSkeleton />}>
         <Suspense fallback={<CompactScopeSwitcherSkeleton />}>
            <CompactScopeSwitcherContent />
         </Suspense>
      </ErrorBoundary>
   );
}
