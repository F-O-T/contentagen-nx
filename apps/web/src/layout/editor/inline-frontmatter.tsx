/**
 * YAML-style frontmatter block for inline editing.
 * Styled like code (monospace, muted colors).
 * Changes mark document as dirty (unsaved).
 *
 * Campos:
 * - titulo
 * - descricao
 * - slug
 * - palavras_chave (array de tags)
 */

import type { ContentMeta } from "@packages/database/schemas/content";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { ChevronDown, ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import {
   type KeyboardEvent,
   useCallback,
   useEffect,
   useMemo,
   useState,
} from "react";

interface InlineFrontmatterProps {
   meta?: ContentMeta | null;
   onUpdate: (meta: Partial<ContentMeta>) => void;
   className?: string;
}

// Character count limits for SEO description
const DESCRIPTION_MIN_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 160;

/**
 * Generates a URL-safe slug from a title
 */
function generateSlug(title: string): string {
   return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

export function InlineFrontmatter({
   meta,
   onUpdate,
   className,
}: InlineFrontmatterProps) {
   const [isCollapsed, setIsCollapsed] = useState(false);
   const [localTitle, setLocalTitle] = useState(meta?.title || "");
   const [localSlug, setLocalSlug] = useState(meta?.slug || "");
   const [localDescription, setLocalDescription] = useState(
      meta?.description || "",
   );
   const [localKeywords, setLocalKeywords] = useState<string[]>(
      meta?.keywords || [],
   );
   const [keywordInput, setKeywordInput] = useState("");
   const [autoSlug, setAutoSlug] = useState(!meta?.slug);

   // Sync local state with props when meta changes externally
   useEffect(() => {
      console.log("[InlineFrontmatter] Meta updated:", meta);
      setLocalTitle(meta?.title || "");
      setLocalSlug(meta?.slug || "");
      setLocalDescription(meta?.description || "");
      // Handle keywords separately to avoid unnecessary re-renders
      const newKeywords = meta?.keywords || [];
      setLocalKeywords((prev) => {
         // Only update if keywords actually changed
         if (prev.length !== newKeywords.length) return newKeywords;
         if (prev.some((k, i) => k !== newKeywords[i])) return newKeywords;
         return prev;
      });
   }, [meta?.title, meta?.slug, meta?.description, meta?.keywords]);

   // Character count for description (memoized)
   const descriptionLength = localDescription.length;
   const descriptionStatus = useMemo(():
      | "muted"
      | "amber"
      | "green"
      | "red" => {
      if (descriptionLength === 0) return "muted";
      if (descriptionLength < DESCRIPTION_MIN_LENGTH) return "amber";
      if (descriptionLength <= DESCRIPTION_MAX_LENGTH) return "green";
      return "red";
   }, [descriptionLength]);

   // Handle title change
   const handleTitleChange = useCallback(
      (value: string) => {
         setLocalTitle(value);
         if (autoSlug) {
            const newSlug = generateSlug(value);
            setLocalSlug(newSlug);
            onUpdate({ title: value, slug: newSlug });
         } else {
            onUpdate({ title: value });
         }
      },
      [autoSlug, onUpdate],
   );

   // Handle slug change
   const handleSlugChange = useCallback(
      (value: string) => {
         setLocalSlug(value);
         setAutoSlug(false);
         onUpdate({ slug: value });
      },
      [onUpdate],
   );

   // Handle description change
   const handleDescriptionChange = useCallback(
      (value: string) => {
         setLocalDescription(value);
         onUpdate({ description: value });
      },
      [onUpdate],
   );

   // Regenerate slug from title
   const handleRegenerateSlug = useCallback(() => {
      const newSlug = generateSlug(localTitle);
      setLocalSlug(newSlug);
      setAutoSlug(true);
      onUpdate({ slug: newSlug });
   }, [localTitle, onUpdate]);

   // Handle keyword add
   const handleAddKeyword = useCallback(() => {
      const keyword = keywordInput.trim().toLowerCase();
      if (keyword && !localKeywords.includes(keyword)) {
         const newKeywords = [...localKeywords, keyword];
         setLocalKeywords(newKeywords);
         setKeywordInput("");
         onUpdate({ keywords: newKeywords });
      }
   }, [keywordInput, localKeywords, onUpdate]);

   // Handle keyword remove
   const handleRemoveKeyword = useCallback(
      (keyword: string) => {
         const newKeywords = localKeywords.filter((k) => k !== keyword);
         setLocalKeywords(newKeywords);
         onUpdate({ keywords: newKeywords });
      },
      [localKeywords, onUpdate],
   );

   // Handle keyword input key down
   const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
         e.preventDefault();
         handleAddKeyword();
      }
      if (
         e.key === "Backspace" &&
         keywordInput === "" &&
         localKeywords.length > 0
      ) {
         handleRemoveKeyword(localKeywords[localKeywords.length - 1]);
      }
   };

   return (
      <div className={cn("border-b font-mono text-sm", className)}>
         {/* Collapse toggle */}
         <button
            className="flex items-center gap-1 w-full px-4 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="button"
         >
            {isCollapsed ? (
               <ChevronRight className="size-3.5" />
            ) : (
               <ChevronDown className="size-3.5" />
            )}
            <span className="text-xs">frontmatter</span>
         </button>

         {!isCollapsed && (
            <div className="px-4 pb-4 space-y-0.5">
               {/* Opening delimiter */}
               <div className="text-muted-foreground select-none">---</div>

               {/* Title field */}
               <FrontmatterField
                  label="titulo"
                  onChange={handleTitleChange}
                  placeholder="Titulo do conteudo"
                  value={localTitle}
               />

               {/* Description field */}
               <FrontmatterField
                  label="descricao"
                  onChange={handleDescriptionChange}
                  placeholder="Descricao para mecanismos de busca"
                  suffix={
                     <span
                        className={cn(
                           "text-[10px] tabular-nums",
                           descriptionStatus === "muted" &&
                              "text-muted-foreground",
                           descriptionStatus === "amber" && "text-amber-500",
                           descriptionStatus === "green" && "text-green-500",
                           descriptionStatus === "red" && "text-red-500",
                        )}
                     >
                        {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
                     </span>
                  }
                  value={localDescription}
               />

               {/* Slug field */}
               <FrontmatterField
                  label="slug"
                  onChange={handleSlugChange}
                  placeholder="url-do-conteudo"
                  suffix={
                     <Button
                        className="size-5"
                        onClick={handleRegenerateSlug}
                        size="icon"
                        title="Regenerar slug do titulo"
                        type="button"
                        variant="ghost"
                     >
                        <RefreshCw className="size-3" />
                     </Button>
                  }
                  value={localSlug}
               />

               {/* Keywords field */}
               <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                     <span className="text-cyan-600 dark:text-cyan-400 select-none w-28 shrink-0 pt-1">
                        palavras_chave:
                     </span>
                     <div className="flex-1 space-y-2">
                        {/* Existing keywords */}
                        {localKeywords.length > 0 && (
                           <div className="flex flex-wrap gap-1.5">
                              {localKeywords.map((keyword) => (
                                 <Badge
                                    className="h-5 text-xs px-1.5 gap-1 font-mono"
                                    key={keyword}
                                    variant="secondary"
                                 >
                                    {keyword}
                                    <button
                                       aria-label={`Remover ${keyword}`}
                                       className="hover:text-destructive"
                                       onClick={() =>
                                          handleRemoveKeyword(keyword)
                                       }
                                       type="button"
                                    >
                                       <X className="size-3" />
                                    </button>
                                 </Badge>
                              ))}
                           </div>
                        )}

                        {/* Add keyword input */}
                        <div className="flex items-center gap-1">
                           <span className="text-muted-foreground select-none">
                              -
                           </span>
                           <Input
                              className={cn(
                                 "flex-1 h-6 px-1 py-0 border-0 rounded-none bg-transparent",
                                 "text-green-600 dark:text-green-400 placeholder:text-muted-foreground/50",
                                 "focus-visible:ring-0 focus-visible:ring-offset-0",
                                 "focus:bg-muted/30",
                              )}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              onKeyDown={handleKeywordKeyDown}
                              placeholder="adicionar palavra-chave"
                              value={keywordInput}
                           />
                           {keywordInput && (
                              <Button
                                 aria-label="Adicionar palavra-chave"
                                 className="size-5"
                                 onClick={handleAddKeyword}
                                 size="icon"
                                 type="button"
                                 variant="ghost"
                              >
                                 <Plus className="size-3" />
                              </Button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Closing delimiter */}
               <div className="text-muted-foreground select-none pt-1">---</div>
            </div>
         )}
      </div>
   );
}

// ============================================================================
// Sub-components
// ============================================================================

interface FrontmatterFieldProps {
   label: string;
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   suffix?: React.ReactNode;
}

function FrontmatterField({
   label,
   value,
   onChange,
   placeholder,
   suffix,
}: FrontmatterFieldProps) {
   return (
      <div className="flex items-center gap-2 group">
         <span className="text-cyan-600 dark:text-cyan-400 select-none w-28 shrink-0">
            {label}:
         </span>
         <span className="text-amber-600 dark:text-amber-400 select-none">
            "
         </span>
         <Input
            className={cn(
               "flex-1 h-6 px-0 py-0 border-0 rounded-none bg-transparent",
               "text-amber-600 dark:text-amber-400 placeholder:text-muted-foreground/50",
               "focus-visible:ring-0 focus-visible:ring-offset-0",
               "focus:bg-muted/30",
            )}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            value={value}
         />
         <span className="text-amber-600 dark:text-amber-400 select-none">
            "
         </span>
         {suffix && <div className="ml-1">{suffix}</div>}
      </div>
   );
}
