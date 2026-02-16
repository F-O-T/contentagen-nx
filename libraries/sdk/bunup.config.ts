import { defineConfig } from "bunup";

export default defineConfig({
	dts: {
		inferTypes: true,
	},
	entry: [
		"src/index.ts",
		"src/posthog.ts",
		"src/analytics.ts",
		"src/events/client.ts",
		"src/events/types.ts",
		"src/events/server.ts",
		"src/forms.ts",
		"src/browser.ts",
	],
});
