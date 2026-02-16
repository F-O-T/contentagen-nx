/**
 * Manual save hook for IDE-style content editor
 *
 * Handles:
 * - Cmd+S keyboard shortcut
 * - Auto-save with debounce (2s after last change)
 * - Dirty state tracking
 * - Unsaved changes warning on navigation/close
 * - Save mutation integration
 */

import type { ContentMeta } from "@packages/database/schemas/content";
import { useBlocker } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { markSaved, setDirty, useIsDirty } from "./use-editor-state";

interface UseManualSaveOptions {
   contentId: string;
   onSave: (data: {
      body?: string;
      meta?: Partial<ContentMeta>;
   }) => Promise<void>;
   isArchived?: boolean;
   /**
    * Enable auto-save with debounce (default: true)
    */
   autoSave?: boolean;
   /**
    * Auto-save debounce delay in ms (default: 2000)
    */
   autoSaveDelay?: number;
}

interface UseManualSaveReturn {
   isDirty: boolean;
   markDirty: () => void;
   save: () => Promise<void>;
   saveBody: (body: string) => void;
   saveMeta: (meta: Partial<ContentMeta>) => void;
}

export function useManualSave({
   contentId,
   onSave,
   isArchived = false,
   autoSave = true,
   autoSaveDelay = 2000,
}: UseManualSaveOptions): UseManualSaveReturn {
   const isDirty = useIsDirty();

   // Track pending changes
   const pendingBodyRef = useRef<string | null>(null);
   const pendingMetaRef = useRef<Partial<ContentMeta> | null>(null);
   const isSavingRef = useRef(false);
   const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

   // Mark content as dirty
   const markDirty = useCallback(() => {
      if (!isArchived) {
         setDirty(true);
      }
   }, [isArchived]);

   // Queue body change for save
   const saveBody = useCallback(
      (body: string) => {
         pendingBodyRef.current = body;
         markDirty();

         // Auto-save with debounce
         if (autoSave && !isArchived) {
            if (autoSaveTimerRef.current) {
               clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
               save();
            }, autoSaveDelay);
         }
      },
      [markDirty, autoSave, isArchived, autoSaveDelay],
   );

   // Queue meta change for save
   const saveMeta = useCallback(
      (meta: Partial<ContentMeta>) => {
         pendingMetaRef.current = { ...pendingMetaRef.current, ...meta };
         markDirty();

         // Auto-save meta changes immediately (they're less frequent)
         if (autoSave && !isArchived) {
            if (autoSaveTimerRef.current) {
               clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
               save();
            }, 500); // Shorter delay for meta changes
         }
      },
      [markDirty, autoSave, isArchived],
   );

   // Perform save
   const save = useCallback(async () => {
      if (isSavingRef.current || isArchived) return;
      if (!pendingBodyRef.current && !pendingMetaRef.current) return;

      isSavingRef.current = true;

      // Clear any pending auto-save timer
      if (autoSaveTimerRef.current) {
         clearTimeout(autoSaveTimerRef.current);
         autoSaveTimerRef.current = null;
      }

      try {
         const data: { body?: string; meta?: Partial<ContentMeta> } = {};

         if (pendingBodyRef.current !== null) {
            data.body = pendingBodyRef.current;
         }

         if (pendingMetaRef.current !== null) {
            data.meta = pendingMetaRef.current;
         }

         await onSave(data);

         // Clear pending changes after successful save
         pendingBodyRef.current = null;
         pendingMetaRef.current = null;
         markSaved();
      } catch (error) {
         console.error("[useManualSave] Save failed:", error);
         // Keep dirty state on error
      } finally {
         isSavingRef.current = false;
      }
   }, [onSave, isArchived]);

   // Keyboard shortcut (Cmd+S / Ctrl+S)
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            save();
         }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
   }, [save]);

   // Browser beforeunload warning
   useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         if (isDirty) {
            e.preventDefault();
            e.returnValue = "";
            return "";
         }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
         window.removeEventListener("beforeunload", handleBeforeUnload);
   }, [isDirty]);

   // TanStack Router navigation blocker
   useBlocker({
      condition: isDirty,
      blockerFn: () => {
         return window.confirm(
            "Voce tem alteracoes nao salvas. Deseja sair sem salvar?",
         );
      },
   });

   // Reset dirty state when contentId changes
   useEffect(() => {
      // Clear any pending auto-save timer
      if (autoSaveTimerRef.current) {
         clearTimeout(autoSaveTimerRef.current);
         autoSaveTimerRef.current = null;
      }

      pendingBodyRef.current = null;
      pendingMetaRef.current = null;
      setDirty(false);
   }, [contentId]);

   // Cleanup auto-save timer on unmount
   useEffect(() => {
      return () => {
         if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
         }
      };
   }, []);

   return {
      isDirty,
      markDirty,
      save,
      saveBody,
      saveMeta,
   };
}
