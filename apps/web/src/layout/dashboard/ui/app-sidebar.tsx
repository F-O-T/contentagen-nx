import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverDescription,
   PopoverHeader,
   PopoverTitle,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import {
   Bug,
   ExternalLink,
   Lightbulb,
   MessageSquarePlus,
   PanelLeftClose,
   Settings,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { BugReportForm } from "@/features/feedback/ui/bug-report-form";
import { FeatureRequestForm } from "@/features/feedback/ui/feature-request-form";
import { useCredenza } from "@/hooks/use-credenza";
import { EarlyAccessSidebarBanner } from "./early-access-sidebar-banner";
import { SidebarDefaultItems, SidebarNav } from "./sidebar-nav";
import { SidebarScopeSwitcher } from "./sidebar-scope-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar className="px-0" collapsible="icon" variant="inset" {...props}>
         <SidebarHeader>
            <SidebarScopeSwitcher />
         </SidebarHeader>

         <SidebarContent>
            <SidebarDefaultItems />
            <div className="px-2">
               <Separator />
            </div>
            <SidebarNav />
         </SidebarContent>

         <SidebarFooter>
            <EarlyAccessSidebarBanner />
            <Separator />
            <SidebarFooterContent />
         </SidebarFooter>
      </Sidebar>
   );
}

const DOCS_URL = "https://contentta.co/docs";

function SidebarFeedbackButton() {
   const [open, setOpen] = useState(false);
   const { openCredenza, closeCredenza } = useCredenza();

   return (
      <SidebarMenuItem>
         <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
               <SidebarMenuButton tooltip="Feedback">
                  <MessageSquarePlus />
                  <span>Feedback</span>
               </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent
               align="end"
               className="w-56 p-2"
               side="right"
               sideOffset={8}
            >
               <PopoverHeader className="mb-2">
                  <PopoverTitle>Feedback</PopoverTitle>
                  <PopoverDescription>
                     Reporte bugs ou sugira melhorias.
                  </PopoverDescription>
               </PopoverHeader>
               <div className="flex flex-col gap-1">
                  <Button
                     className="justify-start gap-3"
                     onClick={() => {
                        setOpen(false);
                        openCredenza({
                           children: (
                              <BugReportForm onSuccess={closeCredenza} />
                           ),
                        });
                     }}
                     variant="ghost"
                  >
                     <Bug className="size-4 text-red-500" />
                     <span>Reportar Bug</span>
                  </Button>
                  <Button
                     className="justify-start gap-3"
                     onClick={() => {
                        setOpen(false);
                        openCredenza({
                           children: (
                              <FeatureRequestForm onSuccess={closeCredenza} />
                           ),
                        });
                     }}
                     variant="ghost"
                  >
                     <Lightbulb className="size-4 text-amber-500" />
                     <span>Sugerir Feature</span>
                  </Button>
                  <Button
                     asChild
                     className="justify-start gap-3"
                     variant="ghost"
                  >
                     <a
                        href={DOCS_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        <ExternalLink className="size-4 text-blue-500" />
                        <span>Documentação</span>
                     </a>
                  </Button>
               </div>
            </PopoverContent>
         </Popover>
      </SidebarMenuItem>
   );
}

function SidebarFooterContent() {
   const params = useParams({
      from: "/_authenticated/$slug/$teamSlug/_dashboard",
   });
   const slug = params.slug ?? "";
   const teamSlug = params.teamSlug ?? "";
   const { toggleSidebar, state } = useSidebar();

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               onClick={toggleSidebar}
               tooltip={state === "expanded" ? "Ocultar" : "Abrir"}
            >
               <PanelLeftClose
                  className={state === "collapsed" ? "rotate-180" : ""}
               />
               <span>Ocultar</span>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Configuracoes">
               <Link params={{ slug, teamSlug }} to="/$slug/$teamSlug/settings">
                  <Settings />
                  <span>Configuracoes</span>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
         <SidebarFeedbackButton />
      </SidebarMenu>
   );
}
