import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";
import { useEarlyAccess } from "@/hooks/use-early-access";

export function EarlyAccessSidebarBanner() {
   const { isBannerVisible, dismissBanner } = useEarlyAccess();
   const { slug, teamSlug } = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });

   if (!isBannerVisible) return null;

   return (
      <SidebarGroup className="py-2">
         <SidebarGroupContent>
            {/* Expanded view */}
            <div className="group-data-[collapsible=icon]:hidden rounded-md border border-border/50 bg-muted/50 p-3 mx-2">
               <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                     <FlaskConical className="size-4 shrink-0 text-primary" />
                     <span className="text-xs font-medium">
                        Funcionalidades em Beta
                     </span>
                  </div>
                  <button
                     className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                     onClick={dismissBanner}
                     type="button"
                  >
                     <X className="size-3" />
                  </button>
               </div>
               <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  Experimente recursos antes de todo mundo.
               </p>
               <Link
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  params={{ slug, teamSlug }}
                  to="/$slug/$teamSlug/settings/feature-previews"
               >
                  Ver funcionalidades
               </Link>
            </div>

            {/* Collapsed (icon-only) view */}
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
               <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Funcionalidades em Beta">
                     <Link
                        params={{ slug, teamSlug }}
                        to="/$slug/$teamSlug/settings/feature-previews"
                     >
                        <FlaskConical />
                        <span>Beta</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
