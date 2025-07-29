import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
   project: "proj_kkaegqaziihtszewfeqn",
   runtime: "node",
   build: {
      external: ["onnxruntime-node"],
   },
   logLevel: "log",
   maxDuration: 3600,
   retries: {
      enabledInDev: true,
      default: {
         maxAttempts: 3,
         minTimeoutInMs: 1000,
         maxTimeoutInMs: 10000,
         factor: 2,
         randomize: true,
      },
   },
   dirs: ["./src/trigger"],
});
