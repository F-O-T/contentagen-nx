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
   <nav {...props} className={cn("", className)}>
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
               <NavigationMenuContent>
                  <div className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                     <div className="row-span-3">
                        <NavigationMenuLink asChild>
                           <a
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/"
                           >
                              <div className="mb-2 mt-4 text-lg font-medium">
                                 ContentaGen
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                 AI content that actually sounds like your
                                 brand. Learn, analyze, create.
                              </p>
                           </a>
                        </NavigationMenuLink>
                     </div>
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
   </nav>
);
