import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
   closeAllTabs,
   closeOtherTabs,
   closeTab,
   focusTab,
   pinTab,
   unpinTab,
   useTabStore,
} from "@/hooks/use-tab-store";
import { TabItem } from "./tab-item";

interface TabBarProps {
   onTabFocus: (tabId: string) => void;
   onNewTab: () => void;
   homeRoute: string;
   homeParams: Record<string, string>;
}

export function TabBar({
   onTabFocus,
   onNewTab,
   homeRoute,
   homeParams,
}: TabBarProps) {
   const { tabs, activeTabId } = useTabStore();
   const scrollRef = useRef<HTMLDivElement>(null);
   const [showLeftShadow, setShowLeftShadow] = useState(false);
   const [showRightShadow, setShowRightShadow] = useState(false);

   // ── Scroll shadows ───────────────────────────────────────────────────────

   const updateShadows = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setShowLeftShadow(el.scrollLeft > 0);
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
   }, []);

   useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      updateShadows();
      el.addEventListener("scroll", updateShadows, { passive: true });
      const observer = new ResizeObserver(updateShadows);
      observer.observe(el);
      return () => {
         el.removeEventListener("scroll", updateShadows);
         observer.disconnect();
      };
   }, [updateShadows]);

   // Recalculate shadows when tabs change
   useEffect(() => {
      updateShadows();
   }, [tabs.length, updateShadows]);

   // ── Scroll active tab into view ──────────────────────────────────────────

   useEffect(() => {
      if (!activeTabId || !scrollRef.current) return;
      const activeEl = scrollRef.current.querySelector(
         `[data-tab-id="${activeTabId}"]`,
      );
      if (activeEl) {
         activeEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
         });
      }
   }, [activeTabId]);

   // ── Handlers ─────────────────────────────────────────────────────────────

   const handleFocus = useCallback(
      (tabId: string) => {
         focusTab(tabId);
         onTabFocus(tabId);
      },
      [onTabFocus],
   );

   const handleClose = useCallback(
      (tabId: string) => {
         closeTab(tabId, homeRoute, homeParams);
      },
      [homeRoute, homeParams],
   );

   const handlePin = useCallback((tabId: string) => {
      pinTab(tabId);
   }, []);

   const handleUnpin = useCallback((tabId: string) => {
      unpinTab(tabId);
   }, []);

   const handleCloseOthers = useCallback((keepTabId: string) => {
      closeOtherTabs(keepTabId);
   }, []);

   const handleCloseAll = useCallback(() => {
      closeAllTabs();
   }, []);

   return (
      <div className="relative flex h-9 shrink-0 items-center border-b bg-background/50">
         {/* Left scroll shadow */}
         <div
            className={cn(
               "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background/80 to-transparent transition-opacity",
               showLeftShadow ? "opacity-100" : "opacity-0",
            )}
         />

         {/* Scrollable tab area */}
         <div
            className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none"
            ref={scrollRef}
         >
            {tabs.map((tab) => (
               <div data-tab-id={tab.id} key={tab.id}>
                  <TabItem
                     icon={tab.icon}
                     id={tab.id}
                     isActive={tab.id === activeTabId}
                     isDirty={tab.isDirty}
                     isPinned={tab.isPinned}
                     label={tab.label}
                     onClose={handleClose}
                     onCloseAll={handleCloseAll}
                     onCloseOthers={handleCloseOthers}
                     onFocus={handleFocus}
                     onPin={handlePin}
                     onUnpin={handleUnpin}
                     type={tab.type}
                  />
               </div>
            ))}
         </div>

         {/* Right scroll shadow */}
         <div
            className={cn(
               "pointer-events-none absolute inset-y-0 right-9 z-10 w-6 bg-gradient-to-l from-background/80 to-transparent transition-opacity",
               showRightShadow ? "opacity-100" : "opacity-0",
            )}
         />

         {/* New tab button */}
         <Button
            className="h-8 w-9 shrink-0 rounded-md border-l text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            onClick={onNewTab}
            size="icon"
            title="Nova aba"
            type="button"
            variant="ghost"
         >
            <Plus className="size-3.5" />
         </Button>
      </div>
   );
}
