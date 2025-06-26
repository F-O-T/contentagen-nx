import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { Button } from "@packages/ui/components/button";

const data = {
  documents: [
    {
      icon: DatabaseIcon,
      name: "Data Library",
      url: "#",
    },
    {
      icon: ClipboardListIcon,
      name: "Reports",
      url: "#",
    },
    {
      icon: FileIcon,
      name: "Word Assistant",
      url: "#",
    },
  ],
  navClouds: [
    {
      icon: CameraIcon,
      isActive: true,
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
      title: "Capture",
      url: "#",
    },
    {
      icon: FileTextIcon,
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
      title: "Proposal",
      url: "#",
    },
    {
      icon: FileCodeIcon,
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
      title: "Prompts",
      url: "#",
    },
  ],
  navMain: [
    {
      icon: LayoutDashboardIcon,
      title: "Dashboard",
      url: "#",
    },
    {
      icon: ListIcon,
      title: "Lifecycle",
      url: "#",
    },
    {
      icon: BarChartIcon,
      title: "Analytics",
      url: "#",
    },
    {
      icon: FolderIcon,
      title: "Projects",
      url: "#",
    },
    {
      icon: UsersIcon,
      title: "Team",
      url: "#",
    },
  ],
  navSecondary: [
    {
      icon: SettingsIcon,
      title: "Settings",
      url: "#",
    },
    {
      icon: HelpCircleIcon,
      title: "Get Help",
      url: "#",
    },
    {
      icon: SearchIcon,
      title: "Search",
      url: "#",
    },
  ],
  user: {
    avatar: "/avatars/shadcn.jpg",
    email: "m@example.com",
    name: "shadcn",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Button>
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
