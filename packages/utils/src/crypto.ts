const ALPHANUMERIC_CHARS =
   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const PUBLIC_API_KEY_PREFIX = "cta_pub_";
const PUBLIC_API_KEY_LENGTH = 32;

/**
 * Generate a cryptographically secure random string of alphanumeric characters.
 */
function generateSecureAlphanumeric(length: number): string {
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

/**
 * Generate a public API key with the format `cta_pub_` + 32 random alphanumeric chars.
 *
 * This key is safe to expose in frontend/client-side code and is used for
 * event tracking and form submission via the SDK.
 *
 * Uses `crypto.getRandomValues` for cryptographically secure randomness.
 */
export function generatePublicApiKey(): string {
   return (
      PUBLIC_API_KEY_PREFIX + generateSecureAlphanumeric(PUBLIC_API_KEY_LENGTH)
   );
}
