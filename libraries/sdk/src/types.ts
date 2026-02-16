/**
 * SDK Type Definitions
 *
 * This file contains type exports for the Contentta SDK.
 * All runtime types are inferred from the oRPC router at sdk-server/src/orpc/router/*.
 *
 * We only maintain minimal helper types here for backward compatibility and documentation.
 */

import type { createSdk } from "./index";

/**
 * SDK Router Type
 *
 * Inferred from the oRPC client created by createSdk().
 * Use this type for fully type-safe SDK client instances.
 *
 * @example
 * ```typescript
 * import type { SdkRouter } from "@contentta/sdk";
 *
 * const sdk = createSdk({ apiKey: "..." });
 * // sdk is of type SdkRouter
 * ```
 */
export type SdkRouter = ReturnType<typeof createSdk>;
