/**
 * PlateEditor — minimal Plate.js editor component.
 *
 * Runs alongside the existing Lexical editor during migration.
 * Provides basic rich-text editing with heading, marks, and list support.
 */

import {
   BasicBlocksPlugin,
   BasicMarksPlugin,
} from "@platejs/basic-nodes/react";
import { LinkPlugin } from "@platejs/link/react";
import type { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { cn } from "@packages/ui/lib/utils";

export interface PlateEditorProps {
   initialValue?: Value;
   onChange?: (value: Value) => void;
   placeholder?: string;
   editable?: boolean;
   className?: string;
}

export function PlateEditor({
   initialValue,
   onChange,
   placeholder = "Start writing…",
   editable = true,
   className,
}: PlateEditorProps) {
   const editor = usePlateEditor({
      plugins: [BasicBlocksPlugin, BasicMarksPlugin, LinkPlugin],
      value: initialValue,
   });

   return (
      <Plate
         editor={editor}
         onValueChange={onChange ? ({ value }) => onChange(value) : undefined}
         readOnly={!editable}
      >
         <PlateContent
            className={cn(
               "min-h-[200px] w-full cursor-text rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background",
               "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
               "prose prose-sm max-w-none dark:prose-invert",
               "[&_h1]:text-3xl [&_h1]:font-bold",
               "[&_h2]:text-2xl [&_h2]:font-semibold",
               "[&_h3]:text-xl [&_h3]:font-medium",
               "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
               className,
            )}
            placeholder={placeholder}
            disableDefaultStyles
         />
      </Plate>
   );
}
