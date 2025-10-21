import { createSdk } from "@contentagen/sdk";
import { serverEnv } from "@packages/environment/server";

export const contentaSdk = createSdk({
   apiKey: serverEnv.CONTENTAGEN_API_KEY,
});
