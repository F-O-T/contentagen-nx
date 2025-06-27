import { useBetterAuthSession } from "@/integrations/better-auth";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
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
import { Link } from "@tanstack/react-router";
import {
   BellIcon,
   CreditCardIcon,
   LogOutIcon,
   MoreVerticalIcon,
   UserCircleIcon,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

// Simple ErrorBoundary implementation
function NavUserErrorFallback() {
   return (
      <div className="p-4 text-center text-destructive">
         Failed to load user info.
      </div>
   );
}

// Skeleton for loading state
function NavUserSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
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

// Extracted content with Suspense logic
function NavUserContent() {
   const { isMobile } = useSidebar();
   const { session, isLoading, error } = useBetterAuthSession();

   if (error) throw error;
   if (isLoading) return <NavUserSkeleton />;

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <Avatar className="h-8 w-8 rounded-lg grayscale">
                        <AvatarImage
                           alt={session?.user.name}
                           src={session?.user.image ?? undefined}
                        />
                        <AvatarFallback className="rounded-lg">
                           CN
                        </AvatarFallback>
                     </Avatar>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                           {session?.user.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                           {session?.user.email}
                        </span>
                     </div>
                     <MoreVerticalIcon className="ml-auto size-4" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="end"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
               >
                  <DropdownMenuLabel className="p-0 font-normal">
                     <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                           <AvatarImage
                              alt={session?.user?.name}
                              src={session?.user?.image ?? undefined}
                           />
                           <AvatarFallback className="rounded-lg">
                              CN
                           </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-medium">
                              {session?.user.name}
                           </span>
                           <span className="truncate text-xs text-muted-foreground">
                              {session?.user.email}
                           </span>
                        </div>
                     </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <Link to="/profile">
                           <UserCircleIcon />
                           Account
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem>
                        <CreditCardIcon />
                        Billing
                     </DropdownMenuItem>
                     <DropdownMenuItem>
                        <BellIcon />
                        Notifications
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                     <LogOutIcon />
                     Log out
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

// Export with Suspense and ErrorBoundary
export function NavUser() {
   return (
      <ErrorBoundary FallbackComponent={NavUserErrorFallback}>
         <Suspense fallback={<NavUserSkeleton />}>
            <NavUserContent />
         </Suspense>
      </ErrorBoundary>
   );
}
