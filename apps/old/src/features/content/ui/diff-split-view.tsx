import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import type { LineDiff } from "@packages/utils/diff";
import { useCallback, useMemo, useRef } from "react";

type DiffSplitViewProps = {
   originalText: string;
   suggestedText: string;
   originalTitle: string;
   suggestedTitle: string;
   diff: LineDiff;
};

type DiffLineType =
   | "unchanged"
   | "removed"
   | "added"
   | "modified-old"
   | "modified-new"
   | "empty";

type DiffLineData = {
   lineNumber: number | null;
   content: string;
   type: DiffLineType;
   inlineChanges?: Array<{
      type: "add" | "remove" | "unchanged";
      text: string;
   }>;
};

export function DiffSplitView({
   originalText,
   suggestedText,
   originalTitle,
   suggestedTitle,
   diff,
}: DiffSplitViewProps) {
   const leftScrollRef = useRef<HTMLDivElement>(null);
   const rightScrollRef = useRef<HTMLDivElement>(null);
   const isScrollingSyncRef = useRef(false);

   // Sync scroll between panes
   const handleScroll = useCallback((source: "left" | "right") => {
      if (isScrollingSyncRef.current) return;

      const sourceRef = source === "left" ? leftScrollRef : rightScrollRef;
      const targetRef = source === "left" ? rightScrollRef : leftScrollRef;

      if (sourceRef.current && targetRef.current) {
         isScrollingSyncRef.current = true;
         targetRef.current.scrollTop = sourceRef.current.scrollTop;
         requestAnimationFrame(() => {
            isScrollingSyncRef.current = false;
         });
      }
   }, []);

   // Process diff into left/right line pairs
   const { leftLines, rightLines, stats } = useMemo(() => {
      const left: DiffLineData[] = [];
      const right: DiffLineData[] = [];

      let origIdx = 0;
      let suggIdx = 0;
      let addedCount = 0;
      let removedCount = 0;
      let modifiedCount = 0;

      // If diff is empty, show full content as unchanged
      if (diff.length === 0) {
         const originalLines = originalText.split("\n");
         const suggestedLines = suggestedText.split("\n");

         for (
            let i = 0;
            i < Math.max(originalLines.length, suggestedLines.length);
            i++
         ) {
            const origLine = originalLines[i];
            const suggLine = suggestedLines[i];

            if (origLine === suggLine) {
               left.push({
                  lineNumber: i + 1,
                  content: origLine ?? "",
                  type: "unchanged",
               });
               right.push({
                  lineNumber: i + 1,
                  content: suggLine ?? "",
                  type: "unchanged",
               });
            } else if (origLine !== undefined && suggLine !== undefined) {
               // Modified line
               left.push({
                  lineNumber: i + 1,
                  content: origLine,
                  type: "modified-old",
               });
               right.push({
                  lineNumber: i + 1,
                  content: suggLine,
                  type: "modified-new",
               });
               modifiedCount++;
            } else if (origLine !== undefined) {
               // Removed line
               left.push({
                  lineNumber: i + 1,
                  content: origLine,
                  type: "removed",
               });
               right.push({
                  lineNumber: null,
                  content: "",
                  type: "empty",
               });
               removedCount++;
            } else if (suggLine !== undefined) {
               // Added line
               left.push({
                  lineNumber: null,
                  content: "",
                  type: "empty",
               });
               right.push({
                  lineNumber: i + 1,
                  content: suggLine,
                  type: "added",
               });
               addedCount++;
            }
         }
      } else {
         for (const item of diff) {
            switch (item.type) {
               case "context":
                  left.push({
                     lineNumber: origIdx + 1,
                     content: item.content,
                     type: "unchanged",
                  });
                  right.push({
                     lineNumber: suggIdx + 1,
                     content: item.content,
                     type: "unchanged",
                  });
                  origIdx++;
                  suggIdx++;
                  break;
               case "remove":
                  left.push({
                     lineNumber: origIdx + 1,
                     content: item.content,
                     type: "removed",
                  });
                  right.push({
                     lineNumber: null,
                     content: "",
                     type: "empty",
                  });
                  origIdx++;
                  removedCount++;
                  break;
               case "add":
                  left.push({
                     lineNumber: null,
                     content: "",
                     type: "empty",
                  });
                  right.push({
                     lineNumber: suggIdx + 1,
                     content: item.content,
                     type: "added",
                  });
                  suggIdx++;
                  addedCount++;
                  break;
               case "modify":
                  left.push({
                     lineNumber: origIdx + 1,
                     content: item.oldContent || item.content,
                     type: "modified-old",
                     inlineChanges: item.inlineChanges,
                  });
                  right.push({
                     lineNumber: suggIdx + 1,
                     content: item.content,
                     type: "modified-new",
                     inlineChanges: item.inlineChanges,
                  });
                  origIdx++;
                  suggIdx++;
                  modifiedCount++;
                  break;
            }
         }
      }

      return {
         leftLines: left,
         rightLines: right,
         stats: {
            added: addedCount,
            removed: removedCount,
            modified: modifiedCount,
         },
      };
   }, [diff, originalText, suggestedText]);

   return (
      <div className="flex h-full flex-col">
         {/* Stats bar */}
         <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-xs font-mono">
            <span className="text-green-600">+{stats.added} adicionadas</span>
            <span className="text-red-500">-{stats.removed} removidas</span>
            <span className="text-yellow-600">
               ~{stats.modified} modificadas
            </span>
         </div>

         {/* Split panes */}
         <div className="flex flex-1 overflow-hidden">
            {/* Left pane (Original) */}
            <div className="flex flex-1 flex-col border-r">
               <div className="px-4 py-2 bg-red-500/10 border-b font-medium text-sm flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500" />
                  {originalTitle}
               </div>
               <ScrollArea className="flex-1">
                  <div
                     className="font-mono text-sm"
                     onScroll={() => handleScroll("left")}
                     ref={leftScrollRef}
                  >
                     {leftLines.map((line, idx) => (
                        <DiffLineRow
                           key={`left-${idx + 1}`}
                           line={line}
                           side="left"
                        />
                     ))}
                  </div>
               </ScrollArea>
            </div>

            {/* Right pane (Suggested) */}
            <div className="flex flex-1 flex-col">
               <div className="px-4 py-2 bg-green-500/10 border-b font-medium text-sm flex items-center gap-2">
                  <span className="size-2 rounded-full bg-green-500" />
                  {suggestedTitle}
               </div>
               <ScrollArea className="flex-1">
                  <div
                     className="font-mono text-sm"
                     onScroll={() => handleScroll("right")}
                     ref={rightScrollRef}
                  >
                     {rightLines.map((line, idx) => (
                        <DiffLineRow
                           key={`right-${idx + 1}`}
                           line={line}
                           side="right"
                        />
                     ))}
                  </div>
               </ScrollArea>
            </div>
         </div>
      </div>
   );
}

