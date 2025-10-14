import {
   NavigationMenu,
   NavigationMenuContent,
   NavigationMenuItem,
   NavigationMenuLink,
   NavigationMenuList,
   NavigationMenuTrigger,
   navigationMenuTriggerStyle,
} from "@packages/ui/components/navigation-menu";
import { cn } from "@packages/ui/lib/utils";
import type { ComponentProps } from "react";
import { Zap, Users, Workflow, Code } from "lucide-react";
import { translate } from "@packages/localization";
import type { SupportedLng } from "@packages/localization";

interface NavMenuProps extends ComponentProps<"nav"> {
   orientation?: "horizontal" | "vertical";
   lang?: SupportedLng;
}

const productIcons = {
   "#brand-learning": Zap,
   "#competitor-intelligence": Users,
   "#content-workflow": Workflow,
   "#sdk": Code,
};

const getMenuItems = (lang: SupportedLng) => {
   const locale = lang === "en" ? "en-US" : "pt-BR";
   return [
      {
         href: "#pricing",
         name: translate("pages.landing.navigation.pricing", { lng: locale }),
      },
      {
         href: "https://docs.contentagen.com/",
         name: translate("pages.landing.navigation.docs", { lng: locale }),
      },
      {
         href: "https://blog.contentagen.com/",
         name: translate("pages.landing.navigation.blog", { lng: locale }),
      },
   ];
};

const getProductItems = (lang: SupportedLng) => {
   const locale = lang === "en" ? "en-US" : "pt-BR";
   return [
      {
         href: "#brand-learning",
         name: translate(
            "pages.landing.navigation.productItems.brandLearning.name",
            { lng: locale },
         ),
         description: translate(
            "pages.landing.navigation.productItems.brandLearning.description",
            { lng: locale },
         ),
      },
      {
         href: "#competitor-intelligence",
         name: translate(
            "pages.landing.navigation.productItems.competitorIntelligence.name",
            { lng: locale },
         ),
         description: translate(
            "pages.landing.navigation.productItems.competitorIntelligence.description",
            { lng: locale },
         ),
      },
      {
         href: "#content-workflow",
         name: translate(
            "pages.landing.navigation.productItems.contentWorkflow.name",
            { lng: locale },
         ),
         description: translate(
            "pages.landing.navigation.productItems.contentWorkflow.description",
            { lng: locale },
         ),
      },
      {
         href: "#sdk",
         name: translate(
            "pages.landing.navigation.productItems.developerSDK.name",
            { lng: locale },
         ),
         description: translate(
            "pages.landing.navigation.productItems.developerSDK.description",
            { lng: locale },
         ),
      },
   ];
};

export const NavMenu = ({
   orientation = "horizontal",
   className = "",
   lang = "en",
   ...props
}: NavMenuProps) => {
   const locale = lang === "en" ? "en-US" : "pt-BR";
   const menuItems = getMenuItems(lang);
   const productItems = getProductItems(lang);

   return (
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
                  {translate("pages.landing.navigation.product", {
                     lng: locale,
                  })}
               </NavigationMenuTrigger>
               <NavigationMenuContent className="grid gap-3 p-4">
                  <div className="grid gap-2 p-2 grid-cols-2 w-96">
                     {productItems.map((item) => {
                        const Icon =
                           productIcons[item.href as keyof typeof productIcons];
                        return (
                           <NavigationMenuLink key={item.href} asChild>
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

            {menuItems.map((item) => (
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
};
