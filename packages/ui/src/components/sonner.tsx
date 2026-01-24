"use client";

import { Toaster as Sonner, type ToasterProps, toast } from "sonner";
import { useTheme } from "../lib/theme-provider";

const Toaster = ({ ...props }: ToasterProps) => {
   const { theme = "system" } = useTheme();

   return (
      <Sonner
         className="toaster group"
         style={
            {
               "--normal-bg": "var(--popover)",
               "--normal-border": "var(--border)",
               "--normal-text": "var(--popover-foreground)",
            } as React.CSSProperties
         }
         theme={theme as ToasterProps["theme"]}
         {...props}
      />
   );
};

export { Toaster, toast };
