/**
 * Lexical Markdown Transformers
 *
 * Extended transformers for markdown conversion including custom nodes.
 */
import {
   CHECK_LIST,
   CODE,
   HEADING,
   LINK,
   ORDERED_LIST,
   QUOTE,
   type TextMatchTransformer,
   TRANSFORMERS,
   type Transformer,
   UNORDERED_LIST,
} from "@lexical/markdown";
import { $createTextNode, $isTextNode, type LexicalNode } from "lexical";
import { $createImageNode, $isImageNode, type ImageNode } from "./image-node";

/**
 * Image transformer for markdown syntax: ![alt](url)
 */
export const IMAGE_TRANSFORMER: TextMatchTransformer = {
   type: "text-match",
   dependencies: [],
   export: (node: LexicalNode) => {
      if (!$isImageNode(node)) {
         return null;
      }
      const imageNode = node as ImageNode;
      const alt = imageNode.getAlt();
      const src = imageNode.getSrc();
      const caption = imageNode.getCaption();

      // Format: ![alt](url)
      // If caption exists, add it as italic text below
      let markdown = `![${alt}](${src})`;
      if (caption) {
         markdown += `\n*${caption}*`;
      }
      return markdown;
   },
   importRegExp: /!\[([^\]]*)\]\(([^)]+)\)/,
   regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
   replace: (textNode, match) => {
      const [, alt, src] = match;
      if (!alt || !src) return;
      const imageNode = $createImageNode(src, alt);
      textNode.replace(imageNode);
   },
   trigger: ")",
};

/**
 * Strikethrough transformer: ~~text~~
 */
export const STRIKETHROUGH_TRANSFORMER: TextMatchTransformer = {
   type: "text-match",
   dependencies: [],
   export: (node: LexicalNode) => {
      if (!$isTextNode(node)) {
         return null;
      }
      if (node.hasFormat("strikethrough")) {
         return `~~${node.getTextContent()}~~`;
      }
      return null;
   },
   importRegExp: /~~([^~]+)~~/,
   regExp: /~~([^~]+)~~$/,
   replace: (textNode, match) => {
      const [, text] = match;
      if (!text) return;
      const newNode = $createTextNode(text);
      newNode.setFormat("strikethrough");
      textNode.replace(newNode);
   },
   trigger: "~",
};

/**
 * Highlight transformer: ==text==
 */
export const HIGHLIGHT_TRANSFORMER: TextMatchTransformer = {
   type: "text-match",
   dependencies: [],
   export: (node: LexicalNode) => {
      if (!$isTextNode(node)) {
         return null;
      }
      if (node.hasFormat("highlight")) {
         return `==${node.getTextContent()}==`;
      }
      return null;
   },
   importRegExp: /==([^=]+)==/,
   regExp: /==([^=]+)==$/,
   replace: (textNode, match) => {
      const [, text] = match;
      if (!text) return;
      const newNode = $createTextNode(text);
      newNode.setFormat("highlight");
      textNode.replace(newNode);
   },
   trigger: "=",
};

/**
 * Subscript transformer: ~text~
 */
export const SUBSCRIPT_TRANSFORMER: TextMatchTransformer = {
   type: "text-match",
   dependencies: [],
   export: (node: LexicalNode) => {
      if (!$isTextNode(node)) {
         return null;
      }
      if (node.hasFormat("subscript")) {
         return `~${node.getTextContent()}~`;
      }
      return null;
   },
   importRegExp: /~([^~]+)~/,
   regExp: /~([^~]+)~$/,
   replace: (textNode, match) => {
      const [, text] = match;
      if (!text) return;
      const newNode = $createTextNode(text);
      newNode.setFormat("subscript");
      textNode.replace(newNode);
   },
   trigger: "~",
};

/**
 * Superscript transformer: ^text^
 */
export const SUPERSCRIPT_TRANSFORMER: TextMatchTransformer = {
   type: "text-match",
   dependencies: [],
   export: (node: LexicalNode) => {
      if (!$isTextNode(node)) {
         return null;
      }
      if (node.hasFormat("superscript")) {
         return `^${node.getTextContent()}^`;
      }
      return null;
   },
   importRegExp: /\^([^^]+)\^/,
   regExp: /\^([^^]+)\^$/,
   replace: (textNode, match) => {
      const [, text] = match;
      if (!text) return;
      const newNode = $createTextNode(text);
      newNode.setFormat("superscript");
      textNode.replace(newNode);
   },
   trigger: "^",
};

/**
 * Extended transformers including all custom nodes
 */
export const EXTENDED_TRANSFORMERS: Array<Transformer> = [
   // Block transformers
   HEADING,
   QUOTE,
   CODE,
   UNORDERED_LIST,
   ORDERED_LIST,
   CHECK_LIST,

   // Inline transformers
   LINK,

   // Custom transformers
   IMAGE_TRANSFORMER,
   STRIKETHROUGH_TRANSFORMER,
   HIGHLIGHT_TRANSFORMER,

   // Include base transformers
   ...TRANSFORMERS,
];

/**
 * Basic transformers (no custom nodes)
 */
export const BASIC_TRANSFORMERS: Array<Transformer> = [...TRANSFORMERS];

/**
 * Generate a slug from a title (non-AI, simple transformation)
 */
export function generateSlug(title: string): string {
   return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
}
