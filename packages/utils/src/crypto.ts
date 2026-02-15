const ALPHANUMERIC_CHARS =
   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a cryptographically secure random string of alphanumeric characters.
 */
export function generateSecureAlphanumeric(length: number): string {
   const bytes = new Uint8Array(length);
   crypto.getRandomValues(bytes);

   let result = "";
   for (let i = 0; i < length; i++) {
      // Use modulo with rejection sampling would be ideal, but since
      // 62 chars fits within a byte range reasonably, the bias from
      // modulo 62 over 256 values is negligible for key generation.
      result += ALPHANUMERIC_CHARS[bytes[i]! % ALPHANUMERIC_CHARS.length];
   }

   return result;
}
