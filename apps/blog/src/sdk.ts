import { createSdk } from "@contentagen/sdk";

// Use your local server URL for development
export const sdk = createSdk({
   apiKey: "lsKhFpWdKwNogiTzKPEKvmwxiIKEzmtIDSknBpqTkSPJQeYcBbwwNzfpvlcbxtUr", // Replace with your local dev key or env var
   apiUrl: "http://localhost:9876", // Change to your local server URL
});
