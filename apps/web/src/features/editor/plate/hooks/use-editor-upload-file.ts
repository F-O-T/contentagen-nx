'use client';

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { orpc } from '@/integrations/orpc/client';

export interface UseEditorUploadFileOptions {
  teamId?: string;
}

export interface UploadedFile {
  url: string;
  name: string;
}

/**
 * Returns the dimensions of an image file using a temporary object URL.
 */
function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image dimensions'));
    };
    img.src = objectUrl;
  });
}

/**
 * Hook that returns an `uploadFile` function compatible with the PlaceholderPlugin
 * upload flow. Generates a presigned MinIO URL, PUTs the file directly, then
 * completes the upload by recording it in the database via oRPC.
 *
 * @param options.teamId - Optional team ID to scope the asset.
 * @returns A stable `uploadFile(file)` callback.
 */
export function useEditorUploadFile({ teamId }: UseEditorUploadFileOptions = {}): (
  file: File,
) => Promise<UploadedFile> {
  const generateUrl = useMutation(
    orpc.assets.generateUploadUrl.mutationOptions(),
  );
  const completeUpload = useMutation(
    orpc.assets.completeUpload.mutationOptions(),
  );

  return useCallback(
    async (file: File): Promise<UploadedFile> => {
      // Step 1: Generate a presigned PUT URL from the server
      const { presignedUrl, fileKey, publicUrl } =
        await generateUrl.mutateAsync({
          teamId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

      // Step 2: Upload the file directly to MinIO via presigned URL
      const putResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!putResponse.ok) {
        throw new Error(
          `File upload failed: ${putResponse.status} ${putResponse.statusText}`,
        );
      }

      // Step 3: Get image dimensions if the file is an image
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith('image/')) {
        try {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        } catch {
          // Non-critical — proceed without dimensions
        }
      }

      // Step 4: Register the asset in the database
      const asset = await completeUpload.mutateAsync({
        teamId,
        fileKey,
        publicUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        width,
        height,
      });

      return { url: asset.publicUrl, name: asset.filename };
    },
    // biome-ignore lint/correctness/useExhaustiveDependencies: mutation fns are stable
    [teamId, generateUrl.mutateAsync, completeUpload.mutateAsync],
  );
}
