"use client";

/**
 * MediaPlaceholderElement — renders the in-editor upload placeholder.
 *
 * When Plate.js inserts a placeholder node (via drag-and-drop or paste),
 * this component picks up the File from PlaceholderPlugin's `uploadingFiles`
 * store and calls the `uploadFile` function provided via context.
 *
 * Progress is reported into the local PlaceholderStore so the UI can show
 * a spinner / progress bar.
 */

import { cn } from "@packages/ui/lib/utils";
import {
   PlaceholderPlugin,
   PlaceholderProvider,
   usePlaceholderElementState,
   usePlaceholderSet,
} from "@platejs/media/react";
import { KEYS } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef, useElement } from "platejs/react";
import * as React from "react";
import { useEffect, useRef } from "react";
import type { UploadedFile } from "../hooks/use-editor-upload-file";

// ---------------------------------------------------------------------------
// Context — the uploadFile fn is passed down from MediaKit
// ---------------------------------------------------------------------------

type UploadFileFn = (file: File) => Promise<UploadedFile>;

const UploadFileContext = React.createContext<UploadFileFn | null>(null);

export const UploadFileProvider = UploadFileContext.Provider;

// ---------------------------------------------------------------------------
// Inner component (needs PlaceholderProvider HOC)
// ---------------------------------------------------------------------------

function MediaPlaceholderInner(props: PlateElementProps) {
   const editor = useEditorRef();
   const element = useElement(KEYS.placeholder);
   const { progressing, mediaType, progresses, focused, selected } =
      usePlaceholderElementState();
   const setIsUploading = usePlaceholderSet("isUploading");
   const setProgresses = usePlaceholderSet("progresses");
   const setUpdatedFiles = usePlaceholderSet("updatedFiles");

   const uploadFile = React.useContext(UploadFileContext);
   const uploadedRef = useRef(false);

   const { id } = element as unknown as { id: string; mediaType: string };

   // Retrieve the File that PlaceholderPlugin stored when the node was created
   useEffect(() => {
      if (uploadedRef.current || !uploadFile) return;

      const file = editor
         .getApi(PlaceholderPlugin)
         .placeholder.getUploadingFile(id);
      if (!file) return;

      uploadedRef.current = true;
      setIsUploading(true);
      setUpdatedFiles([file]);

      (async () => {
         try {
            // Fake progress while upload runs
            setProgresses({ [id]: 0 });

            const result = await uploadFile(file);

            setProgresses({ [id]: 100 });

            // Replace placeholder node with the real media node
            editor.tf.withoutSaving(() => {
               const path = editor.api.findPath(element);
               if (!path) return;

               let nodeType: string;
               if (mediaType === KEYS.img) nodeType = KEYS.img;
               else if (mediaType === KEYS.video) nodeType = KEYS.video;
               else if (mediaType === KEYS.audio) nodeType = KEYS.audio;
               else nodeType = KEYS.file;

               editor.tf.removeNodes({ at: path });
               editor.tf.insertNodes(
                  {
                     type: nodeType,
                     url: result.url,
                     name: result.name,
                     children: [{ text: "" }],
                  },
                  { at: path },
               );
            });
         } catch {
            // On failure, remove the placeholder node so the editor doesn't get stuck
            const path = editor.api.findPath(element);
            if (path) editor.tf.removeNodes({ at: path });
         } finally {
            editor
               .getApi(PlaceholderPlugin)
               .placeholder.removeUploadingFile(id);
            setIsUploading(false);
            setUpdatedFiles([]);
         }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const label =
      mediaType === KEYS.img
         ? "Uploading image…"
         : mediaType === KEYS.video
           ? "Uploading video…"
           : mediaType === KEYS.audio
             ? "Uploading audio…"
             : "Uploading file…";

   const progress = progresses[id] ?? 0;

   return (
      <PlateElement
         {...props}
         className={cn(
            "relative my-2 flex h-16 w-full select-none items-center justify-center rounded-md border border-dashed border-input bg-muted/30 text-sm text-muted-foreground",
            focused && selected && "ring-2 ring-ring ring-offset-2",
         )}
      >
         <div
            className="flex flex-col items-center gap-1"
            contentEditable={false}
         >
            <span>{label}</span>
            {progressing && (
               <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                     className="h-full bg-primary transition-all duration-300"
                     style={{ width: `${progress}%` }}
                  />
               </div>
            )}
         </div>
         {props.children}
      </PlateElement>
   );
}

// ---------------------------------------------------------------------------
// Exported element wrapped in PlaceholderProvider
// ---------------------------------------------------------------------------

export const MediaPlaceholderElement = React.forwardRef<
   HTMLDivElement,
   PlateElementProps
>((props, _ref) => (
   <PlaceholderProvider>
      <MediaPlaceholderInner {...props} />
   </PlaceholderProvider>
));

MediaPlaceholderElement.displayName = "MediaPlaceholderElement";
