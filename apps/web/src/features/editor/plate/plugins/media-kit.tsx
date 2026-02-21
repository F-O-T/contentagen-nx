"use client";

/**
 * MediaKit — Plate.js plugin array for image / video / audio / file upload.
 *
 * Wires together:
 *  - ImagePlugin   → ImageElement (from @packages/ui)
 *  - VideoPlugin   → VideoElement (from @packages/ui)
 *  - AudioPlugin   → AudioElement (from @packages/ui)
 *  - FilePlugin    → FileElement  (from @packages/ui)
 *  - CaptionPlugin → allowed on img, video, audio, file
 *  - PlaceholderPlugin → handles drag-and-drop / paste, uploadConfig limits
 *
 * The actual upload is performed by MediaPlaceholderElement which reads the
 * uploadFile fn from UploadFileContext. UploadFileProvider must wrap the
 * <Plate> tree — this is done in PlateEditor.
 */

import { AudioElement } from "@packages/ui/components/media-audio-node";
import { FileElement } from "@packages/ui/components/media-file-node";
import { ImageElement } from "@packages/ui/components/media-image-node";
import { VideoElement } from "@packages/ui/components/media-video-node";
import { CaptionPlugin } from "@platejs/caption/react";
import {
   AudioPlugin,
   FilePlugin,
   ImagePlugin,
   PlaceholderPlugin,
   VideoPlugin,
} from "@platejs/media/react";
import { KEYS } from "platejs";
import type { UploadedFile } from "../hooks/use-editor-upload-file";
import {
   MediaPlaceholderElement,
   UploadFileProvider,
} from "../ui/media-placeholder-element";

type UploadFileFn = (file: File) => Promise<UploadedFile>;

/**
 * createMediaKit — returns an array of Plate plugins configured for media
 * upload via `uploadFile`.
 *
 * Usage:
 * ```tsx
 * const uploadFile = useEditorUploadFile({ teamId });
 * const MediaKit = createMediaKit(uploadFile);
 * // ...
 * plugins: [...MediaKit, ...otherPlugins]
 * ```
 *
 * Wrap the editor in <UploadFileProvider value={uploadFile}> so the
 * MediaPlaceholderElement can access it. PlateEditor does this automatically.
 */
// biome-ignore lint/correctness/noUnusedVariables: uploadFile is consumed by MediaPlaceholderElement via UploadFileContext — must be passed to PlateEditor to wire up uploads
export function createMediaKit(_uploadFile: UploadFileFn) {
   return [
      ImagePlugin.withComponent(ImageElement),
      VideoPlugin.withComponent(VideoElement),
      AudioPlugin.withComponent(AudioElement),
      FilePlugin.withComponent(FileElement),

      CaptionPlugin.configure({
         options: {
            query: {
               allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file],
            },
         },
      }),

      PlaceholderPlugin.configure({
         render: {
            node: MediaPlaceholderElement,
         },
         options: {
            uploadConfig: {
               audio: {
                  maxFileCount: 1,
                  maxFileSize: "16MB",
                  mediaType: KEYS.audio,
                  minFileCount: 1,
               },
               blob: {
                  maxFileCount: 1,
                  maxFileSize: "64MB",
                  mediaType: KEYS.file,
                  minFileCount: 1,
               },
               image: {
                  maxFileCount: 5,
                  maxFileSize: "16MB",
                  mediaType: KEYS.img,
                  minFileCount: 1,
               },
               pdf: {
                  maxFileCount: 1,
                  maxFileSize: "32MB",
                  mediaType: KEYS.file,
                  minFileCount: 1,
               },
               text: {
                  maxFileCount: 1,
                  maxFileSize: "4MB",
                  mediaType: KEYS.file,
                  minFileCount: 1,
               },
               video: {
                  maxFileCount: 1,
                  maxFileSize: "128MB",
                  mediaType: KEYS.video,
                  minFileCount: 1,
               },
            },
         },
      }),
   ] as const;
}

// Re-export UploadFileProvider so PlateEditor can import it from one place
export { UploadFileProvider };
export type { UploadFileFn };
