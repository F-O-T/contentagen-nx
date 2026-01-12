import { cn } from "@packages/ui/lib/utils";
import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Heading = {
   level: number;
   text: string;
   id: string;
};

type TableOfContentsProps = {
   content: string;
   className?: string;
   /** Container element to scroll (defaults to window) */
   scrollContainer?: HTMLElement | null;
   /** Whether to show the sticky "Back to top" button */
   showBackToTop?: boolean;
   /** Title for the TOC section */
   title?: string;
};

function extractHeadings(content: string): Heading[] {
   const headings: Heading[] = [];
   const regex = /^(#{2,6})\s+(.+)$/gm;
   let match: RegExpExecArray | null = null;

   while (true) {
      match = regex.exec(content);
      if (match === null) break;

      const hashMarks = match[1];
      const rawText = match[2];
      if (!hashMarks || !rawText) continue;

      const level = hashMarks.length;
      const text = rawText
         // Remove markdown formatting
         .replace(/\*\*(.+?)\*\*/g, "$1")
         .replace(/\*(.+?)\*/g, "$1")
         .replace(/`(.+?)`/g, "$1")
         .replace(/\[(.+?)\]\(.+?\)/g, "$1")
         .trim();

      // Generate a simple ID from the text
      const id = text
         .toLowerCase()
         .replace(/[^a-z0-9\s-]/g, "")
         .replace(/\s+/g, "-")
         .slice(0, 50);

      headings.push({ level, text, id });
   }

   return headings;
}

function HeadingItem({
   heading,
   isActive,
   onClick,
}: {
   heading: Heading;
   isActive: boolean;
   onClick: () => void;
}) {
   // Calculate indentation based on level (H2 = 0, H3 = 1, H4 = 2, etc.)
   const indent = (heading.level - 2) * 12;

   return (
      <li
         className={cn(
            "py-1.5 text-sm transition-colors cursor-pointer border-l-2 -ml-px",
            isActive
               ? "text-foreground font-medium border-primary"
               : "text-muted-foreground hover:text-foreground border-transparent hover:border-muted-foreground/50",
         )}
         onClick={onClick}
         onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
               onClick();
            }
         }}
         style={{ paddingLeft: `${indent + 12}px` }}
      >
         <span className="line-clamp-2">{heading.text}</span>
      </li>
   );
}

export function TableOfContents({
   content,
   className,
   scrollContainer,
   showBackToTop = true,
   title = "Nesta página",
}: TableOfContentsProps) {
   const headings = useMemo(() => extractHeadings(content), [content]);
   const [activeId, setActiveId] = useState<string | null>(null);
   const headingElementsRef = useRef<Map<string, HTMLElement>>(new Map());

   // Track active heading based on scroll position
   useEffect(() => {
      if (headings.length === 0) return;

      // Collect heading elements
      const headingElements = new Map<string, HTMLElement>();
      for (const heading of headings) {
         const element = document.getElementById(heading.id);
         if (element) {
            headingElements.set(heading.id, element);
         }
      }
      headingElementsRef.current = headingElements;

      // Set initial active heading (first one visible or first one)
      if (headingElements.size > 0 && !activeId) {
         const firstHeading = headings[0];
         if (firstHeading) {
            setActiveId(firstHeading.id);
         }
      }

      const handleScroll = () => {
         const scrollY = window.scrollY;
         const offset = 100; // Account for sticky header

         let currentActiveId: string | null = null;

         // Find the heading that is currently at the top of the viewport
         for (const heading of headings) {
            const element = headingElements.get(heading.id);
            if (element) {
               const rect = element.getBoundingClientRect();
               const elementTop = rect.top + scrollY;

               // If we've scrolled past this heading (with offset), it becomes active
               if (scrollY >= elementTop - offset) {
                  currentActiveId = heading.id;
               }
            }
         }

         // If we haven't scrolled past any heading, use the first one
         if (!currentActiveId && headings.length > 0) {
            currentActiveId = headings[0]?.id ?? null;
         }

         if (currentActiveId !== activeId) {
            setActiveId(currentActiveId);
         }
      };

      // Initial check
      handleScroll();

      // Listen to scroll events
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
         window.removeEventListener("scroll", handleScroll);
      };
   }, [headings, activeId]);

   const scrollToHeading = useCallback((id: string) => {
      const element = document.getElementById(id);
      if (element) {
         const offset = 80; // Account for sticky header
         const elementPosition = element.getBoundingClientRect().top;
         const offsetPosition = elementPosition + window.scrollY - offset;

         window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
         });

         // Update URL hash without jumping
         window.history.replaceState(null, "", `#${id}`);
         setActiveId(id);
      }
   }, []);

   const scrollToTop = useCallback(() => {
      if (scrollContainer) {
         scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } else {
         window.scrollTo({ top: 0, behavior: "smooth" });
      }
   }, [scrollContainer]);

   if (headings.length === 0) {
      return null;
   }

   return (
      <nav aria-label="Índice" className={cn("space-y-3", className)}>
         {/* Title */}
         <h3 className="text-sm font-semibold text-foreground">{title}</h3>

         {/* Headings list - scrollable when too long */}
         <ul className="space-y-0 border-l border-border max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-2">
            {headings.map((heading) => (
               <HeadingItem
                  heading={heading}
                  isActive={activeId === heading.id}
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
               />
            ))}
         </ul>

         {/* Back to top */}
         {showBackToTop && (
            <button
               className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-3 border-t border-border w-full"
               onClick={scrollToTop}
               type="button"
            >
               <ChevronUp className="size-4" />
               Voltar ao topo
            </button>
         )}
      </nav>
   );
}
