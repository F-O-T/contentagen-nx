import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { createContext, useContext, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
   children: React.ReactNode;
   defaultTheme?: Theme;
   storageKey?: string;
};

type ThemeProviderState = {
   theme: Theme;
   setTheme: (_theme: Theme) => void;
};

export type { Theme, ThemeProviderProps, ThemeProviderState };
const initialState: ThemeProviderState = {
   theme: "system",
   setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function ThemeProvider({
   children,
   defaultTheme = "light",
   storageKey = "nx-contenta-gen-theme",
   ...props
}: ThemeProviderProps) {
   const [theme, setTheme] = useState<Theme>("light");

   useIsomorphicLayoutEffect(() => {
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");

      if (theme === "system") {
         const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
         localStorage.setItem(storageKey, systemTheme);
         setTheme(systemTheme);
         root.classList.add(systemTheme);
         return;
      }

      root.classList.add(theme);
   }, [theme]);

   const value = {
      theme,
      setTheme: (theme: Theme) => {
         localStorage.setItem(storageKey, theme);
         setTheme(theme);
      },
   };

   return (
      <ThemeProviderContext.Provider {...props} value={value}>
         {children}
      </ThemeProviderContext.Provider>
   );
}

const useTheme = () => {
   const context = useContext(ThemeProviderContext);

   if (context === undefined)
      throw new Error("ThemeProvider context not found");
   return context;
};

export { ThemeProvider, ThemeProviderContext, useTheme };
