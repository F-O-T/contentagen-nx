/**
 * Test Setup for Bun
 *
 * Configures the test environment with required mocks and utilities.
 */
import { mock } from "bun:test";

// Mock crypto.randomUUID for consistent test IDs
let uuidCounter = 0;
export function resetUuidCounter(): void {
   uuidCounter = 0;
}

// Create a mock crypto with randomUUID
const mockCrypto = {
   ...globalThis.crypto,
   randomUUID: () => `test-uuid-${++uuidCounter}`,
};

// Only mock if needed (Bun may already have crypto)
if (!globalThis.crypto?.randomUUID) {
   // @ts-expect-error - Mocking global crypto
   globalThis.crypto = mockCrypto;
}

// Export utilities for tests
export const createMockAbortController = () => ({
   signal: { aborted: false },
   abort: mock(() => {}),
});

export const createMockAsyncIterable = <T>(chunks: T[]): AsyncIterable<T> => ({
   [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
         yield chunk;
      }
   },
});
