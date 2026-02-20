/**
 * Lazy-loaded ContentEditor entry point.
 *
 * ALL @lexical imports (including @lexical/code and prismjs) live in
 * content-editor.tsx. This file is the sole dynamic import target so
 * that neither @lexical/code nor prismjs ever enter the static module
 * graph — and therefore never reach the Nitro SSR bundle.
 *
 * Usage:
 *   import { lazy, Suspense } from "react";
 *   const ContentEditor = lazy(() => import("./content-editor-lazy"));
 */
export { ContentEditor as default } from "./content-editor";
