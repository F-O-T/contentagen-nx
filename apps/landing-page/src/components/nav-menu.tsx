import {
   NavigationMenu,
   NavigationMenuContent,
   NavigationMenuItem,
   NavigationMenuLink,
   NavigationMenuList,
   NavigationMenuTrigger,
   navigationMenuTriggerStyle,
} from "@packages/ui/components/navigation-menu";
import { menuItems, productItems } from "../data/menu-items";
import { cn } from "@packages/ui/lib/utils";
import type { ComponentProps } from "react";
import { Zap, Users, Workflow, Code } from "lucide-react";

interface NavMenuProps extends ComponentProps<"nav"> {
   orientation?: "horizontal" | "vertical";
}

const productIcons = {
   "Brand Learning": Zap,
   "Competitor Intelligence": Users,
   "Content Workflow": Workflow,
   "Developer SDK": Code,
};

export const NavMenu = ({
   orientation = "horizontal",
   className = "",
   ...props
}: NavMenuProps) => (
   <NavigationMenu
      className={orientation === "vertical" ? "flex-col items-start" : ""}
   >
      <NavigationMenuList
         className={cn(
            orientation === "vertical"
               ? "flex-col items-start justify-start space-x-0 space-y-2"
               : "gap-2",
         )}
      >
         <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
               Product
            </NavigationMenuTrigger>
            <NavigationMenuContent className="grid gap-3 p-4">
               <div className="grid gap-2 p-2 grid-cols-2 w-96">
                  {productItems.map((item) => {
                     const Icon =
                        productIcons[item.name as keyof typeof productIcons];
                     return (
                        <NavigationMenuLink key={item.name} asChild>
                           <a
                              href={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                           >
                              <div className="flex items-center gap-2">
                                 {Icon && <Icon className="size-4" />}
                                 <div className="text-sm font-medium leading-none">
                                    {item.name}
                                 </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                 {item.description}
                              </p>
                           </a>
                        </NavigationMenuLink>
                     );
                  })}
               </div>
            </NavigationMenuContent>
         </NavigationMenuItem>

         {menuItems
            .filter((item) => !item.name.includes("Features"))
            .map((item) => (
               <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                     className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent",
                        orientation === "vertical" && "justify-start w-full",
                     )}
                     asChild
                  >
                     <a href={item.href}>{item.name}</a>
                  </NavigationMenuLink>
               </NavigationMenuItem>
            ))}
      </NavigationMenuList>
   </NavigationMenu>
);
