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
  IconArticle,
  IconBulb,
  IconChartLine,
  IconFileExport,
  IconFolder,
  IconHelp,
  IconPencil,
  IconRobot,
  IconSearch,
  IconSettings,
  IconTemplate,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

const data = {
  documents: [
    {
      icon: IconTemplate,
      name: "Content Templates",
      url: "#",
    },
    {
      icon: IconChartLine,
      name: "Analytics",
      url: "#",
    },
    {
      icon: IconFileExport,
      name: "Export Library",
      url: "#",
    },
  ],
  navClouds: [
    {
      icon: IconBulb,
      isActive: true,
      items: [
        {
          title: "Tech Blog Ideas",
          url: "#",
        },
        {
          title: "Health & Wellness",
          url: "#",
        },
      ],
      title: "Content Ideas",
      url: "#",
    },
    {
      icon: IconArticle,
      items: [
        {
          title: "In Progress",
          url: "#",
        },
        {
          title: "Ready to Publish",
          url: "#",
        },
      ],
      title: "Drafts",
      url: "#",
    },
    {
      icon: IconRobot,
      items: [
        {
          title: "Tech Writer",
          url: "#",
        },
        {
          title: "Lifestyle Blogger",
          url: "#",
        },
      ],
      title: "AI Agents",
      url: "#",
    },
  ],
  navMain: [
    {
      icon: IconRobot,
      title: "AI Agents",
      url: "/agents",
    },
    {
      icon: IconArticle,
      title: "Content",
      url: "#",
    },
    {
      icon: IconFolder,
      title: "Projects",
      url: "#",
    },
    {
      icon: IconChartLine,
      title: "Analytics",
      url: "#",
    },
  ],
  navSecondary: [
    {
      icon: IconSettings,
      title: "Settings",
      url: "#",
    },
    {
      icon: IconHelp,
      title: "Get Help",
      url: "#",
    },
    {
      icon: IconSearch,
      title: "Search",
      url: "#",
    },
  ],
  user: {
    avatar: "/avatars/shadcn.jpg",
    email: "content@agency.com",
    name: "Content Creator",
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
              <Link to="/">
                <IconPencil className="!size-5" />
                <span className="text-base font-semibold">Contentagen</span>
              </Link>
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
