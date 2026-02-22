"use client";

import type { ContentMeta } from "@packages/database/schemas/content";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Input } from "@packages/ui/components/input";
import { ChevronDown, ChevronRight, Link, Lock, Unlock, X } from "lucide-react";
import {
   type KeyboardEvent,
   useCallback,
   useEffect,
   useRef,
   useState,
} from "react";

interface FrontmatterSectionProps {
   meta: ContentMeta;
   onChange: (meta: ContentMeta) => void;
   readOnly?: boolean;
}

function toSlug(title: string): string {
   return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
}

export function FrontmatterSection({
   meta,
   onChange,
   readOnly = false,
}: FrontmatterSectionProps) {
   const [isOpen, setIsOpen] = useState(true);
   const [keywordInput, setKeywordInput] = useState("");
   const [slugLocked, setSlugLocked] = useState(!!meta.slug);

   const prevTitleRef = useRef(meta.title ?? "");

   // Auto-generate slug from title when not locked
   useEffect(() => {
      if (slugLocked) return;
      if (meta.title === prevTitleRef.current) return;
      prevTitleRef.current = meta.title ?? "";
      const generated = toSlug(meta.title ?? "");
      if (generated !== (meta.slug ?? "")) {
         onChange({ ...meta, slug: generated });
      }
   }, [meta.title, slugLocked]);

   const handleField = useCallback(
      (field: keyof ContentMeta, value: string | string[]) => {
         onChange({ ...meta, [field]: value });
      },
      [meta, onChange],
   );

   const handleSlugChange = useCallback(
      (value: string) => {
         setSlugLocked(true);
         handleField("slug", value);
      },
      [handleField],
   );

   const handleAddKeyword = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
         if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const kw = keywordInput.trim().replace(/,$/, "");
            if (kw && !(meta.keywords ?? []).includes(kw)) {
               handleField("keywords", [...(meta.keywords ?? []), kw]);
            }
            setKeywordInput("");
         }
      },
      [keywordInput, meta.keywords, handleField],
   );

   const handleRemoveKeyword = useCallback(
      (kw: string) => {
         handleField(
            "keywords",
            (meta.keywords ?? []).filter((k) => k !== kw),
         );
      },
      [meta.keywords, handleField],
   );

   return (
      <div className="border-b bg-background">
         {/* Header row with toggle */}
         <Button
            className="flex w-full h-auto items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors justify-start rounded-none font-normal"
            onClick={() => setIsOpen((v) => !v)}
            type="button"
            variant="ghost"
         >
            {isOpen ? (
               <ChevronDown className="size-3 shrink-0" />
            ) : (
               <ChevronRight className="size-3 shrink-0" />
            )}
            <span className="font-medium tracking-wide uppercase">
               Metadados
            </span>
            {!isOpen && meta.title && (
               <span className="ml-2 truncate text-foreground/70 normal-case font-normal">
                  {meta.title}
               </span>
            )}
         </Button>

         {isOpen && (
            <div className="px-4 pb-4 space-y-2.5">
               {/* Title */}
               <Input
                  className="text-xl font-semibold h-auto border-0 border-b border-border/50 rounded-none bg-transparent px-0 py-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-foreground/30 placeholder:text-muted-foreground/30 transition-colors"
                  onChange={(e) => handleField("title", e.target.value)}
                  placeholder="Título do conteúdo"
                  readOnly={readOnly}
                  value={meta.title ?? ""}
               />

               {/* Description */}
               <Input
                  className="h-auto border-0 border-b border-border/40 rounded-none bg-transparent px-0 py-1 text-sm text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-foreground/20 placeholder:text-muted-foreground/25 transition-colors"
                  onChange={(e) => handleField("description", e.target.value)}
                  placeholder="Meta description (SEO)…"
                  readOnly={readOnly}
                  value={meta.description ?? ""}
               />

               {/* Slug row */}
               <div className="flex items-center gap-1.5">
                  <Link className="size-3 text-muted-foreground/50 shrink-0" />
                  <span className="text-xs text-muted-foreground/60 shrink-0">
                     /conteudo/
                  </span>
                  <Input
                     className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-muted-foreground font-mono focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/25"
                     onChange={(e) => handleSlugChange(e.target.value)}
                     placeholder="slug-do-conteudo"
                     readOnly={readOnly}
                     value={meta.slug ?? ""}
                  />
                  {!readOnly && (
                     <Button
                        className="shrink-0 size-5 text-muted-foreground/40 hover:text-muted-foreground"
                        onClick={() => setSlugLocked((v) => !v)}
                        size="icon"
                        title={
                           slugLocked
                              ? "Desbloquear slug (auto-gerado do título)"
                              : "Bloquear slug (edição manual)"
                        }
                        type="button"
                        variant="ghost"
                     >
                        {slugLocked ? (
                           <Lock className="size-3" />
                        ) : (
                           <Unlock className="size-3" />
                        )}
                     </Button>
                  )}
               </div>

               {/* Keywords */}
               <div className="flex items-center gap-1.5 flex-wrap min-h-[1.5rem]">
                  {(meta.keywords ?? []).map((kw) => (
                     <Badge
                        className="gap-1 pl-2 pr-1 h-5 text-[10px] font-normal"
                        key={kw}
                        variant="secondary"
                     >
                        {kw}
                        {!readOnly && (
                           <Button
                              className="size-3.5 ml-0.5 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent"
                              onClick={() => handleRemoveKeyword(kw)}
                              size="icon"
                              type="button"
                              variant="ghost"
                           >
                              <X className="size-2.5" />
                           </Button>
                        )}
                     </Badge>
                  ))}
                  {!readOnly && (
                     <Input
                        className="h-5 w-24 border-0 bg-transparent p-0 text-[10px] text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/25"
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleAddKeyword}
                        placeholder="+ keyword"
                        value={keywordInput}
                     />
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
