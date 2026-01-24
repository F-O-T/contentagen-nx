/**
 * Centralized editor state management - Nvim-inspired design
 *
 * Manages IDE-style editor state including:
 * - Dirty tracking (unsaved changes)
 * - Diagnostics panel (toggleable bottom panel)
 * - Chat sidebar state (toggleable right sidebar)
 * - Config panel state
 * - Command palette state
 */
import { Store, useStore } from "@tanstack/react-store";

// ============================================================================
// Types
// ============================================================================

export type ActivityPanel = "editor" | "chat" | "config" | "seo";

export interface EditorUserConfig {
   fimEnabled: boolean;
   editEnabled: boolean;
   spellingEnabled: boolean;
   fimDebounceMs: number;
   fimConfidenceThreshold: number;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 250;

interface EditorState {
   // Dirty tracking
   isDirty: boolean;
   lastSavedAt: Date | null;

   // Toggleable panels
   diagnosticsPanelOpen: boolean;
   chatSidebarOpen: boolean;
   chatSidebarWidth: number;
   seoAuditSidebarOpen: boolean;
   seoAuditSidebarWidth: number;

   // Config panel
   configPanelOpen: boolean;
   configPanelWidth: number;

   // Config values
   editorConfig: EditorUserConfig;

   // Command palette
   commandPaletteOpen: boolean;
}

// ============================================================================
// Store
// ============================================================================

const DEFAULT_CONFIG: EditorUserConfig = {
   fimEnabled: true,
   editEnabled: true,
   spellingEnabled: true,
   fimDebounceMs: 500,
   fimConfidenceThreshold: 0.6,
};

const DEFAULT_STATE: EditorState = {
   isDirty: false,
   lastSavedAt: null,
   diagnosticsPanelOpen: false,
   chatSidebarOpen: true,
   chatSidebarWidth: 320,
   seoAuditSidebarOpen: false,
   seoAuditSidebarWidth: 360,
   configPanelOpen: false,
   configPanelWidth: 320,
   editorConfig: DEFAULT_CONFIG,
   commandPaletteOpen: false,
};

const STORAGE_KEY = "contentta.editor-config";

function loadPersistedConfig(): EditorUserConfig {
   if (typeof window === "undefined") {
      return DEFAULT_CONFIG;
   }

   try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_CONFIG;
      const parsed = JSON.parse(stored) as Partial<EditorUserConfig>;
      return {
         ...DEFAULT_CONFIG,
         ...parsed,
      };
   } catch (error) {
      console.warn("[EditorState] Failed to load config", error);
      return DEFAULT_CONFIG;
   }
}

const editorStore = new Store<EditorState>({
   ...DEFAULT_STATE,
   editorConfig: loadPersistedConfig(),
});

// ============================================================================
// Actions
// ============================================================================

// Dirty tracking actions
export function setDirty(isDirty: boolean) {
   editorStore.setState((state) => ({ ...state, isDirty }));
}

export function markSaved() {
   editorStore.setState((state) => ({
      ...state,
      isDirty: false,
      lastSavedAt: new Date(),
   }));
}

// Diagnostics panel actions
export function toggleDiagnosticsPanel() {
   editorStore.setState((state) => ({
      ...state,
      diagnosticsPanelOpen: !state.diagnosticsPanelOpen,
   }));
}

export function setDiagnosticsPanelOpen(open: boolean) {
   editorStore.setState((state) => ({ ...state, diagnosticsPanelOpen: open }));
}

// Chat sidebar actions
export function toggleChatSidebar() {
   editorStore.setState((state) => ({
      ...state,
      chatSidebarOpen: !state.chatSidebarOpen,
   }));
}

export function setChatSidebarOpen(open: boolean) {
   editorStore.setState((state) => ({ ...state, chatSidebarOpen: open }));
}

export function setChatSidebarWidth(width: number) {
   editorStore.setState((state) => ({
      ...state,
      chatSidebarWidth: Math.max(280, Math.min(width, 600)),
   }));
}

// SEO audit sidebar actions
export function toggleSeoAuditSidebar() {
   editorStore.setState((state) => ({
      ...state,
      seoAuditSidebarOpen: !state.seoAuditSidebarOpen,
   }));
}

export function setSeoAuditSidebarOpen(open: boolean) {
   editorStore.setState((state) => ({ ...state, seoAuditSidebarOpen: open }));
}

export function setSeoAuditSidebarWidth(width: number) {
   editorStore.setState((state) => ({
      ...state,
      seoAuditSidebarWidth: Math.max(300, Math.min(width, 680)),
   }));
}

// Config panel actions
export function toggleConfigPanel() {
   editorStore.setState((state) => ({
      ...state,
      configPanelOpen: !state.configPanelOpen,
   }));
}

export function setConfigPanelOpen(open: boolean) {
   editorStore.setState((state) => ({ ...state, configPanelOpen: open }));
}

export function setConfigPanelWidth(width: number) {
   editorStore.setState((state) => ({
      ...state,
      configPanelWidth: Math.max(300, Math.min(width, 520)),
   }));
}

export function setEditorConfig(update: Partial<EditorUserConfig>) {
   editorStore.setState((state) => ({
      ...state,
      editorConfig: {
         ...state.editorConfig,
         ...update,
      },
   }));

   if (typeof window === "undefined") return;

   if (persistTimer) {
      clearTimeout(persistTimer);
   }

   persistTimer = setTimeout(() => {
      persistEditorConfig();
      persistTimer = null;
   }, PERSIST_DEBOUNCE_MS);
}

// Command palette actions
export function toggleCommandPalette() {
   editorStore.setState((state) => ({
      ...state,
      commandPaletteOpen: !state.commandPaletteOpen,
   }));
}

export function setCommandPaletteOpen(open: boolean) {
   editorStore.setState((state) => ({ ...state, commandPaletteOpen: open }));
}

export function resetEditorState() {
   editorStore.setState((state) => ({
      ...DEFAULT_STATE,
      editorConfig: state.editorConfig,
   }));
}

// ============================================================================
// Hooks
// ============================================================================

export function useEditorState() {
   return useStore(editorStore);
}

export function useIsDirty() {
   return useStore(editorStore, (state) => state.isDirty);
}

export function useDiagnosticsPanel() {
   return useStore(editorStore, (state) => state.diagnosticsPanelOpen);
}

export function useChatSidebar() {
   return useStore(editorStore, (state) => ({
      open: state.chatSidebarOpen,
      width: state.chatSidebarWidth,
   }));
}

export function useSeoAuditSidebar() {
   return useStore(editorStore, (state) => ({
      open: state.seoAuditSidebarOpen,
      width: state.seoAuditSidebarWidth,
   }));
}

export function useConfigPanel() {
   return useStore(editorStore, (state) => state.configPanelOpen);
}

export function useConfigPanelWidth() {
   return useStore(editorStore, (state) => state.configPanelWidth);
}

export function useEditorConfig() {
   return useStore(editorStore, (state) => state.editorConfig);
}

export function useCommandPalette() {
   return useStore(editorStore, (state) => state.commandPaletteOpen);
}

export function persistEditorConfig() {
   if (typeof window === "undefined") return;

   try {
      const config = editorStore.state.editorConfig;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
   } catch (error) {
      console.warn("[EditorState] Failed to persist config", error);
   }
}
