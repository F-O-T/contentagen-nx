import { Button } from "@packages/ui/components/button";
import {
   Sheet,
   SheetContent,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";

export const NavigationSheet = () => {
   return (
      <Sheet>
         <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
               <Menu />
            </Button>
         </SheetTrigger>
         <SheetContent className="px-6 py-3">
            <div className="flex items-center gap-3 mb-6">
               <Logo />
               <span className="text-xl font-bold text-foreground">
                  ContentaGen
               </span>
            </div>
            <NavMenu orientation="vertical" className="mt-6 [&>ul]:h-full" />
         </SheetContent>
      </Sheet>
   );
};
