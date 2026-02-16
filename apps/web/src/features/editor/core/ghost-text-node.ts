/**
 * GhostTextNode - Custom Lexical TextNode for FIM suggestions
 *
 * Displays inline ghost text for AI completion suggestions.
 * Key features:
 * - Renders inline (not absolutely positioned)
 * - Cannot be edited directly (mode: "token")
 * - Excluded from copy operations
 * - Styled with reduced opacity as ghost text
 * - UUID tracking to prevent stale suggestions
 */
import {
   type DOMExportOutput,
   type EditorConfig,
   type LexicalEditor,
   type LexicalNode,
   type NodeKey,
   type SerializedTextNode,
   TextNode,
} from "lexical";

export type SerializedGhostTextNode = SerializedTextNode & {
   uuid: string;
};

export class GhostTextNode extends TextNode {
   __uuid: string;

   static getType(): string {
      return "ghost-text";
   }

   static clone(node: GhostTextNode): GhostTextNode {
      const cloned = new GhostTextNode(node.__text, node.__uuid, node.__key);
      return cloned;
   }

   constructor(text: string, uuid: string, key?: NodeKey) {
      super(text, key);
      this.__uuid = uuid;
      // Note: Don't call setMode() here - it causes infinite recursion
      // Mode will be set via $createGhostTextNode after construction
   }

   getUUID(): string {
      return this.__uuid;
   }

   createDOM(config: EditorConfig): HTMLElement {
      const dom = super.createDOM(config);
      dom.classList.add("ghost-text");
      dom.style.opacity = "0.5";
      dom.style.color = "var(--muted-foreground)";
      dom.style.pointerEvents = "none";
      dom.style.userSelect = "none";
      // Prevent editing
      dom.contentEditable = "false";
      return dom;
   }

   updateDOM(
      _prevNode: GhostTextNode,
      dom: HTMLElement,
      _config: EditorConfig,
   ): boolean {
      // Re-apply critical styles that may be lost during reconciliation
      dom.style.opacity = "0.5";
      dom.style.color = "var(--muted-foreground)";
      dom.style.pointerEvents = "none";
      dom.style.userSelect = "none";
      dom.contentEditable = "false";
      return false;
   }

   // Prevent copying ghost text
   excludeFromCopy(): boolean {
      return true;
   }

   // Prevent exporting ghost text to HTML (returns empty span)
   exportDOM(_editor: LexicalEditor): DOMExportOutput {
      const element = document.createElement("span");
      return { element };
   }

   static importJSON(serializedNode: SerializedGhostTextNode): GhostTextNode {
      const node = new GhostTextNode(serializedNode.text, serializedNode.uuid);
      node.setMode("token");
      return node;
   }

   exportJSON(): SerializedGhostTextNode {
      return {
         ...super.exportJSON(),
         type: "ghost-text",
         uuid: this.__uuid,
      };
   }

   // Prevent splitting this node
   canInsertTextBefore(): boolean {
      return false;
   }

   canInsertTextAfter(): boolean {
      return false;
   }

   /**
    * Mark node as inert to prevent editing/selection
    */
   isInert(): boolean {
      return true;
   }
}

/**
 * Create a new GhostTextNode with the given text and optional UUID.
 * Sets token mode after construction to avoid infinite recursion.
 */
export function $createGhostTextNode(
   text: string,
   uuid?: string,
): GhostTextNode {
   const node = new GhostTextNode(text, uuid ?? crypto.randomUUID());
   // Set mode AFTER construction - this is safe because setMode only recurses
   // when called during clone, which happens when the node is in the editor
   node.setMode("token");
   return node;
}

/**
 * Type guard to check if a node is a GhostTextNode.
 * Uses getType() instead of instanceof to avoid module bundling issues.
 */
export function $isGhostTextNode(
   node: LexicalNode | null | undefined,
): node is GhostTextNode {
   return node?.getType() === "ghost-text";
}

/**
 * Find all ghost text nodes in the editor
 */
export function $getGhostTextNodes(root: LexicalNode): GhostTextNode[] {
   const nodes: GhostTextNode[] = [];

   const traverse = (node: LexicalNode) => {
      if ($isGhostTextNode(node)) {
         nodes.push(node);
      }
      if ("getChildren" in node && typeof node.getChildren === "function") {
         const children = node.getChildren() as LexicalNode[];
         for (const child of children) {
            traverse(child);
         }
      }
   };

   traverse(root);
   return nodes;
}

/**
 * Remove all ghost text nodes from the editor
 */
export function $removeAllGhostTextNodes(root: LexicalNode): void {
   const ghostNodes = $getGhostTextNodes(root);
   for (const node of ghostNodes) {
      node.remove();
   }
}

/**
 * Remove ghost text nodes with a specific UUID
 */
export function $removeGhostTextByUUID(root: LexicalNode, uuid: string): void {
   const ghostNodes = $getGhostTextNodes(root);
   for (const node of ghostNodes) {
      if (node.getUUID() === uuid) {
         node.remove();
      }
   }
}
