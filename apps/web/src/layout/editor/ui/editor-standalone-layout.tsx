/**
 * Layout standalone para o editor IDE.
 * Container principal sem sidebar do dashboard.
 * Gerencia keybinds globais sem conflitos com o browser.
 */

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
