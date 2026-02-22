import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEventListener } from "@/hooks/use-event-listener";
import {
   closeAllTabs,
   closeOtherTabs,
   focusTab,
   pinTab,
   unpinTab,
   useTabStore,
} from "@/hooks/use-tab-store";
import { TabItem } from "./tab-item";

interface TabBarProps {
   onTabFocus: (tabId: string) => void;
   onTabClose: (tabId: string) => void;
   onNewTab: () => void;
}

export function TabBar({ onTabFocus, onTabClose, onNewTab }: TabBarProps) {
   const { tabs, activeTabId, isHydrated } = useTabStore();
   const scrollRef = useRef<HTMLDivElement>(null);
   const [_showLeftShadow, setShowLeftShadow] = useState(false);
   const [_showRightShadow, setShowRightShadow] = useState(false);

   // ── Scroll shadows ───────────────────────────────────────────────────────

   const updateShadows = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setShowLeftShadow(el.scrollLeft > 0);
      setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
   }, []);

   useEventListener("scroll", updateShadows, scrollRef, { passive: true });

   useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      updateShadows();
      const observer = new ResizeObserver(updateShadows);
      observer.observe(el);
      return () => observer.disconnect();
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
         onTabClose(tabId);
      },
      [onTabClose],
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

   if (!isHydrated) {
      return <div className="h-12 shrink-0 bg-sidebar" />;
   }

   return (
      <div className="flex h-12 shrink-0 items-center bg-sidebar">
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

            {/* New tab button - directly after tabs */}
            <Button
               className="h-9 w-9 ml-1 shrink-0 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
               onClick={onNewTab}
               size="icon"
               title="Nova aba"
               type="button"
               variant="ghost"
            >
               <Plus className="size-4" />
            </Button>
         </div>
      </div>
   );
}
