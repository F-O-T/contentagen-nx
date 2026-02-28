/**
 * EditorContentStore — module-level singleton that bridges the teco-chat tool
 * tree and the Plate editor tree.
 *
 * Because the WriteContentToolUI component lives in the teco-chat component
 * tree and the Plate editor lives in the editor-page tree, they cannot share
 * React context. This singleton acts as a lightweight callback registry so the
 * tool component can apply markdown to the editor without prop-drilling or
 * shared context.
 *
 * Usage:
 *   - Editor page calls `editorContentStore.register(fn)` on mount.
 *   - Editor page calls `editorContentStore.unregister()` on unmount.
 *   - Tool UI calls `editorContentStore.applyMarkdown(markdown)` to delegate
 *     to the registered callback (no-op if none is registered).
 */

class EditorContentStore {
   private callback: ((markdown: string) => void) | null = null;

   /** Register the editor's apply-markdown callback. Called on editor mount. */
   register(fn: (markdown: string) => void): void {
      if (process.env.NODE_ENV === "development" && this.callback !== null) {
         console.warn("[EditorContentStore] Overwriting an existing registration. Did you forget to call unregister()?");
      }
      this.callback = fn;
   }

   /** Unregister the callback. Called on editor unmount. */
   unregister(): void {
      this.callback = null;
   }

   /**
    * Unregister the callback only if the provided fn is the currently registered
    * one. Prevents React StrictMode double-invoke or fast navigation races from
    * silently clearing a newer registration.
    */
   unregisterIfOwner(fn: (markdown: string) => void): void {
      if (this.callback === fn) {
         this.callback = null;
      }
   }

   /**
    * Apply markdown to the registered editor.
    * No-op if no editor is currently mounted.
    */
   applyMarkdown(markdown: string): void {
      this.callback?.(markdown);
   }
}

export const editorContentStore = new EditorContentStore();
