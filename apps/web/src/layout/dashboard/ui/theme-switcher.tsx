import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useTheme } from "@packages/ui/lib/theme-provider";
import { cn } from "@packages/ui/lib/utils";
import { ClientOnly } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useCallback } from "react";

export type ThemeSwitcherProps = {
   className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
   const themes = [
      {
         icon: Monitor,
         key: "system",
         label: "Tema do sistema",
      },
      {
         icon: Sun,
         key: "light",
         label: "Tema claro",
      },
      {
         icon: Moon,
         key: "dark",
         label: "Tema escuro",
      },
   ];

   const { theme, setTheme } = useTheme();

   const handleThemeClick = useCallback(
      (themeKey: "light" | "dark" | "system") => {
         if (!themeKey || themeKey.trim() === "") {
            themeKey = "system";
         }
         setTheme(themeKey);
      },
      [setTheme],
   );

   return (
      <ClientOnly fallback={null}>
         <TooltipProvider>
            <div
               className={cn(
                  "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
                  className,
               )}
            >
               {themes.map(({ key, icon: Icon, label }) => {
                  const isActive = theme === key;

                  return (
                     <Tooltip key={key}>
                        <TooltipTrigger asChild>
                           <button
                              aria-label={label}
                              className="relative h-6 w-6 rounded-full"
                              onClick={() =>
                                 handleThemeClick(
                                    key as "light" | "dark" | "system",
                                 )
                              }
                              type="button"
                           >
                              {isActive && (
                                 <motion.div
                                    className="absolute inset-0 rounded-full bg-muted"
                                    layoutId="activeTheme"
                                    transition={{
                                       duration: 0.5,
                                       type: "spring",
                                    }}
                                 />
                              )}
                              <Icon
                                 className={cn(
                                    "relative z-10 m-auto h-4 w-4",
                                    isActive
                                       ? "text-foreground"
                                       : "text-muted-foreground",
                                 )}
                              />
                           </button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                     </Tooltip>
                  );
               })}
            </div>
         </TooltipProvider>
      </ClientOnly>
   );
};
