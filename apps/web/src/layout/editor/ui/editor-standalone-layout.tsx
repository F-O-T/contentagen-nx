/**
 * Layout standalone para o editor IDE.
 * Container principal sem sidebar do dashboard.
 * Gerencia keybinds globais sem conflitos com o browser.
 */
// Must be imported eagerly before the lazy editor chunk loads.
// @lexical/code's prism language plugins reference `Prism` as a global variable.
// This ensures window.Prism is set before ClientOnly evaluates those plugins.
// See: https://github.com/facebook/lexical/issues/6575
import "prismjs";

import type { ReactNode } from "react";

interface EditorStandaloneLayoutProps {
   children: ReactNode;
}

export function EditorStandaloneLayout({
   children,
}: EditorStandaloneLayoutProps) {
   return (
      <div className="h-screen w-screen overflow-hidden bg-background">
         {children}
      </div>
   );
}