function DiffLineRow({
   line,
   side,
}: {
   line: DiffLineData;
   side: "left" | "right";
}) {
   const bgClass = {
      unchanged: "",
      removed: "bg-red-500/15",
      added: "bg-green-500/15",
      "modified-old": "bg-yellow-500/10",
      "modified-new": "bg-yellow-500/10",
      empty: "bg-muted/30",
   }[line.type];

   const lineNumberClass = {
      unchanged: "text-muted-foreground",
      removed: "text-red-500",
      added: "text-green-500",
      "modified-old": "text-yellow-600",
      "modified-new": "text-yellow-600",
      empty: "",
   }[line.type];

   const prefixSymbol = {
      unchanged: " ",
      removed: "-",
      added: "+",
      "modified-old": "~",
      "modified-new": "~",
      empty: " ",
   }[line.type];

   const prefixColor = {
      unchanged: "text-muted-foreground",
      removed: "text-red-500",
      added: "text-green-500",
      "modified-old": "text-yellow-600",
      "modified-new": "text-yellow-600",
      empty: "",
   }[line.type];

   return (
      <div className={cn("flex min-h-[1.5rem] hover:bg-accent/30", bgClass)}>
         {/* Line number */}
         <div
            className={cn(
               "w-12 flex-shrink-0 px-2 text-right select-none border-r bg-muted/20",
               lineNumberClass,
            )}
         >
            {line.lineNumber ?? ""}
         </div>

         {/* Prefix (+/-/~) */}
         <div
            className={cn(
               "w-6 flex-shrink-0 text-center select-none font-bold",
               prefixColor,
            )}
         >
            {prefixSymbol}
         </div>

         {/* Content */}
         <div className="flex-1 px-2 whitespace-pre-wrap break-all">
            {line.inlineChanges ? (
               <InlineChanges
                  changes={line.inlineChanges}
                  lineType={line.type}
                  side={side}
               />
            ) : (
               <span
                  className={cn(
                     line.type === "removed" && "line-through opacity-70",
                  )}
               >
                  {line.content || "\u00A0"}
               </span>
            )}
         </div>
      </div>
   );
}

function InlineChanges({
   changes,
   side,
   lineType,
}: {
   changes: Array<{ type: "add" | "remove" | "unchanged"; text: string }>;
   side: "left" | "right";
   lineType: DiffLineType;
}) {
   return (
      <>
         {changes.map((change, idx) => {
            // On left side (original), show unchanged + removed
            // On right side (suggested), show unchanged + added
            if (side === "left" && change.type === "add") return null;
            if (side === "right" && change.type === "remove") return null;

            return (
               <span
                  className={cn(
                     change.type === "remove" &&
                        "bg-red-500/40 line-through text-red-700 dark:text-red-300",
                     change.type === "add" &&
                        "bg-green-500/40 text-green-700 dark:text-green-300",
                     lineType === "removed" &&
                        change.type === "unchanged" &&
                        "opacity-70",
                  )}
                  key={`inline-${idx + 1}`}
               >
                  {change.text}
               </span>
            );
         })}
      </>
   );
}
