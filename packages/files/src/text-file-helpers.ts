import { gzipSync } from "fflate";

export const AGENT_FILE_UPLOAD_LIMIT = 5;

export function compressMarkdown(inputBuffer: Buffer): Buffer {
   return Buffer.from(gzipSync(inputBuffer));
}
